"""
Management command: python manage.py sync_worldcup_data

Sincroniza equipos, grupos y fixtures del Mundial 2026 desde:
1. API football-data.org (si está disponible y configurada)
2. Datos JSON estáticos de fallback (siempre funciona)

Uso:
  python manage.py sync_worldcup_data           # Auto (API → fallback)
  python manage.py sync_worldcup_data --fallback  # Forzar datos estáticos
  python manage.py sync_worldcup_data --fases     # Solo crear fases del torneo
"""
import json
import os
from datetime import datetime, timezone as dt_timezone
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings

from core.models import Equipo, Grupo, GrupoEquipo, Fase, Partido
from sync.services import get_teams, get_standings, get_matches, mapear_confederacion

FIXTURES_DIR = os.path.join(settings.BASE_DIR, 'fixtures')


class Command(BaseCommand):
    help = 'Sincroniza datos del Mundial 2026 desde API externa o datos estáticos.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fallback', action='store_true',
            help='Usar datos JSON estáticos en lugar de la API.'
        )
        parser.add_argument(
            '--fases', action='store_true',
            help='Solo crear/actualizar las fases del torneo.'
        )
        parser.add_argument(
            '--reset', action='store_true',
            help='Borrar todos los datos antes de sincronizar (CUIDADO).'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('[OK] Iniciando sincronizacion Quiniela Mundial 2026...'))

        if options['reset']:
            self._reset_data()

        # Siempre crear/actualizar las fases primero
        self._crear_fases()

        if options['fases']:
            self.stdout.write(self.style.SUCCESS('[OK] Fases creadas/actualizadas.'))
            return

        use_fallback = options['fallback'] or not settings.FOOTBALL_API_KEY

        if use_fallback:
            self.stdout.write('[INFO] Usando datos estaticos de fallback...')
            self._sync_from_fallback()
        else:
            self.stdout.write('[INFO] Intentando sincronizar desde API...')
            success = self._sync_from_api()
            if not success:
                self.stdout.write(self.style.WARNING('[WARN] API fallo. Usando fallback...'))
                self._sync_from_fallback()

        self.stdout.write(self.style.SUCCESS('[OK] Sincronizacion completada!'))
        self._print_summary()

    def _reset_data(self):
        self.stdout.write(self.style.WARNING('[WARN] Borrando datos existentes...'))
        Partido.objects.all().delete()
        GrupoEquipo.objects.all().delete()
        Grupo.objects.all().delete()
        Equipo.objects.all().delete()

    def _crear_fases(self):
        """Crea las 7 fases del torneo con sus fechas aproximadas."""
        fases_data = [
            {
                'slug': 'grupos',
                'nombre': 'Fase de Grupos',
                'orden': 1,
                # Abierta desde ya, cierra al inicio del primer partido
                'fecha_apertura': timezone.datetime(2026, 1, 1, tzinfo=dt_timezone.utc),
                'fecha_cierre': timezone.datetime(2026, 6, 11, 22, 0, tzinfo=dt_timezone.utc),
                'activa': True,
            },
            {
                'slug': 'ronda32',
                'nombre': 'Ronda de 32',
                'orden': 2,
                'fecha_apertura': timezone.datetime(2026, 6, 27, tzinfo=dt_timezone.utc),
                'fecha_cierre': timezone.datetime(2026, 6, 27, 18, 0, tzinfo=dt_timezone.utc),
                'activa': False,
            },
            {
                'slug': 'octavos',
                'nombre': 'Octavos de Final',
                'orden': 3,
                'fecha_apertura': timezone.datetime(2026, 7, 1, tzinfo=dt_timezone.utc),
                'fecha_cierre': timezone.datetime(2026, 7, 1, 18, 0, tzinfo=dt_timezone.utc),
                'activa': False,
            },
            {
                'slug': 'cuartos',
                'nombre': 'Cuartos de Final',
                'orden': 4,
                'fecha_apertura': timezone.datetime(2026, 7, 4, tzinfo=dt_timezone.utc),
                'fecha_cierre': timezone.datetime(2026, 7, 4, 18, 0, tzinfo=dt_timezone.utc),
                'activa': False,
            },
            {
                'slug': 'semifinales',
                'nombre': 'Semifinales',
                'orden': 5,
                'fecha_apertura': timezone.datetime(2026, 7, 9, tzinfo=dt_timezone.utc),
                'fecha_cierre': timezone.datetime(2026, 7, 9, 18, 0, tzinfo=dt_timezone.utc),
                'activa': False,
            },
            {
                'slug': 'tercer_puesto',
                'nombre': 'Tercer Puesto',
                'orden': 6,
                'fecha_apertura': timezone.datetime(2026, 7, 18, tzinfo=dt_timezone.utc),
                'fecha_cierre': timezone.datetime(2026, 7, 18, 18, 0, tzinfo=dt_timezone.utc),
                'activa': False,
            },
            {
                'slug': 'final',
                'nombre': 'Final',
                'orden': 7,
                'fecha_apertura': timezone.datetime(2026, 7, 19, tzinfo=dt_timezone.utc),
                'fecha_cierre': timezone.datetime(2026, 7, 19, 18, 0, tzinfo=dt_timezone.utc),
                'activa': False,
            },
        ]

        for data in fases_data:
            fase, created = Fase.objects.update_or_create(
                slug=data['slug'],
                defaults=data
            )
            status = 'Creada' if created else 'Actualizada'
            self.stdout.write(f"  {status}: {fase.nombre}")

    def _sync_from_api(self):
        """Intenta sincronizar desde la API de football-data.org."""
        try:
            # Equipos
            teams_data = get_teams()
            if not teams_data:
                return False
            self._procesar_equipos_api(teams_data)

            # Grupos
            standings_data = get_standings()
            if standings_data:
                self._procesar_grupos_api(standings_data)

            # Partidos
            matches_data = get_matches()
            if matches_data:
                self._procesar_partidos_api(matches_data)

            return True
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error API: {e}'))
            return False

    def _procesar_equipos_api(self, teams_data):
        self.stdout.write(f'  Procesando {len(teams_data)} equipos...')
        for team in teams_data:
            Equipo.objects.update_or_create(
                api_id=team['id'],
                defaults={
                    'nombre': team.get('name', ''),
                    'nombre_corto': team.get('tla', '')[:3],
                    'codigo_iso': team.get('area', {}).get('code', '')[:2],
                    'bandera_url': team.get('crestUrl', '') or team.get('crest', ''),
                    'confederacion': mapear_confederacion(team.get('area', {}).get('name', '')),
                }
            )

    def _procesar_grupos_api(self, standings_data):
        self.stdout.write('  Procesando grupos...')
        letras = list('ABCDEFGHIJKL')
        for i, standing in enumerate(standings_data[:12]):
            if i >= len(letras):
                break
            letra = letras[i]
            grupo, _ = Grupo.objects.get_or_create(letra=letra)
            for pos, entry in enumerate(standing.get('table', []), start=1):
                team_id = entry.get('team', {}).get('id')
                try:
                    equipo = Equipo.objects.get(api_id=team_id)
                    GrupoEquipo.objects.update_or_create(
                        grupo=grupo, equipo=equipo,
                        defaults={'posicion': pos}
                    )
                except Equipo.DoesNotExist:
                    pass

    def _procesar_partidos_api(self, matches_data):
        self.stdout.write(f'  Procesando {len(matches_data)} partidos...')
        fase_grupos = Fase.objects.get(slug='grupos')
        for match in matches_data:
            try:
                equipo_local = Equipo.objects.get(api_id=match['homeTeam']['id'])
                equipo_visitante = Equipo.objects.get(api_id=match['awayTeam']['id'])
                group_name = match.get('group', '')
                grupo = None
                if group_name:
                    letra = group_name.replace('Group ', '').strip()
                    grupo, _ = Grupo.objects.get_or_create(letra=letra)

                fecha_hora = datetime.fromisoformat(
                    match['utcDate'].replace('Z', '+00:00')
                )
                Partido.objects.update_or_create(
                    api_id=match['id'],
                    defaults={
                        'equipo_local': equipo_local,
                        'equipo_visitante': equipo_visitante,
                        'fase': fase_grupos,
                        'grupo': grupo,
                        'fecha_hora': fecha_hora,
                        'jornada': match.get('matchday', 1),
                    }
                )
            except Exception:
                continue

    def _sync_from_fallback(self):
        """Sincroniza desde los archivos JSON estáticos."""
        self._sync_equipos_fallback()
        self._sync_grupos_fallback()
        self._sync_partidos_fallback()

    def _sync_equipos_fallback(self):
        filepath = os.path.join(FIXTURES_DIR, 'worldcup2026_teams.json')
        if not os.path.exists(filepath):
            self.stdout.write(self.style.WARNING(f'  No existe {filepath}'))
            return
        with open(filepath, 'r', encoding='utf-8') as f:
            teams = json.load(f)
        self.stdout.write(f'  Cargando {len(teams)} equipos desde fallback...')
        for team in teams:
            Equipo.objects.update_or_create(
                nombre_corto=team['nombre_corto'],
                defaults=team
            )

    def _sync_grupos_fallback(self):
        filepath = os.path.join(FIXTURES_DIR, 'worldcup2026_groups.json')
        if not os.path.exists(filepath):
            return
        with open(filepath, 'r', encoding='utf-8') as f:
            grupos_data = json.load(f)
        self.stdout.write(f'  Cargando {len(grupos_data)} grupos desde fallback...')
        for grupo_data in grupos_data:
            grupo, _ = Grupo.objects.get_or_create(letra=grupo_data['letra'])
            for pos, nombre_corto in enumerate(grupo_data['equipos'], start=1):
                try:
                    equipo = Equipo.objects.get(nombre_corto=nombre_corto)
                    GrupoEquipo.objects.update_or_create(
                        grupo=grupo, equipo=equipo,
                        defaults={'posicion': pos}
                    )
                except Equipo.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(f'    Equipo {nombre_corto} no encontrado')
                    )

    def _sync_partidos_fallback(self):
        filepath = os.path.join(FIXTURES_DIR, 'worldcup2026_schedule.json')
        if not os.path.exists(filepath):
            return
        with open(filepath, 'r', encoding='utf-8') as f:
            partidos_data = json.load(f)
        fase_grupos = Fase.objects.get(slug='grupos')
        self.stdout.write(f'  Cargando {len(partidos_data)} partidos desde fallback...')
        for p in partidos_data:
            try:
                equipo_local = Equipo.objects.get(nombre_corto=p['local'])
                equipo_visitante = Equipo.objects.get(nombre_corto=p['visitante'])
                grupo = Grupo.objects.get(letra=p['grupo']) if p.get('grupo') else None
                fecha_hora = datetime.fromisoformat(p['fecha_hora'])
                if fecha_hora.tzinfo is None:
                    fecha_hora = timezone.make_aware(fecha_hora)
                Partido.objects.get_or_create(
                    equipo_local=equipo_local,
                    equipo_visitante=equipo_visitante,
                    defaults={
                        'fase': fase_grupos,
                        'grupo': grupo,
                        'jornada': p.get('jornada', 1),
                        'fecha_hora': fecha_hora,
                        'sede': p.get('sede', ''),
                        'ciudad': p.get('ciudad', ''),
                    }
                )
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'    Error partido: {e}'))

    def _print_summary(self):
        self.stdout.write('\n[RESUMEN]')
        self.stdout.write(f'  Equipos:  {Equipo.objects.count()}')
        self.stdout.write(f'  Grupos:   {Grupo.objects.count()}')
        self.stdout.write(f'  Fases:    {Fase.objects.count()}')
        self.stdout.write(f'  Partidos: {Partido.objects.count()}')
