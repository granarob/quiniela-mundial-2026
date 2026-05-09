from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import PerfilUsuario

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, label='Confirmar contraseña')

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Las contraseñas no coinciden.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class PerfilSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField()
    email = serializers.ReadOnlyField()

    class Meta:
        model = PerfilUsuario
        fields = [
            'id', 'username', 'email',
            'avatar_url', 'pais_favorito', 'bio',
            'puntos_totales', 'created_at'
        ]
        read_only_fields = ['puntos_totales', 'created_at']


class PerfilRankingSerializer(serializers.ModelSerializer):
    """Serializer compacto para el leaderboard."""
    username = serializers.ReadOnlyField()

    class Meta:
        model = PerfilUsuario
        fields = ['id', 'username', 'avatar_url', 'pais_favorito', 'puntos_totales']
