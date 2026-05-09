"""
Management command: python manage.py activar_fase <slug>
Activa una fase del torneo de forma manual desde la línea de comandos.
"""
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from core.models import Fase


class Command(BaseCommand):
    help = 'Activa o desactiva una fase del torneo manualmente'

    def add_arguments(self, parser):
        parser.add_argument('slug', type=str, help='Slug de la fase (ej: grupos, octavos, final)')
        parser.add_argument(
            '--desactivar', action='store_true',
            help='Desactiva la fase en vez de activarla'
        )
        parser.add_argument(
            '--bloquear', action='store_true',
            help='Bloquea la fase (cierra pronósticos)'
        )

    def handle(self, *args, **options):
        slug = options['slug']

        try:
            fase = Fase.objects.get(slug=slug)
        except Fase.DoesNotExist:
            fases_disponibles = list(Fase.objects.values_list('slug', flat=True))
            raise CommandError(
                f"Fase '{slug}' no existe. Fases disponibles: {fases_disponibles}"
            )

        if options['bloquear']:
            fase.bloqueada = True
            fase.save()
            self.stdout.write(self.style.WARNING(
                f"[BLOQUEADA] Fase '{fase.nombre}' - pronosticos cerrados."
            ))
            return

        if options['desactivar']:
            fase.activa = False
            fase.save()
            self.stdout.write(self.style.WARNING(
                f"[DESACTIVADA] Fase '{fase.nombre}'."
            ))
            return

        # Activar la fase
        fase.activa = True
        fase.bloqueada = False
        fase.save()

        self.stdout.write(self.style.SUCCESS(
            f"[OK] Fase '{fase.nombre}' (slug: {fase.slug}) ACTIVADA correctamente."
        ))
        self.stdout.write(f"   Fecha de cierre: {fase.fecha_cierre}")
        self.stdout.write(f"   Tiempo restante: {fase.tiempo_restante()} segundos")

        # Listar estado de todas las fases
        self.stdout.write("\nEstado actual de todas las fases:")
        for f in Fase.objects.all().order_by('orden'):
            if f.activa and not f.bloqueada:
                estado = '[ACTIVA]'
            elif f.bloqueada:
                estado = '[BLOQUEADA]'
            else:
                estado = '[INACTIVA]'
            self.stdout.write(f"   {estado} {f.nombre} ({f.slug})")

