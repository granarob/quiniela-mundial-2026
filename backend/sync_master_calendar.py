import os, django
from datetime import datetime, timedelta, timezone
from django.db import transaction

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
os.environ['DATABASE_URL'] = 'postgresql://postgres.nphntxzxnweqtzjbxipl:Alemania24.rob@aws-1-us-west-1.pooler.supabase.com:5432/postgres'
django.setup()

from core.models import Partido, Equipo, Grupo, Fase

def update_calendar():
    print("--- Iniciando Actualización Rápida de Calendario ---")
    
    team_map = {
        "México": "México", "Sudáfrica": "Sudáfrica", "Corea del Sur": "Corea del Sur", "Chequia / Rep. UEFA": "República Checa",
        "Canadá": "Canadá", "Bosnia y Herzegovina": "Bosnia y Herzegovina", "Estados Unidos": "Estados Unidos", "Paraguay": "Paraguay",
        "Catar": "Qatar", "Suiza": "Suiza", "Brasil": "Brasil", "Marruecos": "Marruecos", "Haití": "Haití", "Escocia": "Escocia",
        "Australia": "Australia", "Turquía": "Turquía", "Alemania": "Alemania", "Curazao": "Curazao", "Países Bajos": "Países Bajos",
        "Japón": "Japón", "Costa de Marfil": "Costa de Marfil", "Ecuador": "Ecuador", "Suecia": "Suecia", "Túnez": "Túnez",
        "España": "España", "Cabo Verde": "Cabo Verde", "Bélgica": "Bélgica", "Egipto": "Egipto", "Arabia Saudita": "Arabia Saudita",
        "Uruguay": "Uruguay", "Irán": "Irán", "Nueva Zelanda": "Nueva Zelanda", "Francia": "Francia", "Senegal": "Senegal",
        "Irak": "Irak", "Noruega": "Noruega", "Argentina": "Argentina", "Argelia": "Argelia", "Austria": "Austria", "Jordania": "Jordania",
        "Portugal": "Portugal", "RD Congo": "RD Congo", "Inglaterra": "Inglaterra", "Croacia": "Croacia", "Ghana": "Ghana", "Panamá": "Panamá",
        "Uzbekistán": "Uzbekistán", "Colombia": "Colombia"
    }

    data = [
        # (Jornada, Fecha VE, Hora VE, Grupo, Local, Visitante, Estadio, Ciudad)
        (1, "2026-06-11", "15:00", "A", "México", "Sudáfrica", "Estadio Ciudad de México", "CDMX"),
        (1, "2026-06-11", "22:00", "A", "Corea del Sur", "Chequia / Rep. UEFA", "Estadio Akron", "Guadalajara"),
        (1, "2026-06-12", "15:00", "B", "Canadá", "Bosnia y Herzegovina", "BMO Field", "Toronto"),
        (1, "2026-06-12", "21:00", "D", "Estados Unidos", "Paraguay", "SoFi Stadium", "Los Ángeles"),
        (1, "2026-06-13", "15:00", "B", "Catar", "Suiza", "Levi's Stadium", "San Francisco"),
        (1, "2026-06-13", "18:00", "C", "Brasil", "Marruecos", "MetLife Stadium", "NY / NJ"),
        (1, "2026-06-13", "21:00", "C", "Haití", "Escocia", "Gillette Stadium", "Boston"),
        (1, "2026-06-14", "00:00", "D", "Australia", "Turquía", "BC Place", "Vancouver"),
        (1, "2026-06-14", "13:00", "E", "Alemania", "Curazao", "NRG Stadium", "Houston"),
        (1, "2026-06-14", "16:00", "F", "Países Bajos", "Japón", "AT&T Stadium", "Dallas"),
        (1, "2026-06-14", "19:00", "E", "Costa de Marfil", "Ecuador", "Lincoln Financial Field", "Filadelfia"),
        (1, "2026-06-14", "22:00", "F", "Suecia", "Túnez", "Estadio BBVA", "Monterrey"),
        (1, "2026-06-15", "12:00", "H", "España", "Cabo Verde", "Mercedes-Benz Stadium", "Atlanta"),
        (1, "2026-06-15", "15:00", "G", "Bélgica", "Egipto", "Lumen Field", "Seattle"),
        (1, "2026-06-15", "18:00", "H", "Arabia Saudita", "Uruguay", "Hard Rock Stadium", "Miami"),
        (1, "2026-06-15", "21:00", "G", "Irán", "Nueva Zelanda", "SoFi Stadium", "Los Ángeles"),
        (1, "2026-06-16", "15:00", "I", "Francia", "Senegal", "MetLife Stadium", "NY / NJ"),
        (1, "2026-06-16", "18:00", "I", "Irak", "Noruega", "Gillette Stadium", "Boston"),
        (1, "2026-06-16", "21:00", "J", "Argentina", "Argelia", "Arrowhead Stadium", "Kansas City"),
        (1, "2026-06-17", "00:00", "J", "Austria", "Jordania", "Levi's Stadium", "San Francisco"),
        (1, "2026-06-17", "13:00", "K", "Portugal", "RD Congo", "NRG Stadium", "Houston"),
        (1, "2026-06-17", "16:00", "L", "Inglaterra", "Croacia", "AT&T Stadium", "Dallas"),
        (1, "2026-06-17", "19:00", "L", "Ghana", "Panamá", "BMO Field", "Toronto"),
        (1, "2026-06-17", "22:00", "K", "Uzbekistán", "Colombia", "Estadio Ciudad de México", "CDMX"),
        
        # Jornada 2
        (2, "2026-06-18", "12:00", "A", "Chequia / Rep. UEFA", "Sudáfrica", "Mercedes-Benz Stadium", "Atlanta"),
        (2, "2026-06-18", "15:00", "B", "Suiza", "Bosnia y Herzegovina", "SoFi Stadium", "Los Ángeles"),
        (2, "2026-06-18", "18:00", "B", "Canadá", "Catar", "BC Place", "Vancouver"),
        (2, "2026-06-18", "21:00", "A", "México", "Corea del Sur", "Estadio Akron", "Guadalajara"),
        (2, "2026-06-19", "15:00", "D", "Estados Unidos", "Australia", "Lumen Field", "Seattle"),
        (2, "2026-06-19", "18:00", "C", "Escocia", "Marruecos", "Gillette Stadium", "Boston"),
        (2, "2026-06-19", "21:00", "C", "Brasil", "Haití", "Lincoln Financial Field", "Filadelfia"),
        (2, "2026-06-20", "00:00", "D", "Turquía", "Paraguay", "Levi's Stadium", "San Francisco"),
        (2, "2026-06-20", "13:00", "F", "Países Bajos", "Suecia", "NRG Stadium", "Houston"),
        (2, "2026-06-20", "16:00", "E", "Alemania", "Costa de Marfil", "BMO Field", "Toronto"),
        (2, "2026-06-20", "20:00", "E", "Ecuador", "Curazao", "Arrowhead Stadium", "Kansas City"),
        (2, "2026-06-21", "00:00", "F", "Túnez", "Japón", "Estadio BBVA", "Monterrey"),
        (2, "2026-06-21", "12:00", "H", "España", "Arabia Saudita", "Mercedes-Benz Stadium", "Atlanta"),
        (2, "2026-06-21", "15:00", "G", "Bélgica", "Irán", "SoFi Stadium", "Los Ángeles"),
        (2, "2026-06-21", "18:00", "H", "Uruguay", "Cabo Verde", "Hard Rock Stadium", "Miami"),
        (2, "2026-06-21", "21:00", "G", "Nueva Zelanda", "Egipto", "BC Place", "Vancouver"),
        (2, "2026-06-22", "13:00", "J", "Argentina", "Austria", "AT&T Stadium", "Dallas"),
        (2, "2026-06-22", "17:00", "I", "Francia", "Irak", "Lincoln Financial Field", "Filadelfia"),
        (2, "2026-06-22", "20:00", "I", "Noruega", "Senegal", "MetLife Stadium", "NY / NJ"),
        (2, "2026-06-22", "23:00", "J", "Jordania", "Argelia", "Levi's Stadium", "San Francisco"),
        (2, "2026-06-23", "13:00", "K", "Portugal", "Uzbekistán", "NRG Stadium", "Houston"),
        (2, "2026-06-23", "16:00", "L", "Inglaterra", "Ghana", "Gillette Stadium", "Boston"),
        (2, "2026-06-23", "19:00", "L", "Panamá", "Croacia", "BMO Field", "Toronto"),
        (2, "2026-06-23", "22:00", "K", "Colombia", "RD Congo", "Estadio Akron", "Guadalajara"),
        
        # Jornada 3
        (3, "2026-06-24", "15:00", "B", "Suiza", "Canadá", "BC Place", "Vancouver"),
        (3, "2026-06-24", "15:00", "B", "Bosnia y Herzegovina", "Catar", "Lumen Field", "Seattle"),
        (3, "2026-06-24", "18:00", "C", "Escocia", "Brasil", "Hard Rock Stadium", "Miami"),
        (3, "2026-06-24", "18:00", "C", "Marruecos", "Haití", "Mercedes-Benz Stadium", "Atlanta"),
        (3, "2026-06-24", "21:00", "A", "Chequia / Rep. UEFA", "México", "Estadio Ciudad de México", "CDMX"),
        (3, "2026-06-24", "21:00", "A", "Sudáfrica", "Corea del Sur", "Estadio BBVA", "Monterrey"),
        (3, "2026-06-25", "16:00", "E", "Curazao", "Costa de Marfil", "Lincoln Financial Field", "Filadelfia"),
        (3, "2026-06-25", "16:00", "E", "Ecuador", "Alemania", "MetLife Stadium", "NY / NJ"),
        (3, "2026-06-25", "19:00", "F", "Japón", "Suecia", "AT&T Stadium", "Dallas"),
        (3, "2026-06-25", "19:00", "F", "Túnez", "Países Bajos", "Arrowhead Stadium", "Kansas City"),
        (3, "2026-06-25", "22:00", "D", "Turquía", "Estados Unidos", "SoFi Stadium", "Los Ángeles"),
        (3, "2026-06-25", "22:00", "D", "Paraguay", "Australia", "Levi's Stadium", "San Francisco"),
        (3, "2026-06-26", "15:00", "I", "Noruega", "Francia", "Gillette Stadium", "Boston"),
        (3, "2026-06-26", "15:00", "I", "Senegal", "Irak", "BMO Field", "Toronto"),
        (3, "2026-06-26", "20:00", "H", "Cabo Verde", "Arabia Saudita", "NRG Stadium", "Houston"),
        (3, "2026-06-26", "20:00", "H", "Uruguay", "España", "Estadio Akron", "Guadalajara"),
        (3, "2026-06-26", "23:00", "G", "Egipto", "Irán", "Lumen Field", "Seattle"),
        (3, "2026-06-26", "23:00", "G", "Nueva Zelanda", "Bélgica", "BC Place", "Vancouver"),
        (3, "2027-06-27", "17:00", "L", "Panamá", "Inglaterra", "MetLife Stadium", "NY / NJ"),
        (3, "2027-06-27", "17:00", "L", "Croacia", "Ghana", "Lincoln Financial Field", "Filadelfia"),
        (3, "2027-06-27", "19:30", "K", "Colombia", "Portugal", "Hard Rock Stadium", "Miami"),
        (3, "2027-06-27", "19:30", "K", "RD Congo", "Uzbekistán", "Mercedes-Benz Stadium", "Atlanta"),
        (3, "2027-06-27", "22:00", "J", "Argelia", "Austria", "Arrowhead Stadium", "Kansas City"),
        (3, "2027-06-27", "22:00", "J", "Jordania", "Argentina", "AT&T Stadium", "Dallas"),
    ]

    fase_grupos = Fase.objects.get(slug='grupos')
    
    with transaction.atomic():
        for jorn, f_ve, h_ve, g_letra, loc_name, vis_name, sede, ciudad in data:
            el = Equipo.objects.get(nombre=team_map[loc_name])
            ev = Equipo.objects.get(nombre=team_map[vis_name])
            grp = Grupo.objects.get(letra=g_letra)
            
            dt_ve = datetime.strptime(f"{f_ve} {h_ve}", "%Y-%m-%d %H:%M")
            dt_utc = (dt_ve + timedelta(hours=4)).replace(tzinfo=timezone.utc)
            
            # Buscar y actualizar o crear
            partido = Partido.objects.filter(fase=fase_grupos, equipo_local=el, equipo_visitante=ev).first()
            if partido:
                partido.fecha_hora = dt_utc
                partido.sede = sede
                partido.ciudad = ciudad
                partido.jornada = jorn
                partido.grupo = grp
                partido.save()
            else:
                Partido.objects.create(
                    fase=fase_grupos, equipo_local=el, equipo_visitante=ev, grupo=grp,
                    fecha_hora=dt_utc, sede=sede, ciudad=ciudad, jornada=jorn
                )
            print(f"OK: {el.nombre_corto} vs {ev.nombre_corto}")

    print("--- Calendario Actualizado ---")

if __name__ == "__main__":
    update_calendar()
