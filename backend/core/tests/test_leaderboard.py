import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from users.models import PerfilUsuario
from django.urls import reverse

User = get_user_model()

@pytest.mark.django_db
class TestLeaderboard:

    @pytest.fixture
    def setup_users(self):
        u1 = User.objects.create_user(username="user1", password="pw")
        u2 = User.objects.create_user(username="user2", password="pw")
        u3 = User.objects.create_user(username="user3", password="pw")
        
        # Perfiles created by signals usually
        PerfilUsuario.objects.filter(usuario=u1).update(puntos_totales=15)
        PerfilUsuario.objects.filter(usuario=u2).update(puntos_totales=30)
        PerfilUsuario.objects.filter(usuario=u3).update(puntos_totales=10)

        return u1, u2, u3

    def test_leaderboard_ordering(self, setup_users):
        u1, u2, u3 = setup_users
        client = APIClient()
        client.force_authenticate(user=u1)

        url = reverse('leaderboard-list')
        response = client.get(url)
        assert response.status_code == 200
        
        results = response.data if isinstance(response.data, list) else response.data.get('results', [])
        
        # Should be ordered descending by puntos_totales: u2 (30), u1 (15), u3 (10)
        assert results[0]['username'] == 'user2'
        assert results[1]['username'] == 'user1'
        assert results[2]['username'] == 'user3'

