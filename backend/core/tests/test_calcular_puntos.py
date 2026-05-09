import pytest
from core.models import Fase, Partido, PronosticoPartido, Equipo
from core.utils import calcular_puntos_partido

@pytest.mark.django_db
class TestCalcularPuntos:
    
    @pytest.fixture
    def fase_grupos(self):
        return Fase.objects.create(nombre="Grupos", slug="grupos", orden=1, activa=True)

    @pytest.fixture
    def fase_octavos(self):
        return Fase.objects.create(nombre="Octavos", slug="octavos", orden=2, activa=True)

    @pytest.fixture
    def equipo_local(self):
        return Equipo.objects.create(nombre="Local", codigo_iso="LOC", confederacion="CONMEBOL")

    @pytest.fixture
    def equipo_visitante(self):
        return Equipo.objects.create(nombre="Visitante", codigo_iso="VIS", confederacion="CONMEBOL")

    @pytest.fixture
    def partido_grupos(self, fase_grupos, equipo_local, equipo_visitante):
        return Partido.objects.create(fase=fase_grupos, fecha_hora="2026-06-11T12:00:00Z", equipo_local=equipo_local, equipo_visitante=equipo_visitante)

    @pytest.fixture
    def partido_octavos(self, fase_octavos, equipo_local, equipo_visitante):
        return Partido.objects.create(fase=fase_octavos, fecha_hora="2026-06-25T12:00:00Z", equipo_local=equipo_local, equipo_visitante=equipo_visitante)

    @pytest.fixture
    def pronostico(self, partido_grupos):
        return PronosticoPartido(partido=partido_grupos, goles_local_pred=2, goles_visitante_pred=1)

    def test_grupos_marcador_exacto(self, partido_grupos, pronostico):
        partido_grupos.goles_local = 2
        partido_grupos.goles_visitante = 1
        puntos = calcular_puntos_partido(pronostico, partido_grupos)
        assert puntos == 5

    def test_grupos_tendencia_correcta(self, partido_grupos, pronostico):
        partido_grupos.goles_local = 3
        partido_grupos.goles_visitante = 0
        puntos = calcular_puntos_partido(pronostico, partido_grupos)
        assert puntos == 3

    def test_grupos_incorrecto(self, partido_grupos, pronostico):
        partido_grupos.goles_local = 1
        partido_grupos.goles_visitante = 1
        puntos = calcular_puntos_partido(pronostico, partido_grupos)
        assert puntos == 0

    def test_eliminatorias_marcador_exacto(self, partido_octavos):
        pronostico_oct = PronosticoPartido(partido=partido_octavos, goles_local_pred=2, goles_visitante_pred=1)
        partido_octavos.goles_local = 2
        partido_octavos.goles_visitante = 1
        puntos = calcular_puntos_partido(pronostico_oct, partido_octavos)
        assert puntos == 7

    def test_eliminatorias_tendencia(self, partido_octavos):
        pronostico_oct = PronosticoPartido(partido=partido_octavos, goles_local_pred=2, goles_visitante_pred=1)
        partido_octavos.goles_local = 1
        partido_octavos.goles_visitante = 0
        puntos = calcular_puntos_partido(pronostico_oct, partido_octavos)
        assert puntos == 4
