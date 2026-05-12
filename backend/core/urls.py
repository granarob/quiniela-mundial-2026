from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EquipoViewSet, GrupoViewSet, FaseViewSet, PartidoViewSet,
    JugadorViewSet, QuinielaViewSet, PagoViewSet, PronosticoPartidoViewSet, PronosticoTorneoViewSet,
    LeaderboardViewSet, AdminFaseViewSet, AdminPartidoViewSet, AdminPagoViewSet
)

router = DefaultRouter()
router.register(r'equipos', EquipoViewSet, basename='equipo')
router.register(r'grupos', GrupoViewSet, basename='grupo')
router.register(r'fases', FaseViewSet, basename='fase')
router.register(r'partidos', PartidoViewSet, basename='partido')
router.register(r'jugadores', JugadorViewSet, basename='jugador')
router.register(r'quinielas', QuinielaViewSet, basename='quiniela')
router.register(r'pagos', PagoViewSet, basename='pago')
router.register(r'pronosticos/partidos', PronosticoPartidoViewSet, basename='pronostico-partido')
router.register(r'pronosticos/torneo', PronosticoTorneoViewSet, basename='pronostico-torneo')
router.register(r'leaderboard', LeaderboardViewSet, basename='leaderboard')
router.register(r'admin/fases', AdminFaseViewSet, basename='admin-fase')
router.register(r'admin/partidos', AdminPartidoViewSet, basename='admin-partido')
router.register(r'admin/pagos', AdminPagoViewSet, basename='admin-pago')

urlpatterns = [
    path('', include(router.urls)),
]
