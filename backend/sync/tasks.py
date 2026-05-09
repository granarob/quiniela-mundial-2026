from celery import shared_task
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


@shared_task
def bloquear_fases_cerradas():
    """
    Tarea periódica: bloquea automáticamente fases cuyo fecha_cierre ya pasó.
    Configurar en Celery beat para ejecutar cada minuto.
    """
    from core.models import Fase
    now = timezone.now()
    fases_a_bloquear = Fase.objects.filter(
        activa=True,
        bloqueada=False,
        fecha_cierre__lte=now
    )
    count = fases_a_bloquear.count()
    fases_a_bloquear.update(bloqueada=True)
    if count:
        logger.info(f"Bloqueadas {count} fase(s) automáticamente.")
    return count


@shared_task
def sync_resultados_live():
    """
    Tarea periódica: sincroniza resultados en vivo desde la API.
    Ejecutar cada 5 minutos durante días de partido.
    """
    from sync.services import get_matches
    from core.models import Partido

    matches = get_matches()
    if not matches:
        return 0

    actualizados = 0
    for match in matches:
        api_id = match.get('id')
        status_api = match.get('status')
        score = match.get('score', {}).get('fullTime', {})

        if status_api == 'FINISHED' and score.get('home') is not None:
            try:
                partido = Partido.objects.get(api_id=api_id)
                if not partido.resultado_cargado:
                    partido.goles_local = score['home']
                    partido.goles_visitante = score['away']
                    partido.estado = 'finalizado'
                    partido.resultado_cargado = True
                    partido.save()  # Activa signal de cálculo de puntos
                    actualizados += 1
            except Partido.DoesNotExist:
                continue

    logger.info(f"Sincronizados {actualizados} resultados.")
    return actualizados
