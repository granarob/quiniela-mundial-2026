"""
Lógica de puntuación según PRD §4.1, §4.2 y §4.3
"""


def calcular_puntos_partido(pronostico, partido):
    """
    Calcula los puntos de un pronóstico comparado con el resultado real.

    Fase de Grupos:
      - Marcador exacto: 5 pts
      - Tendencia correcta (ganador o empate): 3 pts
      - Error: 0 pts

    Fases Eliminatorias:
      - Marcador exacto: 7 pts
      - Tendencia correcta: 4 pts
      - Error: 0 pts
    """
    pred_l = pronostico.goles_local_pred
    pred_v = pronostico.goles_visitante_pred
    real_l = partido.goles_local
    real_v = partido.goles_visitante

    if real_l is None or real_v is None:
        return 0

    es_eliminatoria = partido.fase.slug != 'grupos'

    # Marcador exacto
    if pred_l == real_l and pred_v == real_v:
        return 7 if es_eliminatoria else 5

    # Tendencia: -1 (visitante gana), 0 (empate), 1 (local gana)
    pred_tend = _tendencia(pred_l, pred_v)
    real_tend = _tendencia(real_l, real_v)

    if pred_tend == real_tend:
        return 4 if es_eliminatoria else 3

    return 0


def _tendencia(goles_local, goles_visitante):
    """Retorna -1, 0, o 1 según quién gana."""
    if goles_local > goles_visitante:
        return 1
    elif goles_local < goles_visitante:
        return -1
    return 0


def calcular_puntos_especiales(pronostico_torneo, campeon_real, subcampeon_real,
                                tercer_real, cuarto_real, goleador_real, asistente_real):
    """
    Calcula puntos de predicciones especiales según PRD §4.3.
    """
    puntos = 0

    if pronostico_torneo.campeon == campeon_real:
        puntos += 25
    if pronostico_torneo.subcampeon == subcampeon_real:
        puntos += 20
    if pronostico_torneo.tercer_lugar == tercer_real:
        puntos += 10
    if pronostico_torneo.cuarto_lugar == cuarto_real:
        puntos += 5
    if pronostico_torneo.goleador == goleador_real:
        puntos += 15
    if pronostico_torneo.asistente == asistente_real:
        puntos += 10

    return puntos
