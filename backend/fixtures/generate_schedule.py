import json
from datetime import datetime, timedelta

def generate():
    with open('c:/Users/grana/python/quiniela-mundial-2026-1/backend/fixtures/worldcup2026_groups.json', 'r') as f:
        groups = json.load(f)

    schedule = []
    base_date = datetime(2026, 6, 11, 12, 0, 0)
    
    for idx, g in enumerate(groups):
        letra = g['letra']
        t = g['equipos']
        
        # J1
        schedule.append({
            "local": t[0], "visitante": t[1], "grupo": letra, "jornada": 1,
            "fecha_hora": (base_date + timedelta(days=idx)).isoformat(),
            "sede": "Estadio por definir", "ciudad": "Sede por definir"
        })
        schedule.append({
            "local": t[2], "visitante": t[3], "grupo": letra, "jornada": 1,
            "fecha_hora": (base_date + timedelta(days=idx, hours=4)).isoformat(),
            "sede": "Estadio por definir", "ciudad": "Sede por definir"
        })
        
        # J2
        schedule.append({
            "local": t[0], "visitante": t[2], "grupo": letra, "jornada": 2,
            "fecha_hora": (base_date + timedelta(days=idx+4)).isoformat(),
            "sede": "Estadio por definir", "ciudad": "Sede por definir"
        })
        schedule.append({
            "local": t[3], "visitante": t[1], "grupo": letra, "jornada": 2,
            "fecha_hora": (base_date + timedelta(days=idx+4, hours=4)).isoformat(),
            "sede": "Estadio por definir", "ciudad": "Sede por definir"
        })
        
        # J3
        schedule.append({
            "local": t[3], "visitante": t[0], "grupo": letra, "jornada": 3,
            "fecha_hora": (base_date + timedelta(days=idx+8)).isoformat(),
            "sede": "Estadio por definir", "ciudad": "Sede por definir"
        })
        schedule.append({
            "local": t[1], "visitante": t[2], "grupo": letra, "jornada": 3,
            "fecha_hora": (base_date + timedelta(days=idx+8, hours=4)).isoformat(),
            "sede": "Estadio por definir", "ciudad": "Sede por definir"
        })

    with open('c:/Users/grana/python/quiniela-mundial-2026-1/backend/fixtures/worldcup2026_schedule.json', 'w') as f:
        json.dump(schedule, f, indent=2)

if __name__ == '__main__':
    generate()
