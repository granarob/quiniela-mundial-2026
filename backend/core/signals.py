"""
Señales de Django para cálculo automático de puntos.
Se activan cuando se carga un resultado real en un Partido.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import Sum
from .models import Partido, PronosticoPartido, Quiniela
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
    quinielas_afectadas = set()

    for pronostico in pronosticos:
        puntos = calcular_puntos_partido(pronostico, instance)
        if pronostico.puntos_ganados != puntos:
            pronostico.puntos_ganados = puntos
            pronostico.save(update_fields=['puntos_ganados'])
        
        if pronostico.quiniela_id:
            quinielas_afectadas.add(pronostico.quiniela_id)

    # Actualizar puntos totales de cada quiniela afectada
    for qid in quinielas_afectadas:
        actualizar_puntos_quiniela(qid)


def actualizar_puntos_quiniela(quiniela_id):
    """Recalcula puntos_totales de una quiniela sumando todos sus pronósticos."""
    try:
        quiniela = Quiniela.objects.get(id=quiniela_id)
        
        # 1. Sumar puntos de partidos
        puntos_partidos = PronosticoPartido.objects.filter(
            quiniela_id=quiniela_id
        ).aggregate(total=Sum('puntos_ganados'))['total'] or 0
        
        # 2. Sumar puntos de predicciones especiales (si existen)
        puntos_especiales = 0
        if hasattr(quiniela, 'pronostico_torneo'):
            puntos_especiales = quiniela.pronostico_torneo.puntos_especiales

        # 3. Guardar total
        quiniela.puntos_totales = puntos_partidos + puntos_especiales
        quiniela.save(update_fields=['puntos_totales'])
        
        # 4. También actualizar el perfil del usuario (compatibilidad)
        from users.models import PerfilUsuario
        from django.db.models import Max
        perfil, _ = PerfilUsuario.objects.get_or_create(usuario=quiniela.usuario)
        max_puntos = Quiniela.objects.filter(usuario=quiniela.usuario).aggregate(max_p=Max('puntos_totales'))['max_p'] or 0
        perfil.puntos_totales = max_puntos
        perfil.save(update_fields=['puntos_totales'])
        
    except Exception as e:
        print(f"Error al actualizar puntos de quiniela {quiniela_id}: {e}")
