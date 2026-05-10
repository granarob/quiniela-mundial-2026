import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quiniela.settings')
django.setup()

from core.models import Partido
from sync.management.commands.sync_worldcup_data import Command

print("Deleting existing Partidos...")
Partido.objects.all().delete()

print("Re-syncing from fallback...")
cmd = Command()
cmd._sync_partidos_fallback()

print("Done. Partidos count:", Partido.objects.count())
