# 🏆 Steps: Implementación Quiniela Mundial 2026

Guía paso a paso para construir la plataforma web completa, siguiendo el PRD.

---

## FASE 1 — Fundación del Proyecto (Semana 1-2)

### Paso 1: Configurar el repositorio y estructura base

```bash
# Clonar/inicializar el repo
git init quiniela-mundial-2026
cd quiniela-mundial-2026

# Crear estructura de carpetas principal
mkdir backend frontend
```

**Archivos a crear:**
- `.gitignore` (Python + Node)
- `.env.example` (copiar plantilla del PRD §13)
- `docker-compose.yml` (servicios: backend, redis)
- `README.md`

---

### Paso 2: Inicializar el Backend (Django)

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows

pip install django djangorestframework django-cors-headers \
            dj-database-url psycopg2-binary python-dotenv \
            supabase celery redis

pip freeze > requirements.txt
django-admin startproject config .
python manage.py startapp core
python manage.py startapp users
python manage.py startapp sync
```

**Configurar `config/settings.py`:**
- `INSTALLED_APPS`: agregar `core`, `users`, `sync`, `rest_framework`, `corsheaders`
- `DATABASES`: usar `dj_database_url` con `DATABASE_URL` de Supabase
- `CORS_ALLOWED_ORIGINS`: `http://localhost:5173` (Vite dev)
- `REST_FRAMEWORK`: autenticación JWT (SimpleJWT)
- `MEDIA_ROOT` / `STATIC_ROOT`

---

### Paso 3: Inicializar el Frontend (React + Vite)

```bash
cd ../frontend
npm create vite@latest . -- --template react
npm install
npm install axios framer-motion react-router-dom @supabase/supabase-js
```

**Estructura de carpetas a crear dentro de `src/`:**
```
api/          → client.js, auth.js, matches.js, predictions.js
components/   → layout/, auth/, groups/, matches/, predictions/, leaderboard/, ui/
pages/        → Landing.jsx, Dashboard.jsx, Groups.jsx, etc.
hooks/        → useAuth.js, useCountdown.js, usePredictions.js
context/      → AuthContext.jsx
utils/        → constants.js, formatters.js
styles/       → variables.css, animations.css, components.css, pages.css
```

---

### Paso 4: Conectar Django ↔ Supabase

