from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EquipoViewSet, GrupoViewSet, FaseViewSet, PartidoViewSet,
    JugadorViewSet, PronosticoPartidoViewSet, PronosticoTorneoViewSet,
    LeaderboardViewSet, AdminFaseViewSet
)

router = DefaultRouter()
router.register(r'equipos', EquipoViewSet, basename='equipo')
router.register(r'grupos', GrupoViewSet, basename='grupo')
router.register(r'fases', FaseViewSet, basename='fase')
router.register(r'partidos', PartidoViewSet, basename='partido')
router.register(r'jugadores', JugadorViewSet, basename='jugador')
router.register(r'pronosticos/partidos', PronosticoPartidoViewSet, basename='pronostico-partido')
router.register(r'pronosticos/torneo', PronosticoTorneoViewSet, basename='pronostico-torneo')
router.register(r'leaderboard', LeaderboardViewSet, basename='leaderboard')
router.register(r'admin/fases', AdminFaseViewSet, basename='admin-fase')

urlpatterns = [
    path('', include(router.urls)),
]

