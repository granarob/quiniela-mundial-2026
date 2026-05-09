from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from django.db.models import Sum, Count, Q
from django.db import transaction

from .models import (
    Equipo, Grupo, Fase, Partido, Jugador,
    PronosticoPartido, PronosticoTorneo
)
from .serializers import (
    EquipoSerializer, GrupoSerializer, FaseSerializer,
    PartidoListSerializer, PartidoDetailSerializer,
    JugadorSerializer, PronosticoPartidoSerializer,
    PronosticoBulkSerializer, PronosticoTorneoSerializer
)


class EquipoViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/equipos/ — Las 48 selecciones."""
    queryset = Equipo.objects.all()
    serializer_class = EquipoSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'nombre_corto', 'confederacion']
    ordering_fields = ['ranking_fifa', 'nombre', 'confederacion']


class GrupoViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/grupos/ — Los 12 grupos con equipos y partidos."""
    queryset = Grupo.objects.prefetch_related(
        'grupoequipo_set__equipo', 'partidos__equipo_local', 'partidos__equipo_visitante'
    ).all()
    serializer_class = GrupoSerializer
    permission_classes = [AllowAny]
    lookup_field = 'letra'

    @action(detail=True, methods=['get'], url_path='partidos')
    def partidos(self, request, letra=None):
        """GET /api/grupos/{letra}/partidos/ — Partidos de un grupo."""
        grupo = self.get_object()
        partidos = grupo.partidos.select_related(
            'equipo_local', 'equipo_visitante', 'fase'
        ).order_by('jornada', 'fecha_hora')
        serializer = PartidoListSerializer(partidos, many=True)
        return Response(serializer.data)


class FaseViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/fases/ — Estado de todas las fases del torneo."""
    queryset = Fase.objects.all()
    serializer_class = FaseSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'

    @action(detail=True, methods=['get'], url_path='partidos')
    def partidos(self, request, slug=None):
        """GET /api/fases/{slug}/partidos/ — Partidos de una fase."""
        fase = self.get_object()
        partidos = fase.partidos.select_related(
            'equipo_local', 'equipo_visitante', 'grupo'
        ).order_by('fecha_hora')
        serializer = PartidoListSerializer(partidos, many=True)
        return Response(serializer.data)


class PartidoViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/partidos/ — Todos los partidos del torneo."""
    queryset = Partido.objects.select_related(
        'equipo_local', 'equipo_visitante', 'fase', 'grupo'
    ).all()
    permission_classes = [AllowAny]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['fecha_hora', 'jornada']
    ordering = ['fecha_hora']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PartidoDetailSerializer
        return PartidoListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        # Filtros opcionales por query params
        fase_slug = self.request.query_params.get('fase')
        grupo_letra = self.request.query_params.get('grupo')
        estado = self.request.query_params.get('estado')

        if fase_slug:
            qs = qs.filter(fase__slug=fase_slug)
        if grupo_letra:
            qs = qs.filter(grupo__letra=grupo_letra.upper())
        if estado:
            qs = qs.filter(estado=estado)
        return qs


class JugadorViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/jugadores/ — Planteles (filtrable por equipo)."""
    queryset = Jugador.objects.select_related('equipo').all()
    serializer_class = JugadorSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'equipo__nombre']
    ordering_fields = ['nombre', 'goles', 'asistencias']

    def get_queryset(self):
        qs = super().get_queryset()
        equipo_id = self.request.query_params.get('equipo')
        if equipo_id:
            qs = qs.filter(equipo_id=equipo_id)
        return qs


# ─────────────────────────────────────────────────────────
# PRONÓSTICOS
# ─────────────────────────────────────────────────────────

class PronosticoPartidoViewSet(viewsets.ModelViewSet):
    """
    GET  /api/pronosticos/partidos/       — Pronósticos del usuario
    POST /api/pronosticos/partidos/       — Crear/actualizar pronóstico
    POST /api/pronosticos/partidos/bulk/  — Múltiples pronósticos
    """
    serializer_class = PronosticoPartidoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PronosticoPartido.objects.filter(
            usuario=self.request.user
        ).select_related('partido__equipo_local', 'partido__equipo_visitante')

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

    def create(self, request, *args, **kwargs):
        """Crear o actualizar (upsert) un pronóstico."""
        partido_id = request.data.get('partido')
        try:
            existing = PronosticoPartido.objects.get(
                usuario=request.user, partido_id=partido_id
            )
            serializer = self.get_serializer(existing, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        except PronosticoPartido.DoesNotExist:
            return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['post'], url_path='bulk')
    def bulk_create(self, request):
        """POST /api/pronosticos/partidos/bulk/ — Guardar múltiples."""
        pronosticos_data = request.data.get('pronosticos', [])
        resultados = []

        with transaction.atomic():
            for item in pronosticos_data:
                partido_id = item.get('partido')
                try:
                    obj, created = PronosticoPartido.objects.get_or_create(
                        usuario=request.user,
                        partido_id=partido_id,
                        defaults={
                            'goles_local_pred': item['goles_local_pred'],
                            'goles_visitante_pred': item['goles_visitante_pred'],
                        }
                    )
                    if not created:
                        # Verificar que la fase sigue abierta
                        if not obj.partido.fase.esta_abierta():
                            continue
                        obj.goles_local_pred = item['goles_local_pred']
                        obj.goles_visitante_pred = item['goles_visitante_pred']
                        obj.save(update_fields=['goles_local_pred', 'goles_visitante_pred', 'updated_at'])
                    resultados.append(obj.id)
                except Exception:
                    continue

        return Response({'guardados': len(resultados), 'ids': resultados})

    @action(detail=False, methods=['get'], url_path='resumen')
    def resumen(self, request):
        """GET /api/pronosticos/resumen/ — Resumen de puntos del usuario."""
        usuario = request.user
        pronosticos = PronosticoPartido.objects.filter(usuario=usuario)
        total_puntos = pronosticos.aggregate(total=Sum('puntos_ganados'))['total'] or 0
        completados = pronosticos.count()
        total_partidos = Partido.objects.count()

        return Response({
            'puntos_totales': total_puntos,
            'pronósticos_completados': completados,
            'total_partidos': total_partidos,
            'porcentaje': round(completados / total_partidos * 100, 1) if total_partidos else 0,
        })


class PronosticoTorneoViewSet(viewsets.ModelViewSet):
    """
    GET/POST /api/pronosticos/torneo/ — Predicciones especiales del usuario.
    """
    serializer_class = PronosticoTorneoSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'put', 'patch']

    def get_queryset(self):
        return PronosticoTorneo.objects.filter(usuario=self.request.user)

    def get_object(self):
        obj, _ = PronosticoTorneo.objects.get_or_create(usuario=self.request.user)
        return obj

    def create(self, request, *args, **kwargs):
        """Upsert de predicciones especiales."""
        obj, _ = PronosticoTorneo.objects.get_or_create(usuario=request.user)
        serializer = self.get_serializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────
# LEADERBOARD
# ─────────────────────────────────────────────────────────

class LeaderboardViewSet(viewsets.ViewSet):
    """GET /api/leaderboard/ — Ranking global."""
    permission_classes = [AllowAny]

    def list(self, request):
        from users.models import PerfilUsuario
        from users.serializers import PerfilRankingSerializer
        perfiles = PerfilUsuario.objects.select_related('usuario').order_by(
            '-puntos_totales'
        )[:100]
        serializer = PerfilRankingSerializer(perfiles, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='mi-posicion')
    def mi_posicion(self, request):
        if not request.user.is_authenticated:
            return Response({'posicion': None, 'puntos': 0})
        from users.models import PerfilUsuario
        try:
            perfil = PerfilUsuario.objects.get(usuario=request.user)
        except PerfilUsuario.DoesNotExist:
            return Response({'posicion': None, 'puntos': 0})

        posicion = PerfilUsuario.objects.filter(
            puntos_totales__gt=perfil.puntos_totales
        ).count() + 1
        return Response({'posicion': posicion, 'puntos': perfil.puntos_totales})


# ─────────────────────────────────────────────────────────
# ADMIN DE FASES (solo staff/superusuario)
# ─────────────────────────────────────────────────────────

class AdminFaseViewSet(viewsets.ViewSet):
    """
    Endpoints de administración para gestionar fases del torneo.
    Solo accesibles por superusuarios.
    """
    permission_classes = [IsAdminUser]

    def list(self, request):
        """GET /api/admin/fases/ — Lista todas las fases con su estado actual."""
        from .serializers import FaseSerializer
        fases = Fase.objects.all().order_by('orden')
        serializer = FaseSerializer(fases, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='activar')
    def activar(self, request, pk=None):
        """POST /api/admin/fases/{slug}/activar/ — Activa una fase."""
        try:
            fase = Fase.objects.get(slug=pk)
        except Fase.DoesNotExist:
            return Response({'error': 'Fase no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        fase.activa = True
        fase.bloqueada = False
        fase.save()
        return Response({
            'message': f'Fase "{fase.nombre}" activada correctamente.',
            'fase': fase.slug,
            'activa': fase.activa,
            'bloqueada': fase.bloqueada,
        })

    @action(detail=True, methods=['post'], url_path='bloquear')
    def bloquear(self, request, pk=None):
        """POST /api/admin/fases/{slug}/bloquear/ — Bloquea una fase manualmente."""
        try:
            fase = Fase.objects.get(slug=pk)
        except Fase.DoesNotExist:
            return Response({'error': 'Fase no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        fase.bloqueada = True
        fase.save()
        return Response({
            'message': f'Fase "{fase.nombre}" bloqueada correctamente.',
            'fase': fase.slug,
            'bloqueada': fase.bloqueada,
        })

    @action(detail=True, methods=['post'], url_path='desactivar')
    def desactivar(self, request, pk=None):
        """POST /api/admin/fases/{slug}/desactivar/ — Desactiva una fase."""
        try:
            fase = Fase.objects.get(slug=pk)
        except Fase.DoesNotExist:
            return Response({'error': 'Fase no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        fase.activa = False
        fase.save()
        return Response({
            'message': f'Fase "{fase.nombre}" desactivada.',
            'fase': fase.slug,
            'activa': fase.activa,
        })

