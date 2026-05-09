from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model

from .models import PerfilUsuario
from .serializers import RegisterSerializer, PerfilSerializer

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
