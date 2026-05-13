from rest_framework import viewsets, filters, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from django.db.models import Sum, Count, Q
from django.db import transaction

from .models import (
    Equipo, Grupo, Fase, Partido, Jugador,
    Quiniela, Pago, PronosticoPartido, PronosticoTorneo
)
from .serializers import (
    EquipoSerializer, GrupoSerializer, FaseSerializer,
    PartidoListSerializer, PartidoDetailSerializer, QuinielaSerializer,
    JugadorSerializer, PronosticoPartidoSerializer, PagoSerializer,
    PronosticoBulkSerializer, PronosticoTorneoSerializer
)
from rest_framework.pagination import PageNumberPagination


class LargeResultsPagination(PageNumberPagination):
    page_size = 1000
    page_size_query_param = 'page_size'
    max_page_size = 5000


class EquipoViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/equipos/ — Las 48 selecciones."""
    queryset = Equipo.objects.all()
    serializer_class = EquipoSerializer
    permission_classes = [AllowAny]
    pagination_class = LargeResultsPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'nombre_corto', 'confederacion']
    ordering_fields = ['ranking_fifa', 'nombre', 'confederacion']

    def get_queryset(self):
        qs = super().get_queryset()
        participando = self.request.query_params.get('participando')
        if participando == 'true':
            # Solo equipos asignados a un grupo
            qs = qs.filter(grupoequipo__isnull=False).distinct()
        return qs


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
    queryset = Partido.objects.all()
    permission_classes = [AllowAny]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['fecha_hora', 'jornada']
    ordering = ['fecha_hora']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PartidoDetailSerializer
        return PartidoListSerializer

    def get_queryset(self):
        qs = Partido.objects.all().select_related(
            'equipo_local', 'equipo_visitante', 'fase', 'grupo'
        ).order_by('fecha_hora')
        
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
    pagination_class = LargeResultsPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'equipo__nombre']
    ordering_fields = ['nombre', 'goles', 'asistencias']

    def get_queryset(self):
        qs = super().get_queryset()
        equipo_id = self.request.query_params.get('equipo')
        participando = self.request.query_params.get('participando')
        
        if equipo_id:
            qs = qs.filter(equipo_id=equipo_id)
        if participando == 'true':
            # Solo jugadores de equipos asignados a un grupo
            qs = qs.filter(equipo__grupoequipo__isnull=False).distinct()
        return qs


class QuinielaViewSet(viewsets.ModelViewSet):
    """GET/POST /api/quinielas/ — Gestionar quinielas del usuario."""
    serializer_class = QuinielaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # El usuario puede ver sus propias quinielas
        # O cualquier quiniela que ya esté en estado 'pagada'
        return Quiniela.objects.filter(
            Q(usuario=self.request.user) | Q(estado='pagada')
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

class PagoViewSet(viewsets.ModelViewSet):
    """POST /api/pagos/ — Reportar un pago."""
    serializer_class = PagoSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Pago.objects.filter(quiniela__usuario=self.request.user)

    def perform_create(self, serializer):
        # Al crear un pago, marcamos la quiniela como 'pendiente'
        quiniela = serializer.validated_data['quiniela']
        if quiniela.usuario != self.request.user:
            raise serializers.ValidationError("No puedes pagar una quiniela que no es tuya.")
        
        pago = serializer.save()
        quiniela.estado = 'pendiente'
        quiniela.save()


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
    pagination_class = None

    def get_queryset(self):
        quiniela_id = self.request.query_params.get('quiniela')
        if not quiniela_id:
            return PronosticoPartido.objects.none()
            
        # Permitir ver si:
        # 1. Es mi propia quiniela
        # 2. Es una quiniela PAGADA (pública para otros)
        return PronosticoPartido.objects.filter(
            Q(quiniela_id=quiniela_id, quiniela__usuario=self.request.user) |
            Q(quiniela_id=quiniela_id, quiniela__estado='pagada')
        ).distinct().select_related('partido__equipo_local', 'partido__equipo_visitante')

    def create(self, request, *args, **kwargs):
        """Crear o actualizar (upsert) un pronóstico en una quiniela específica."""
        partido_id = request.data.get('partido')
        quiniela_id = request.data.get('quiniela')

        if not quiniela_id:
            return Response({'error': 'Debes especificar una quiniela.'}, status=status.HTTP_400_BAD_REQUEST)

        # Verificar que la quiniela pertenezca al usuario
        if not Quiniela.objects.filter(id=quiniela_id, usuario=request.user).exists():
            return Response({'error': 'Quiniela no válida.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            existing = PronosticoPartido.objects.get(
                quiniela_id=quiniela_id, partido_id=partido_id
            )
            serializer = self.get_serializer(existing, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        except PronosticoPartido.DoesNotExist:
            return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='matrix')
    def matrix(self, request):
        """GET /api/pronosticos/partidos/matrix/?jornada=1 — Matriz de todos los usuarios."""
        jornada = request.query_params.get('jornada')
        fase_slug = request.query_params.get('fase', 'grupos')
        
        # 1. Obtener partidos de esa jornada/fase
        partidos = Partido.objects.filter(fase__slug=fase_slug)
        if jornada:
            partidos = partidos.filter(jornada=jornada)
        partidos = partidos.order_by('fecha_hora')
        
        # 2. Obtener quinielas pagadas
        quinielas = Quiniela.objects.filter(estado='pagada').select_related('usuario')
        
        # 3. Obtener todos los pronósticos para esos partidos
        pronos = PronosticoPartido.objects.filter(
            partido__in=partidos,
            quiniela__in=quinielas
        ).select_related('quiniela', 'partido')
        
        # 4. Estructurar la data: { quiniela_id: { partido_id: { local, visita, puntos } } }
        matrix_data = {}
        for p in pronos:
            q_id = p.quiniela_id
            if q_id not in matrix_data:
                matrix_data[q_id] = {}
            matrix_data[q_id][p.partido_id] = {
                'l': p.goles_local_pred,
                'v': p.goles_visitante_pred,
                'pts': p.puntos_ganados
            }
            
        return Response({
            'partidos': PartidoListSerializer(partidos, many=True).data,
            'usuarios': [
                {'id': q.id, 'nombre': q.nombre, 'username': q.usuario.username} 
                for q in quinielas
            ],
            'matrix': matrix_data
        })

    @action(detail=False, methods=['post'], url_path='bulk')
    def bulk_create(self, request):
        """POST /api/pronosticos/partidos/bulk/ — Guardar múltiples en una quiniela."""
        quiniela_id = request.data.get('quiniela')
        pronosticos_data = request.data.get('pronosticos', [])

        if not quiniela_id:
            return Response({'error': 'Debes especificar una quiniela.'}, status=status.HTTP_400_BAD_REQUEST)

        if not Quiniela.objects.filter(id=quiniela_id, usuario=request.user).exists():
            return Response({'error': 'Quiniela no válida.'}, status=status.HTTP_403_FORBIDDEN)

        resultados = []
        with transaction.atomic():
            for item in pronosticos_data:
                partido_id = item.get('partido')
                try:
                    obj, created = PronosticoPartido.objects.get_or_create(
                        quiniela_id=quiniela_id,
                        partido_id=partido_id,
                        defaults={
                            'goles_local_pred': item.get('goles_local_pred', 0),
                            'goles_visitante_pred': item.get('goles_visitante_pred', 0),
                        }
                    )
                    if not created:
                        if not obj.partido.fase.esta_abierta():
                            continue
                        obj.goles_local_pred = item['goles_local_pred']
                        obj.goles_visitante_pred = item['goles_visitante_pred']
                        # Usamos update_fields para ser más específicos
                        obj.save(update_fields=['goles_local_pred', 'goles_visitante_pred', 'updated_at'])
                    resultados.append(obj.id)
                except Exception:
                    continue

            # ACTUALIZACIÓN ÚNICA AL FINAL
            from .signals import actualizar_puntos_quiniela
            actualizar_puntos_quiniela(quiniela_id)

        return Response({'guardados': len(resultados), 'ids': resultados})

    @action(detail=False, methods=['get'], url_path='resumen')
    def resumen(self, request):
        """GET /api/pronosticos/resumen/?quiniela=ID — Resumen de una quiniela."""
        quiniela_id = request.query_params.get('quiniela')
        if not quiniela_id:
            return Response({'error': 'Debes especificar una quiniela.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quiniela = Quiniela.objects.get(id=quiniela_id, usuario=request.user)
        except Quiniela.DoesNotExist:
            return Response({'error': 'Quiniela no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        pronosticos = PronosticoPartido.objects.filter(quiniela=quiniela)
        total_puntos = pronosticos.aggregate(total=Sum('puntos_ganados'))['total'] or 0
        completados = pronosticos.count()
        total_partidos = Partido.objects.count()

        torneo = PronosticoTorneo.objects.filter(quiniela=quiniela).first()
        especiales_completos = False
        if torneo:
            especiales_completos = all([
                torneo.campeon,
                torneo.subcampeon,
                torneo.tercer_lugar,
                torneo.cuarto_lugar,
                (torneo.goleador or torneo.goleador_nombre),
                (torneo.asistente or torneo.asistente_nombre)
            ])

        return Response({
            'quiniela_nombre': quiniela.nombre,
            'puntos_totales': total_puntos,
            'pronósticos_completados': completados,
            'total_partidos': total_partidos,
            'porcentaje': round(completados / total_partidos * 100, 1) if total_partidos else 0,
            'especiales_completos': especiales_completos,
        })


class PronosticoTorneoViewSet(viewsets.ModelViewSet):
    """
    GET/POST /api/pronosticos/torneo/ — Predicciones especiales de una quiniela.
    """
    serializer_class = PronosticoTorneoSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'put', 'patch']

    def get_queryset(self):
        quiniela_id = self.request.query_params.get('quiniela')
        if not quiniela_id:
            return PronosticoTorneo.objects.none()
        return PronosticoTorneo.objects.filter(quiniela_id=quiniela_id, quiniela__usuario=self.request.user)

    def create(self, request, *args, **kwargs):
        """Upsert de predicciones especiales en una quiniela."""
        quiniela_id = request.data.get('quiniela')
        if not quiniela_id:
            return Response({'error': 'Debes especificar una quiniela.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quiniela = Quiniela.objects.get(id=quiniela_id, usuario=request.user)
        except Quiniela.DoesNotExist:
            return Response({'error': 'Quiniela no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        obj, _ = PronosticoTorneo.objects.get_or_create(quiniela=quiniela)
        serializer = self.get_serializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────
# LEADERBOARD
# ─────────────────────────────────────────────────────────

class LeaderboardViewSet(viewsets.ViewSet):
    """GET /api/leaderboard/ — Ranking global de quinielas pagadas."""
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Quiniela.objects.filter(estado='pagada').select_related('usuario').order_by('-puntos_totales', 'nombre')

    def list(self, request):
        quinielas = self.get_queryset()[:100]
        
        data = []
        for i, q in enumerate(quinielas):
            avatar_url = None
            if hasattr(q.usuario, 'perfil'):
                avatar_url = q.usuario.perfil.avatar_url

            data.append({
                'posicion': i + 1,
                'quiniela_id': q.id,
                'nombre': q.nombre,
                'username': q.usuario.username,
                'avatar_url': avatar_url,
                'puntos': q.puntos_totales
            })
        return Response(data)

    @action(detail=False, methods=['get'], url_path='mi-posicion')
    def mi_posicion(self, request):
        quiniela_id = request.query_params.get('quiniela')
        if not request.user.is_authenticated or not quiniela_id:
            return Response({'posicion': None, 'puntos': 0})
        
        try:
            quiniela = Quiniela.objects.get(id=quiniela_id, usuario=request.user)
        except Quiniela.DoesNotExist:
            return Response({'posicion': None, 'puntos': 0}, status=status.HTTP_404_NOT_FOUND)

        if quiniela.estado != 'pagada':
            return Response({
                'posicion': 'No participa', 
                'puntos': quiniela.puntos_totales,
                'estado': quiniela.estado
            })

        posicion = Quiniela.objects.filter(
            estado='pagada',
            puntos_totales__gt=quiniela.puntos_totales
        ).count() + 1
        
        return Response({
            'posicion': posicion, 
            'puntos': quiniela.puntos_totales,
            'estado': quiniela.estado
        })


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


class AdminPartidoViewSet(viewsets.ViewSet):
    """
    Endpoints de administración para partidos (cargar resultados).
    Solo accesibles por superusuarios.
    """
    permission_classes = [IsAdminUser]

    @action(detail=True, methods=['patch'], url_path='resultado')
    def cargar_resultado(self, request, pk=None):
        try:
            partido = Partido.objects.get(pk=pk)
        except Partido.DoesNotExist:
            return Response({'error': 'Partido no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        goles_local = request.data.get('goles_local')
        goles_visitante = request.data.get('goles_visitante')
        estado = request.data.get('estado', 'finalizado')

        try:
            if goles_local is not None and goles_visitante is not None:
                partido.goles_local = int(goles_local)
                partido.goles_visitante = int(goles_visitante)
                partido.estado = estado
                partido.resultado_cargado = True
                
                from django.db import transaction
                with transaction.atomic():
                    partido.save()  # Dispara signal calcular_puntos
                
                return Response({'message': 'Resultado guardado y puntos recalculados.'})
            else:
                return Response({'error': 'Faltan los goles.'}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({'error': 'Los goles deben ser números válidos.'}, status=status.HTTP_400_BAD_REQUEST)
    @action(detail=False, methods=['post'], url_path='recalcular-puntos')
    def recalcular_puntos(self, request):
        """POST /api/admin/partidos/recalcular-puntos/ — Fuerza el recálculo de todo."""
        from django.db import transaction
        quinielas = Quiniela.objects.all()
        for q in quinielas:
            q.actualizar_puntos() # Este metodo ya existe en el modelo Quiniela
        return Response({'message': 'Todos los puntos han sido recalculados exitosamente.'})


class AdminPagoViewSet(viewsets.ViewSet):
    """Administración de pagos para el Super Admin."""
    permission_classes = [IsAdminUser]

    def list(self, request):
        """GET /api/admin/pagos/ — Lista todos los pagos pendientes y completados."""
        pagos = Pago.objects.select_related('quiniela__usuario').order_by('-fecha_pago')
        data = []
        for p in pagos:
            data.append({
                'id': p.id,
                'referencia': p.referencia,
                'monto': str(p.monto),
                'moneda': p.moneda,
                'estado': p.estado,
                'fecha': p.fecha_pago.strftime('%d/%m/%Y %H:%M'),
                'quiniela_id': p.quiniela.id,
                'quiniela_nombre': p.quiniela.nombre,
                'username': p.quiniela.usuario.username,
                'comprobante': request.build_absolute_uri(p.comprobante.url) if p.comprobante else None,
            })
        return Response(data)

    @action(detail=True, methods=['post'], url_path='aprobar')
    def aprobar(self, request, pk=None):
        """POST /api/admin/pagos/{id}/aprobar/ — Aprueba el pago y activa la quiniela."""
        try:
            pago = Pago.objects.get(pk=pk)
        except Pago.DoesNotExist:
            return Response({'error': 'Pago no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            pago.estado = 'completado'
            pago.save()
            
            quiniela = pago.quiniela
            quiniela.estado = 'pagada'
            quiniela.save()

        return Response({
            'message': f'Pago {pago.referencia} aprobado y quiniela "{quiniela.nombre}" activada.',
            'pago_id': pago.id,
            'quiniela_estado': quiniela.estado
        })

    @action(detail=True, methods=['post'], url_path='rechazar')
    def rechazar(self, request, pk=None):
        """POST /api/admin/pagos/{id}/rechazar/ — Rechaza el pago y regresa la quiniela a borrador."""
        try:
            pago = Pago.objects.get(pk=pk)
        except Pago.DoesNotExist:
            return Response({'error': 'Pago no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            pago.estado = 'rechazado'
            pago.save()
            # Regresar la quiniela a borrador para que el usuario pueda volver a pagar
            quiniela = pago.quiniela
            quiniela.estado = 'rechazado'
            quiniela.save()

        return Response({'message': f'Pago rechazado. La quiniela "{quiniela.nombre}" puede volver a intentar el pago.'})


