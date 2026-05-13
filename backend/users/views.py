from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings

from .models import PerfilUsuario
from .serializers import (
    RegisterSerializer, 
    PerfilSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — Registro de usuario."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {'message': f'Usuario {user.username} creado exitosamente.'},
            status=status.HTTP_201_CREATED
        )


class MeView(APIView):
    """GET/PUT /api/auth/me/ — Perfil del usuario autenticado."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        perfil, _ = PerfilUsuario.objects.get_or_create(usuario=request.user)
        serializer = PerfilSerializer(perfil)
        return Response(serializer.data)

    def put(self, request):
        perfil, _ = PerfilUsuario.objects.get_or_create(usuario=request.user)
        serializer = PerfilSerializer(perfil, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request):
        return self.put(request)

class PasswordResetRequestView(APIView):
    """POST /api/auth/password-reset/ — Solicita un enlace de restablecimiento."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Para evitar enumeración de correos, no revelamos si existe o no.
            return Response({'message': 'Si el correo existe, se enviará un enlace de recuperación.'}, status=status.HTTP_200_OK)

        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        # Generar enlace
        # Idealmente VITE_API_BASE_URL no, sino el origen del request o una variable de entorno FRONTEND_URL
        frontend_url = request.META.get('HTTP_ORIGIN', 'http://localhost:5173')
        reset_link = f"{frontend_url}/reset-password/{uidb64}/{token}"

        # Enviar correo
        send_mail(
            subject='Restablecimiento de Contraseña - Quiniela Mundial 2026',
            message=f'Hola {user.username},\n\nHaz clic en el siguiente enlace para restablecer tu contraseña:\n\n{reset_link}\n\nSi no solicitaste esto, ignora este correo.',
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@quiniela2026.com'),
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response({'message': 'Si el correo existe, se enviará un enlace de recuperación.'}, status=status.HTTP_200_OK)

class PasswordResetConfirmView(APIView):
    """POST /api/auth/password-reset-confirm/ — Confirma la nueva contraseña."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uidb64 = serializer.validated_data['uidb64']
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response({'message': 'Contraseña actualizada correctamente.'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'El enlace de recuperación no es válido o ha expirado.'}, status=status.HTTP_400_BAD_REQUEST)

class AdminUserViewSet(generics.ListAPIView):
    """GET /api/auth/admin/users/ — Lista todos los usuarios registrados."""
    permission_classes = [IsAuthenticated] # Se asume verificación extra o se cambia a IsAdminUser
    serializer_class = PerfilSerializer
    
    def get_queryset(self):
        # Protegemos la vista asegurando que solo admins puedan acceder
        user = self.request.user
        if not (user.is_superuser or user.is_staff or getattr(user, 'is_admin', False)):
            return PerfilUsuario.objects.none()
        return PerfilUsuario.objects.all().order_by('id')
