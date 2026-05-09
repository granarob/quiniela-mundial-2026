from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver


class PerfilUsuario(models.Model):
    """Perfil extendido del usuario (OneToOne con AUTH_USER_MODEL)."""
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='perfil'
    )
    avatar_url = models.URLField(blank=True, default='')
    pais_favorito = models.CharField(max_length=100, blank=True, default='')
    bio = models.TextField(blank=True, default='')
    puntos_totales = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Perfil de Usuario'
        verbose_name_plural = 'Perfiles de Usuarios'

    def __str__(self):
        return f"Perfil de {self.usuario.username}"

    @property
    def username(self):
        return self.usuario.username

    @property
    def email(self):
        return self.usuario.email


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def crear_perfil_usuario(sender, instance, created, **kwargs):
    """Crea automáticamente un perfil cuando se registra un usuario nuevo."""
    if created:
        PerfilUsuario.objects.get_or_create(usuario=instance)
