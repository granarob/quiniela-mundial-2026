"""
Señales de Django para cálculo automático de puntos.
Se activan cuando se carga un resultado real en un Partido.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Partido, PronosticoPartido
from .utils import calcular_puntos_partido


@receiver(post_save, sender=Partido)
def calcular_puntos_al_guardar_resultado(sender, instance, **kwargs):
    """
    Cuando se marca resultado_cargado=True en un Partido,
    recalcula automáticamente los puntos de todos los pronósticos.
    """
    if not instance.resultado_cargado:
        return
    if instance.goles_local is None or instance.goles_visitante is None:
        return

    pronosticos = PronosticoPartido.objects.filter(partido=instance)
    for pronostico in pronosticos:
        puntos = calcular_puntos_partido(pronostico, instance)
        if pronostico.puntos_ganados != puntos:
            pronostico.puntos_ganados = puntos
            pronostico.save(update_fields=['puntos_ganados'])

    # Actualizar puntos totales de cada usuario afectado
    usuarios_ids = pronosticos.values_list('usuario_id', flat=True).distinct()
    _actualizar_puntos_usuarios(usuarios_ids)


def _actualizar_puntos_usuarios(usuarios_ids):
    """Recalcula puntos_totales en el perfil de cada usuario afectado."""
    from django.contrib.auth import get_user_model
    from django.db.models import Sum
    User = get_user_model()

    for uid in usuarios_ids:
        total = PronosticoPartido.objects.filter(
            usuario_id=uid
        ).aggregate(total=Sum('puntos_ganados'))['total'] or 0

        # También sumar puntos especiales si existe
        try:
            from users.models import PerfilUsuario
            perfil = PerfilUsuario.objects.get(usuario_id=uid)
            especiales = perfil.pronostico_torneo.puntos_especiales if hasattr(
                perfil, 'pronostico_torneo'
            ) else 0
            perfil.puntos_totales = total + especiales
            perfil.save(update_fields=['puntos_totales'])
        except Exception:
            pass
