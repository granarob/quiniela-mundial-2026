import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
# Usamos la DB de producción directamente
os.environ['DATABASE_URL'] = 'postgresql://postgres.nphntxzxnweqtzjbxipl:Alemania24.rob@aws-1-us-west-1.pooler.supabase.com:5432/postgres'
django.setup()

from core.models import Partido, Quiniela, PronosticoPartido
from core.signals import actualizar_puntos_quiniela
from core.utils import calcular_puntos_partido

print("--- Iniciando Recalculo Manual de Puntos ---")

# 1. Recalcular cada pronóstico de partidos finalizados
partidos_con_resultado = Partido.objects.filter(resultado_cargado=True)
print(f"Partidos con resultado: {partidos_con_resultado.count()}")

for partido in partidos_con_resultado:
    pronosticos = PronosticoPartido.objects.filter(partido=partido)
    for p in pronosticos:
        puntos = calcular_puntos_partido(p, partido)
        if p.puntos_ganados != puntos:
            p.puntos_ganados = puntos
            p.save(update_fields=['puntos_ganados'])

# 2. Recalcular totales de todas las quinielas pagadas
quinielas = Quiniela.objects.filter(estado='pagada')
print(f"Quinielas pagadas a recalcular: {quinielas.count()}")

for q in quinielas:
    actualizar_puntos_quiniela(q.id)
    print(f"  > Quiniela '{q.nombre}' (@{q.usuario.username}): {q.puntos_totales} pts")

print("--- Recalculo Finalizado ---")
