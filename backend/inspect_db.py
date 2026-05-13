import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
os.environ['DATABASE_URL'] = 'postgresql://postgres.nphntxzxnweqtzjbxipl:Alemania24.rob@aws-1-us-west-1.pooler.supabase.com:5432/postgres'
django.setup()
from core.models import Quiniela, Partido, PronosticoPartido

print(f'Quinielas totales: {Quiniela.objects.count()}')
print(f'Quinielas pagadas: {Quiniela.objects.filter(estado="pagada").count()}')

for q in Quiniela.objects.filter(estado="pagada"):
    print(f'Quiniela: {q.nombre} - Puntos: {q.puntos_totales}')
    
partidos_con_resultado = Partido.objects.filter(resultado_cargado=True)
print(f'\nPartidos con resultado cargado: {partidos_con_resultado.count()}')
for p in partidos_con_resultado:
    print(f'{p.equipo_local.nombre} {p.goles_local} - {p.goles_visitante} {p.equipo_visitante.nombre}')

print(f'\nPronosticos totales: {PronosticoPartido.objects.count()}')
pronosticos_con_puntos = PronosticoPartido.objects.filter(puntos_ganados__gt=0)
print(f'Pronosticos con puntos ganados: {pronosticos_con_puntos.count()}')
