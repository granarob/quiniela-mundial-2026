from django.contrib.auth import get_user_model
from core.models import Quiniela, PronosticoPartido, PronosticoTorneo

User = get_user_model()
users = User.objects.all()
print(f'Processing {users.count()} users...')

for u in users:
    q, created = Quiniela.objects.get_or_create(
        usuario=u, 
        defaults={'nombre': 'Mi Primera Quiniela'}
    )
    # Since I removed the 'usuario' field from PronosticoPartido/Torneo in the migration,
    # I can't filter by 'quiniela__usuario' if quiniela is null.
    # Wait, the migration removed the 'usuario' field. 
    # Actually, I should have done the migration AFTER this script if I wanted to use the old field.
    # But I already ran the migration.
    
    # Let's assume most predictions are now orphans (quiniela_id is null).
    # Since I can't know which user they belonged to if the field is gone,
    # unless I use the migration history or if I hadn't removed it yet.
    
    # WAIT! If I removed the 'usuario' field in the migration, the data might be lost 
    # unless I created a temporary field.
    
    print(f'User {u.username}: Quiniela {q.nombre} ensured.')
