import os, django, sys

def run_health_check():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    # Eliminadas credenciales por seguridad. Se cargan desde el entorno.
    try:
        django.setup()
    except Exception as e:
        print(f"Error al configurar Django: {e}")
        return False

    from rest_framework.test import APIRequestFactory, force_authenticate
    from core.views import PartidoViewSet, LeaderboardViewSet, PronosticoPartidoViewSet
    from django.contrib.auth.models import User
    
    factory = APIRequestFactory()
    user = User.objects.filter(is_staff=True).first()
    
    endpoints = [
        {'name': 'Lista de Partidos', 'view': PartidoViewSet.as_view({'get': 'list'}), 'path': '/api/partidos/'},
        {'name': 'Ranking Global', 'view': LeaderboardViewSet.as_view({'get': 'list'}), 'path': '/api/leaderboard/'},
        {'name': 'Matriz de Tablero', 'view': PronosticoPartidoViewSet.as_view({'get': 'matrix'}), 'path': '/api/pronosticos/partidos/matrix/', 'params': {'jornada': 1}},
    ]

    all_ok = True
    print("\n--- INICIANDO CHEQUEO DE SALUD DEL SISTEMA ---")
    print("-" * 50)

    for ep in endpoints:
        try:
            request = factory.get(ep['path'], ep.get('params', {}))
            if user:
                force_authenticate(request, user=user)
            
            response = ep['view'](request)
            
            if response.status_code == 200:
                print(f"OK - {ep['name']}: (200)")
            else:
                print(f"ERROR - {ep['name']}: ({response.status_code})")
                print(f"   Detalle: {response.data}")
                all_ok = False
        except Exception as e:
            print(f"CRASH - {ep['name']}!")
            print(f"   Error: {str(e)}")
            all_ok = False

    print("-" * 50)
    if all_ok:
        print("SISTEMA SALUDABLE - LISTO PARA DESPLEGAR\n")
    else:
        print("SE DETECTARON ERRORES - NO DESPLEGAR\n")
    
    return all_ok

if __name__ == "__main__":
    success = run_health_check()
    if not success:
        sys.exit(1)