1. Crear proyecto en [supabase.com](https://supabase.com) y copiar credenciales al `.env`
2. En `config/settings.py` configurar `DATABASE_URL`:
   ```python
   import dj_database_url
   DATABASES = {'default': dj_database_url.config(default=os.environ.get('DATABASE_URL'))}
   ```
3. Verificar conexión:
   ```bash
   python manage.py dbshell
   ```

---

### Paso 5: Definir los Modelos de Datos

Editar `core/models.py` con los modelos del PRD §8.2:

- `Equipo` — 48 selecciones (nombre, código ISO, bandera, confederación)
- `Grupo` — 12 grupos A-L con M2M a Equipo via `GrupoEquipo`
- `Fase` — fases del torneo con fechas de apertura/cierre y flags `activa/bloqueada`
- `Partido` — fixture con FKs a Grupo, Fase, Equipo local, Equipo visitante
- `PronosticoPartido` — pronóstico de usuario por partido (unique_together)
- `PronosticoTorneo` — predicciones especiales del usuario (OneToOne)
- `Jugador` — planteles por equipo

```bash
python manage.py makemigrations
python manage.py migrate
```

---

### Paso 6: Design System CSS (Frontend)

Crear `src/styles/variables.css` con la paleta del PRD §7.2:

```css
:root {
  --color-primary: #1a1a2e;
  --color-secondary: #16213e;
  --color-accent: #e94560;
  --color-accent-gold: #f5a623;
  --gradient-hero: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  --glass-bg: rgba(255,255,255,0.06);
  --glass-border: rgba(255,255,255,0.1);
  --glass-blur: blur(20px);
  --font-display: 'Outfit', sans-serif;
  --font-body: 'Inter', sans-serif;
}
```

Importar Google Fonts y definir `animations.css` con las 10 micro-interacciones del PRD §7.5.

---

### Paso 7: Layout Base (Navbar, Footer, Rutas)

**Componentes a crear:**
- `components/layout/Navbar.jsx` — logo, links de navegación, avatar/logout
- `components/layout/Footer.jsx` — links, redes sociales, copyright
- `components/layout/Layout.jsx` — wrapper con Navbar + children + Footer
- `App.jsx` — React Router con rutas: `/`, `/login`, `/register`, `/dashboard`, `/grupos`, `/grupos/:letra`, `/leaderboard`, `/perfil`

**`components/auth/ProtectedRoute.jsx`** — redirige a `/login` si no hay sesión.

---

## FASE 2 — Datos del Mundial (Semana 2-3)

### Paso 8: Integrar API Deportiva

1. Registrarse en [football-data.org](https://api.football-data.org) y obtener API key
2. Guardar `FOOTBALL_API_KEY` y `FOOTBALL_API_BASE_URL` en `.env`
3. Crear `sync/services.py` con funciones para consumir:
   - `GET /v4/competitions/WC/teams` → equipos
   - `GET /v4/competitions/WC/standings` → grupos y posiciones
   - `GET /v4/competitions/WC/matches` → fixtures completos
4. Crear datos fallback en `backend/fixtures/`:
   - `worldcup2026_teams.json`
   - `worldcup2026_groups.json`
   - `worldcup2026_schedule.json`

---

### Paso 9: Management Command de Sincronización

Crear `sync/management/commands/sync_worldcup_data.py`:

```python
class Command(BaseCommand):
    help = 'Sincroniza equipos, grupos y fixtures desde API externa'

    def handle(self, *args, **options):
        # 1. Sincronizar 48 equipos
        # 2. Crear grupos A-L y asignar equipos
        # 3. Crear los 144 partidos de fase de grupos
        # 4. Crear fases con fechas de apertura/cierre
```

```bash
python manage.py sync_worldcup_data
```

> **Fallback**: si la API falla, leer desde los JSON estáticos en `fixtures/`.

---

### Paso 10: API Endpoints del Torneo (DRF)

Crear en `core/`:
- `serializers.py` → `EquipoSerializer`, `GrupoSerializer`, `FaseSerializer`, `PartidoSerializer`
- `views.py` → ViewSets para `/api/equipos/`, `/api/grupos/`, `/api/fases/`, `/api/partidos/`, `/api/jugadores/`
- `urls.py` → registrar con `DefaultRouter`

Conectar en `config/urls.py`:
```python
path('api/', include('core.urls')),
```

---

### Paso 11: Vista de Grupos (Frontend)

**Componentes:**
- `components/groups/GroupCard.jsx` — tarjeta glassmorphism con banderas de los 4 equipos, badge de estado (🔓/🔒/✅), contador de pronósticos
- `components/groups/GroupGrid.jsx` — grid 3 columnas responsive con las 12 tarjetas
- `pages/Groups.jsx` — consume `/api/grupos/`, muestra barra de progreso global

**Efectos visuales:**
- Hover: `transform: translateY(-8px)` + `box-shadow` neon sutil (200ms)
- Animación de entrada escalonada (stagger) con Framer Motion

---

## FASE 3 — Autenticación y Pronósticos (Semana 3-4)

### Paso 12: Autenticación con Supabase Auth

**Backend:**
- Instalar `djangorestframework-simplejwt`
- Crear `users/views.py` con endpoints `/api/auth/register/`, `/login/`, `/logout/`, `/refresh/`, `/me/`
- Validar tokens JWT contra Supabase en cada request

**Frontend:**
- `context/AuthContext.jsx` — estado global de sesión, funciones `login/logout/register`
- `hooks/useAuth.js` — hook consumidor del contexto
- `api/auth.js` — llamadas Axios a los endpoints de autenticación
- `pages/Login.jsx` y `pages/Register.jsx` — formularios con validación y animaciones
- `components/auth/ProtectedRoute.jsx` — guard de rutas privadas

---

### Paso 13: Formulario de Pronósticos de Grupo

**Componentes:**
- `components/matches/ScoreInput.jsx` — input numérico estilizado (0-99), efecto glow al hacer focus
- `components/matches/MatchCard.jsx` — layout `[Bandera] Equipo [__]-[__] Equipo [Bandera]`, fecha, estado
- `components/matches/MatchList.jsx` — lista de partidos de un grupo agrupados por jornada
- `pages/GroupDetail.jsx` — vista completa del grupo con todas las jornadas + botón Guardar

**Lógica de auto-save:**
```javascript
// hooks/usePredictions.js
const debouncedSave = useCallback(
  debounce((partidoId, goles) => {
    api.predictions.save(partidoId, goles);
  }, 2000),
  []
);
```

---

### Paso 14: Endpoints de Pronósticos (Backend)

En `core/views.py` agregar:
- `GET/POST /api/pronosticos/partidos/` — listar y crear pronósticos del usuario autenticado
- `POST /api/pronosticos/partidos/bulk/` — guardar múltiples pronósticos a la vez
- `GET/POST /api/pronosticos/torneo/` — predicciones especiales
- `GET /api/pronosticos/resumen/` — resumen de puntos del usuario

Crear `core/permissions.py`:
```python
class FaseAbiertaPermission(BasePermission):
    """Retorna 403 si la fase está bloqueada (Hard Lock)."""
    def has_object_permission(self, request, view, obj):
        return obj.partido.fase.esta_abierta()
```

---

### Paso 15: Predicciones Especiales (Bonos)

**Componente `components/predictions/SpecialPredictions.jsx`:**
- Dropdown con búsqueda de las 48 selecciones → Campeón, Subcampeón, 3er y 4to lugar
- Autocompletado de jugadores → Goleador (Bota de Oro) y Líder en Asistencias
- Se bloquea al iniciar el primer partido del mundial
- Visual de "sobre sellado" con animación de apertura al revelar resultados

---

### Paso 16: Lógica de Hard Lock

**Frontend:**
- `components/ui/CountdownTimer.jsx` — números estilo flip-clock, cuenta regresiva al kickoff
- Al llegar a 0: overlay semitransparente + ícono de candado que gira + inputs deshabilitados

**Backend (`core/permissions.py`):**
```python
class FaseAbiertaPermission(BasePermission):
    def has_permission(self, request, view):
        fase = get_fase_from_request(request)
        if not fase.esta_abierta():
            raise PermissionDenied("Esta fase ya está cerrada.")
        return True
```

---

## FASE 4 — Puntuación y Leaderboard (Semana 4-5)

### Paso 17: Panel Admin para Resultados

Editar `core/admin.py`:
```python
@admin.register(Partido)
class PartidoAdmin(admin.ModelAdmin):
    list_display = ['equipo_local', 'equipo_visitante', 'fecha_hora', 'goles_local', 'goles_visitante', 'resultado_cargado']
    list_editable = ['goles_local', 'goles_visitante', 'resultado_cargado']
    actions = ['calcular_puntos_accion']
```

---

### Paso 18: Algoritmo de Cálculo de Puntos

Crear `core/utils.py`:

```python
def calcular_puntos_partido(pronostico, partido):
    """Reglas del PRD §4.1 y §4.2"""
    pred_l = pronostico.goles_local_pred
    pred_v = pronostico.goles_visitante_pred
    real_l = partido.goles_local
    real_v = partido.goles_visitante
    es_eliminatoria = partido.fase.slug != 'grupos'

    # Marcador exacto
    if pred_l == real_l and pred_v == real_v:
        return 7 if es_eliminatoria else 5

    # Tendencia correcta (ganador o empate)
    pred_tend = (pred_l > pred_v) - (pred_l < pred_v)  # -1, 0, 1
    real_tend = (real_l > real_v) - (real_l < real_v)
    if pred_tend == real_tend:
        return 4 if es_eliminatoria else 3

    return 0
```

Crear `core/signals.py`:
```python
@receiver(post_save, sender=Partido)
def calcular_puntos_al_guardar(sender, instance, **kwargs):
    if instance.resultado_cargado:
        PronosticoPartido.objects.filter(partido=instance).update_puntos()
```

---

### Paso 19: Leaderboard

**Backend:**
- `GET /api/leaderboard/` — ranking global paginado (ordenado por `puntos_totales` DESC)
- `GET /api/leaderboard/top/{n}/` — top N usuarios
- `GET /api/leaderboard/mi-posicion/` — posición del usuario autenticado

**Frontend:**
- `components/leaderboard/LeaderboardTable.jsx` — tabla con hover gradient, badges 🥇🥈🥉 para top 3, shimmer dorado
- `components/leaderboard/LeaderboardRow.jsx` — fila con flip animation al cambiar posición
- `pages/Leaderboard.jsx` — tabla completa + fila sticky del usuario actual

---

### Paso 20: Dashboard Personal

**Componentes:**
- `components/ui/AnimatedNumber.jsx` — contador animado de puntos (Framer Motion)
- `pages/Dashboard.jsx`:
  - 3 tarjetas: Puntos totales | Posición en ranking | Pronósticos completados
  - Selector de fases (🔓 activa / 🔒 bloqueadas)
  - Alerta de partidos sin pronosticar
  - Mini leaderboard (top 10 + tu posición)

---

## FASE 5 — Desbloqueo Progresivo (Semana 5-6)

### Paso 21: Lógica de Fases (Backend)

En `core/models.py`, `Fase.esta_abierta()` ya usa `fecha_cierre`. Agregar:

```python
# Celery task para bloquear fases automáticamente
@shared_task
def bloquear_fase_si_cerrada():
    fases = Fase.objects.filter(activa=True, bloqueada=False)
    for fase in fases:
        if timezone.now() >= fase.fecha_cierre:
            fase.bloqueada = True
            fase.save()
```

Configurar Celery beat para ejecutar esta tarea cada minuto.

**Endpoint admin:**
- `POST /api/admin/activar-fase/{slug}/` — activar manualmente una nueva fase

---

### Paso 22: UI de Fases Eliminatorias

**Componentes:**
- Reutilizar `MatchCard.jsx` y `ScoreInput.jsx` para fases eliminatorias
- En `GroupDetail.jsx` adaptar para mostrar cruces (sin grupo)
- Efecto "reveal" con partículas (Framer Motion) al desbloquear nueva fase

**Páginas de eliminatorias:**
- Bracket visual opcional mostrando el avance del torneo

---

### Paso 23: Celery + Redis (Sincronización Automática)

```bash
# Instalar y correr Redis (Docker recomendado)
docker run -d -p 6379:6379 redis

# En nueva terminal
celery -A config worker --loglevel=info
celery -A config beat --loglevel=info
```

`sync/tasks.py`:
```python
@shared_task
def sync_resultados_live():
    """Corre cada 5 minutos durante días de partido."""
    from sync.services import actualizar_resultados
    actualizar_resultados()
```

---

## FASE 6 — Pulido y Lanzamiento (Semana 6-7)

### Paso 24: Animaciones Completas con Framer Motion

Implementar en todos los componentes clave:

| Animación | Componente | Duración |
|---|---|---|
| Page transitions (fade+slide) | `App.jsx` con `AnimatePresence` | 300ms |
| Card hover (translateY + glow) | `GroupCard`, `MatchCard` | 200ms |
| Score input focus (glow + scale) | `ScoreInput` | 150ms |
| Save confirmation (checkmark) | `MatchCard` | 500ms |
| Lock activation (candado + overlay) | `GroupDetail` | 600ms |
| Leaderboard flip animation | `LeaderboardRow` | 400ms |
| Phase unlock reveal + partículas | `Dashboard` | 800ms |
| Countdown flip-clock | `CountdownTimer` | loop |
| Skeleton loading (shimmer) | `SkeletonLoader` | loop |
| Scroll stagger (intersection) | `GroupGrid` | 100ms stagger |

---

### Paso 25: Responsive Design (Mobile-First)

Breakpoints del PRD §6.3: **320px / 768px / 1024px / 1440px**

- `GroupGrid`: 1 col (mobile) → 2 col (tablet) → 3 col (desktop)
- `Navbar`: hamburguer menu en mobile
- `MatchCard`: layout vertical en mobile
- `LeaderboardTable`: scroll horizontal en mobile
- Botones mínimo **44px** de altura (touch-friendly)
- Probar con DevTools en iPhone SE, iPad, y 1440px

---

### Paso 26: Performance y SEO

**Optimizaciones:**
```javascript
// Lazy loading de rutas en App.jsx
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
```

- `<Suspense>` con `SkeletonLoader` como fallback
- Imágenes de banderas en formato SVG (ya incluidas)
- Code splitting automático con Vite

**SEO en `index.html`:**
```html
<title>Quiniela Mundial 2026 ⚽ | Predice. Compite. Gana.</title>
<meta name="description" content="La mejor plataforma de pronósticos para el Mundial de Fútbol FIFA 2026. Compite con amigos, acumula puntos y gana premios.">
<meta property="og:title" content="Quiniela Mundial 2026">
<meta property="og:image" content="/og-image.png">
```

---

### Paso 27: Testing

**Backend (pytest):**
```bash
pip install pytest pytest-django
pytest core/tests/
```

Tests a escribir:
- `test_calcular_puntos.py` — todos los escenarios de puntuación (§4)
- `test_hard_lock.py` — verificar 403 post-deadline
- `test_leaderboard.py` — orden correcto del ranking

**Frontend (Vitest):**
```bash
npm run test
```

Tests a escribir:
- `ScoreInput.test.jsx` — validación de inputs
- `CountdownTimer.test.jsx` — formateo de tiempo
- `useAuth.test.js` — flujo de login/logout

**E2E (Playwright):**
```bash
npx playwright test
```

Flujos a probar:
- Registro → Login → Pronosticar grupo → Guardar → Ver leaderboard

---

### Paso 28: Deploy a Producción

**Backend (Railway / Render):**
```bash
# Configurar variables de entorno en el dashboard
# Correr migraciones en producción
python manage.py migrate
python manage.py collectstatic
```

**Frontend (Vercel / Netlify):**
```bash
npm run build
# Subir dist/ o conectar repo a Vercel
```

**Variables de entorno en producción:**
- `DJANGO_DEBUG=False`
- `DJANGO_ALLOWED_HOSTS=tu-dominio.com`
- `CORS_ALLOWED_ORIGINS=https://tu-frontend.vercel.app`
- Resto de credenciales de Supabase y API deportiva

---

## Resumen de Fases

| Fase | Semana | Entregables Clave |
|---|---|---|
| **1. Fundación** | 1-2 | Repo, Django, React, Supabase conectado, modelos, design system, layout base |
| **2. Datos** | 2-3 | API deportiva integrada, sync command, endpoints torneo, vista de grupos |
| **3. Auth + Pronósticos** | 3-4 | Login/registro, formularios de pronóstico, auto-save, Hard Lock, predicciones especiales |
| **4. Puntuación** | 4-5 | Admin de resultados, algoritmo de puntos, leaderboard, dashboard personal |
| **5. Fases** | 5-6 | Desbloqueo progresivo, Celery beat, UI eliminatorias, countdowns |
| **6. Lanzamiento** | 6-7 | Animaciones completas, responsive, performance, SEO, tests, deploy |

---

> ⚽ **Fecha límite:** El torneo inicia el **11 de junio de 2026**. La plataforma debe estar en producción al menos **2 semanas antes** para permitir que los usuarios se registren y hagan sus pronósticos.
