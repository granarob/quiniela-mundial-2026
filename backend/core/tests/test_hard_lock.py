import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from core.models import Fase, Partido, Equipo, Grupo
from django.urls import reverse

User = get_user_model()

@pytest.mark.django_db
class TestHardLock:

    @pytest.fixture
    def user(self):
        return User.objects.create_user(username="testuser", password="password123")

    @pytest.fixture
    def client(self, user):
        c = APIClient()
        c.force_authenticate(user=user)
        return c

    @pytest.fixture
    def fase_bloqueada(self):
        return Fase.objects.create(nombre="Grupos", slug="grupos", orden=1, activa=True, bloqueada=True)

    @pytest.fixture
    def partido(self, fase_bloqueada):
        eq1 = Equipo.objects.create(nombre="A", codigo_iso="AA", confederacion="CONMEBOL")
        eq2 = Equipo.objects.create(nombre="B", codigo_iso="BB", confederacion="CONMEBOL")
        grupo = Grupo.objects.create(letra="A")
        return Partido.objects.create(fase=fase_bloqueada, equipo_local=eq1, equipo_visitante=eq2, grupo=grupo, fecha_hora="2026-06-11T12:00:00Z")

    def test_pronostico_fase_bloqueada(self, client, partido):
        # Intentar crear un pronóstico en un partido de una fase bloqueada
        url = reverse('pronostico-partido-list')
        data = {
            "partido": partido.id,
            "goles_local_pred": 1,
            "goles_visitante_pred": 1
        }
        response = client.post(url, data)
        # Assuming the backend returns 400 or 403 when trying to predict a blocked phase
        assert response.status_code in [400, 403], "No debería permitir crear pronósticos en fase bloqueada"

