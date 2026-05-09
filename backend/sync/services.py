"""
Servicio de sincronización con football-data.org API.
"""
import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

BASE_URL = settings.FOOTBALL_API_BASE_URL
HEADERS = {'X-Auth-Token': settings.FOOTBALL_API_KEY}

# Código de competición del Mundial 2026 en football-data.org
WC_CODE = 'WC'


def get_teams():
    """Obtiene los 48 equipos del Mundial."""
    try:
        url = f"{BASE_URL}/competitions/{WC_CODE}/teams"
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        return response.json().get('teams', [])
    except Exception as e:
        logger.warning(f"Error al obtener equipos de la API: {e}")
        return None


def get_standings():
    """Obtiene los grupos con equipos y posiciones."""
    try:
        url = f"{BASE_URL}/competitions/{WC_CODE}/standings"
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        return response.json().get('standings', [])
    except Exception as e:
        logger.warning(f"Error al obtener standings de la API: {e}")
        return None


def get_matches():
    """Obtiene todos los partidos del torneo."""
    try:
        url = f"{BASE_URL}/competitions/{WC_CODE}/matches"
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        return response.json().get('matches', [])
    except Exception as e:
        logger.warning(f"Error al obtener partidos de la API: {e}")
        return None


def mapear_confederacion(area_name):
    """Mapea el nombre del área a la confederación correspondiente."""
    mapping = {
        'Europe': 'UEFA',
        'South America': 'CONMEBOL',
        'North America': 'CONCACAF',
        'Central America': 'CONCACAF',
        'Africa': 'CAF',
        'Asia': 'AFC',
        'Oceania': 'OFC',
    }
    for key, val in mapping.items():
        if key.lower() in (area_name or '').lower():
            return val
    return 'UEFA'
