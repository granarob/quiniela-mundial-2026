# PRD: Plataforma Quiniela Mundial 2026 ⚽🏆

---

## 1. Resumen Ejecutivo

**Quiniela Mundial 2026** es una plataforma web interactiva que permite a los usuarios registrarse, autenticarse y realizar pronósticos sobre los partidos del Mundial de Fútbol FIFA 2026 (Estados Unidos, México y Canadá). La experiencia se desbloquea progresivamente: los usuarios comienzan pronosticando la **Fase de Grupos** y, conforme avanza el torneo, se habilitan las fases eliminatorias (Ronda de 32, Octavos, Cuartos, Semifinales y Final).

El objetivo es ofrecer una experiencia **moderna, elegante y visualmente impresionante**, con animaciones fluidas, efectos glassmorphism, transiciones cinematográficas y una interfaz que transmita la emoción del fútbol mundial.

### Datos Clave del Mundial 2026
| Dato | Detalle |
|---|---|
| **Equipos** | 48 selecciones |
| **Grupos** | 12 grupos de 4 equipos (A–L) |
| **Partidos Fase de Grupos** | 144 partidos |
| **Partidos Totales** | 104 partidos |
| **Clasificados a Eliminatorias** | Top 2 de cada grupo + 8 mejores terceros = 32 equipos |
| **Fases Eliminatorias** | Ronda de 32 → Octavos → Cuartos → Semifinales → Final |
| **Fecha Inicio** | 11 de junio de 2026 |
| **Fecha Final** | 19 de julio de 2026 |
| **Sedes** | 16 ciudades (11 USA, 3 México, 2 Canadá) |
| **Partido Inaugural** | México vs. Sudáfrica — Ciudad de México |

---

## 2. Stack Tecnológico

### 2.1 Arquitectura General

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                     │
│  React 18+ · React Router · Axios · Framer Motion      │
│  CSS Modules / Vanilla CSS · Google Fonts               │
└────────────────────────┬────────────────────────────────┘
                         │ REST API (JSON)
                         ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND (Django + DRF)                     │
│  Django 5.x · Django REST Framework · Celery            │
│  django-cors-headers · dj-database-url                  │
└────────────────────────┬────────────────────────────────┘
                         │ ORM / Supabase Client
                         ▼
┌─────────────────────────────────────────────────────────┐
│              BASE DE DATOS (Supabase)                   │
│  PostgreSQL · Supabase Auth · Realtime Subscriptions    │
│  Row Level Security (RLS) · Storage (Avatares)          │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│          API EXTERNA (Datos del Mundial)                │
│  Sportmonks / football-data.org / BallDontLie           │
│  Fixtures, Standings, Live Scores, Groups               │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Detalle del Stack

| Capa | Tecnología | Justificación |
|---|---|---|
| **Frontend** | React 18+ (Vite) | SPA moderna, rendimiento óptimo, ecosistema maduro |
| **Animaciones** | Framer Motion | Animaciones fluidas, transiciones de página, micro-interacciones |
| **Estilos** | Vanilla CSS + CSS Custom Properties | Control total sobre diseño, sin dependencias pesadas |
| **Tipografía** | Google Fonts (Inter, Outfit) | Tipografía moderna y legible |
| **Backend** | Django 5.x + DRF | ORM robusto, admin potente, serialización REST |
| **Tareas Async** | Celery + Redis | Cálculo masivo de puntos, sincronización de datos |
| **Base de Datos** | Supabase (PostgreSQL) | Auth integrado, Realtime, RLS, hosting gratuito |
| **Auth** | Supabase Auth + JWT | Login social (Google, GitHub), tokens seguros |
| **API Deportiva** | Sportmonks / football-data.org | Datos oficiales de grupos, fixtures, resultados live |

---

## 3. Integración de Datos del Mundial (API Externa)

### 3.1 Estrategia de Obtención de Datos

No existe una API pública oficial de FIFA. Se utilizará una **API deportiva de terceros** para obtener los datos del torneo:

#### Proveedores Recomendados (en orden de preferencia):

| Proveedor | Tier Gratuito | Datos Clave | URL |
|---|---|---|---|
| **football-data.org** | ✅ 10 req/min | Grupos, fixtures, standings | api.football-data.org |
| **Sportmonks** | ✅ Trial | Fixtures, live, squads | sportmonks.com |
| **BallDontLie** | ✅ Básico | WC 2026 específico | balldontlie.io |

### 3.2 Datos a Sincronizar

```python
# Django Management Command: sync_worldcup_data
class Command(BaseCommand):
    """
    Sincroniza datos del Mundial desde API externa.
    Ejecutar: python manage.py sync_worldcup_data
    """
    # Datos que se sincronizan:
    # 1. Equipos (48 selecciones con banderas, confederación)
    # 2. Grupos (A-L con asignación de equipos)
    # 3. Fixtures/Partidos (144 partidos fase de grupos + eliminatorias)
    # 4. Jugadores (planteles para predicciones de goleador/asistente)
    # 5. Resultados en vivo (durante el torneo, vía Celery beat)
```

### 3.3 Fallback: Datos Estáticos

En caso de fallo de la API, se mantendrá un archivo JSON estático con los datos base del torneo:

```
backend/
  fixtures/
    worldcup2026_groups.json    # 12 grupos con equipos
    worldcup2026_schedule.json  # Calendario completo
    worldcup2026_teams.json     # 48 equipos con metadata
```

---

## 4. Estructura de Puntuación (Reglas de Negocio)

### 4.1 Fase de Grupos — Por Partido

| Acierto | Puntos | Condición | Ejemplo |
|---|---|---|---|
| 🎯 **Marcador Exacto** | **5 pts** | Goles local Y visitante idénticos al resultado real | Pred: 2-1 → Real: 2-1 |
| 📊 **Tendencia Correcta** | **3 pts** | Acertar ganador o empate, sin marcador exacto | Pred: 3-1 → Real: 2-0 (ambos: local gana) |
| ❌ **Error** | **0 pts** | No acertar ni el resultado ni la tendencia | Pred: 1-0 → Real: 0-2 |

### 4.2 Fases Eliminatorias — Por Partido

| Acierto | Puntos | Condición |
|---|---|---|
| 🎯 **Marcador Exacto** | **7 pts** | Marcador idéntico (tiempo reglamentario) |
| 📊 **Tendencia Correcta** | **4 pts** | Acertar clasificado sin marcador exacto |
| 🔮 **Clasificado Correcto** | **2 pts** | Acertar quién avanza (incluso si pierde en penales) |
| ❌ **Error** | **0 pts** | No acertar nada |

### 4.3 Bonos de Torneo (Predicciones Especiales)

| Categoría | Puntos | Cuándo se evalúa |
|---|---|---|
| 🏆 **Campeón** | **25 pts** | Final |
| 🥈 **Subcampeón** | **20 pts** | Final |
| 🥉 **Tercer Lugar** | **10 pts** | Partido por 3er puesto |
| 4️⃣ **Cuarto Lugar** | **5 pts** | Partido por 3er puesto |
| ⚽ **Goleador (Bota de Oro)** | **15 pts** | Final del torneo |
| 🅰️ **Líder en Asistencias** | **10 pts** | Final del torneo |

### 4.4 Puntuación Máxima Teórica

| Concepto | Cálculo | Máximo |
|---|---|---|
| Fase de Grupos | 144 partidos × 5 pts | 720 pts |
| Eliminatorias | ~32 partidos × 7 pts | 224 pts |
| Bonos Especiales | 25+20+10+5+15+10 | 85 pts |
| **TOTAL MÁXIMO** | | **1,029 pts** |

---

## 5. Requerimientos Funcionales

### RF1: Sistema de Autenticación

| ID | Requisito | Prioridad |
|---|---|---|
| RF1.1 | Registro con email y contraseña vía Supabase Auth | Alta |
| RF1.2 | Login con email/contraseña | Alta |
| RF1.3 | Login social (Google, opcionalmente GitHub) | Media |
| RF1.4 | Recuperación de contraseña por email | Alta |
| RF1.5 | Perfil de usuario (nombre, avatar, país favorito) | Media |
| RF1.6 | Sesión persistente con JWT (refresh token) | Alta |

### RF2: Pronósticos de Fase de Grupos

| ID | Requisito | Prioridad |
|---|---|---|
| RF2.1 | Visualización de los 12 grupos (A–L) con equipos y banderas | Alta |
| RF2.2 | Formulario dinámico para pronosticar cada partido (goles local/visitante) | Alta |
| RF2.3 | Guardado automático (auto-save) con debounce de 2 segundos | Media |
| RF2.4 | Indicador visual de progreso (partidos pronosticados / total) | Media |
| RF2.5 | Edición libre de pronósticos antes del bloqueo | Alta |
| RF2.6 | Vista previa/resumen de todos los pronósticos del usuario | Media |

### RF3: Desbloqueo Progresivo de Fases

> **IMPORTANTE:** Las fases se desbloquean automáticamente según el avance del torneo. El usuario NO puede ver ni pronosticar fases futuras hasta que se activen.

| ID | Requisito | Prioridad |
|---|---|---|
| RF3.1 | **Fase de Grupos**: disponible desde el registro hasta el inicio del primer partido | Alta |
| RF3.2 | **Ronda de 32**: se desbloquea al finalizar la fase de grupos (los clasificados se cargan automáticamente) | Alta |
| RF3.3 | **Octavos de Final**: se desbloquea al conocerse los cruces | Alta |
| RF3.4 | **Cuartos de Final**: se desbloquea tras los octavos | Alta |
| RF3.5 | **Semifinales**: se desbloquea tras los cuartos | Alta |
| RF3.6 | **Final / 3er puesto**: se desbloquea tras las semifinales | Alta |
| RF3.7 | Cada fase tiene su propio deadline de cierre (kickoff del primer partido de esa fase) | Alta |

### RF4: Predicciones Especiales (Bonos)

| ID | Requisito | Prioridad |
|---|---|---|
| RF4.1 | Selector de Campeón/Subcampeón/3ero/4to con dropdown de las 48 selecciones | Alta |
| RF4.2 | Selector de Goleador con autocompletado de nombres de jugadores | Alta |
| RF4.3 | Selector de Líder en Asistencias con autocompletado | Alta |
| RF4.4 | Estas predicciones se bloquean al iniciar el primer partido del mundial | Alta |

### RF5: Regla de Cierre "Hard Lock"

| ID | Requisito | Prioridad |
|---|---|---|
| RF5.1 | **Lock por Fase**: cada fase se bloquea al kickoff de su primer partido | Alta |
| RF5.2 | **Lock Especiales**: predicciones de torneo se bloquean al inicio del mundial | Alta |
| RF5.3 | Validación en Frontend: UI deshabilitada con overlay visual + countdown | Alta |
| RF5.4 | Validación en Backend: endpoint retorna `403 Forbidden` post-cierre | Alta |
| RF5.5 | Countdown timer visible mostrando tiempo restante para cada fase | Media |

### RF6: Cálculo de Puntos y Leaderboard

| ID | Requisito | Prioridad |
|---|---|---|
| RF6.1 | Panel de administración (Django Admin) para cargar resultados reales | Alta |
| RF6.2 | Cálculo automático de puntos al cargar un resultado (signal/trigger) | Alta |
| RF6.3 | Alternativa: sincronización automática de resultados vía API externa | Media |
| RF6.4 | **Leaderboard global** con ranking en tiempo real | Alta |
| RF6.5 | Filtros en leaderboard: por fase, por grupo de amigos | Media |
| RF6.6 | Historial de puntos del usuario (desglose por partido) | Media |

### RF7: Dashboard Personal del Usuario

| ID | Requisito | Prioridad |
|---|---|---|
| RF7.1 | Resumen de puntos totales con animación de contador | Media |
| RF7.2 | Posición en el ranking global | Alta |
| RF7.3 | Gráfica de evolución de puntos a lo largo del torneo | Baja |
| RF7.4 | Pronósticos vs. resultados reales (comparativa visual) | Media |

---

## 6. Requerimientos No Funcionales

### RNF1: Rendimiento
- Tiempo de carga inicial < 3 segundos
- API response time < 500ms para endpoints principales
- Soporte para 500+ usuarios concurrentes

### RNF2: Seguridad
- Autenticación vía Supabase Auth con JWT
- Row Level Security (RLS) en Supabase para aislar datos por usuario
- CSRF protection en Django
- Rate limiting en endpoints de pronósticos
- HTTPS obligatorio en producción

### RNF3: Responsividad
- Mobile-first design
- Breakpoints: 320px / 768px / 1024px / 1440px
- Touch-friendly: botones mínimo 44px

### RNF4: Accesibilidad
- WCAG 2.1 nivel AA
- Contraste mínimo 4.5:1
- Navegación por teclado completa
- Labels en todos los inputs

---

## 7. Diseño UI/UX — Identidad Visual

### 7.1 Filosofía de Diseño

> **"La emoción del mundial, la elegancia de una app premium"**

La interfaz debe evocar la energía y pasión del fútbol mundial combinada con una estética digital de alto nivel. Cada interacción debe sentirse fluida, cada transición debe ser cinematográfica.

### 7.2 Paleta de Colores

```css
:root {
  /* === Colores Principales === */
  --color-primary: #1a1a2e;        /* Azul oscuro profundo (fondo principal) */
  --color-secondary: #16213e;      /* Azul noche */
  --color-accent: #e94560;         /* Rojo vibrante (acentos, CTAs) */
  --color-accent-gold: #f5a623;    /* Dorado (trofeo, logros) */
  
  /* === Gradientes === */
  --gradient-hero: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  --gradient-card: linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
  --gradient-accent: linear-gradient(135deg, #e94560, #c62a71);
  --gradient-gold: linear-gradient(135deg, #f5a623, #f7d774);
  
  /* === Glassmorphism === */
  --glass-bg: rgba(255, 255, 255, 0.06);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-blur: blur(20px);
  
  /* === Texto === */
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-muted: rgba(255, 255, 255, 0.4);
  
  /* === Estados === */
  --color-success: #00c853;
  --color-warning: #ffab00;
  --color-error: #ff1744;
  --color-info: #2979ff;
}
```

### 7.3 Tipografía

```css
/* Títulos principales — impactantes */
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

/* Cuerpo de texto — legible */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --font-display: 'Outfit', sans-serif;
  --font-body: 'Inter', sans-serif;
}
```

### 7.4 Componentes de Diseño Clave

#### 🃏 Tarjetas de Grupo (Group Cards)
- Glassmorphism con blur de 20px
- Bordes sutiles con `rgba(255,255,255,0.1)`
- Hover: elevación con `transform: translateY(-8px)` + sombra neon sutil
- Banderas de equipos con efecto de ondeo (CSS animation)
- Indicador de estado del grupo: 🔓 Abierto | 🔒 Cerrado | ✅ Completado

#### ⚽ Tarjeta de Partido (Match Card)
- Layout: `[Bandera] Equipo Local [__] - [__] Equipo Visitante [Bandera]`
- Inputs numéricos estilizados con efecto glow al enfocar
- Micro-animación al guardar pronóstico (check verde con scale animation)
- Estado post-lock: overlay semitransparente con ícono de candado
- Resultado real (cuando disponible): badge dorado comparativo

#### 📊 Leaderboard
- Tabla con filas que tienen hover con gradient sutil
- Top 3 con badges especiales (🥇🥈🥉) y efecto shimmer dorado
- Posición del usuario actual siempre visible (sticky row si está fuera del viewport)
- Animación de cambio de posición (flip animation)

#### 🏆 Sección de Predicciones Especiales
- Cards grandes con efecto parallax
- Dropdown con búsqueda integrada y banderas/fotos de jugadores
- Visual de "sobre sellado" que se abre con animación al revelar resultados

### 7.5 Animaciones y Micro-interacciones

```
1. Page Transitions     → Framer Motion: fade + slide (300ms ease-out)
2. Card Hover           → translateY(-8px) + box-shadow glow (200ms)
3. Score Input Focus    → Border glow + scale(1.05) (150ms)
4. Save Confirmation    → Checkmark animation (Lottie) (500ms)
5. Lock Activation      → Candado que gira + overlay que baja (600ms)
6. Leaderboard Update   → Filas que se reordenan con flip animation (400ms)
7. Phase Unlock         → Efecto "reveal" con partículas (800ms)
8. Countdown Timer      → Números que hacen flip como reloj de aeropuerto
9. Loading States       → Skeleton screens con shimmer gradient
10. Scroll Animations   → Elementos que entran con stagger (intersection observer)
```

### 7.6 Wireframes de Páginas Principales

#### Landing Page (No autenticado)
```
┌──────────────────────────────────────────────┐
│  🏆 LOGO         [Login] [Registro]          │
├──────────────────────────────────────────────┤
│                                              │
│    ⚽ QUINIELA MUNDIAL 2026                  │
│    "Predice. Compite. Gana."                 │
│                                              │
│    [  ÚNETE AHORA  ]  ← CTA con glow        │
│                                              │
│    🕐 Countdown al primer partido            │
│                                              │
├──────────────────────────────────────────────┤
│  📋 ¿Cómo funciona?  │  🏆 Premios          │
│  1. Regístrate        │  🥇 1er lugar        │
│  2. Haz tus picks     │  🥈 2do lugar        │
│  3. Gana puntos       │  🥉 3er lugar        │
├──────────────────────────────────────────────┤
│  Footer: Links | Redes | © 2026              │
└──────────────────────────────────────────────┘
```

#### Dashboard (Autenticado)
```
┌──────────────────────────────────────────────┐
│  🏆 LOGO   [Grupos][Ranking][Perfil] [🔔]   │
├──────────────────────────────────────────────┤
│                                              │
│  👋 ¡Bienvenido, {nombre}!                   │
│                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │ 📊 Pts  │ │ 🏅 Rank │ │ ✅ Done │        │
│  │  145    │ │  #12    │ │  36/48  │        │
│  └─────────┘ └─────────┘ └─────────┘        │
│                                              │
│  ── Fases del Torneo ──                      │
│  [🔓 Grupos] [🔒 R32] [🔒 8vos] [🔒 4tos]  │
│  [🔒 Semis] [🔒 Final]                      │
│                                              │
│  ── Próximos partidos por cerrar ──          │
│  ⚠️ 3 partidos sin pronóstico               │
│                                              │
│  ── Leaderboard Quick View ──               │
│  1. @user1  320pts                           │
│  2. @user2  315pts                           │
│  ...                                         │
│  12. @tú    145pts  ← highlighted            │
│                                              │
└──────────────────────────────────────────────┘
```

#### Vista de Grupos
```
┌──────────────────────────────────────────────┐
│  FASE DE GRUPOS — 144 partidos               │
│  Progreso: ████████░░ 36/48 pronósticos      │
├──────────────────────────────────────────────┤
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ GRUPO A  │ │ GRUPO B  │ │ GRUPO C  │     │
│  │ 🇲🇽🇿🇦🇨🇦🇦🇷│ │ 🇫🇷🇩🇪🇧🇷🇯🇵│ │ ...      │     │
│  │ 6/6 ✅   │ │ 4/6 ⚠️   │ │ 0/6 ❌   │     │
│  └──────────┘ └──────────┘ └──────────┘     │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ GRUPO D  │ │ GRUPO E  │ │ GRUPO F  │     │
│  │ ...      │ │ ...      │ │ ...      │     │
│  └──────────┘ └──────────┘ └──────────┘     │
│                                              │
│  ... (hasta GRUPO L)                         │
│                                              │
└──────────────────────────────────────────────┘
```

#### Detalle de Grupo (al hacer click)
```
┌──────────────────────────────────────────────┐
│  ← Volver    GRUPO A    🔓 Abierto          │
│              Cierre: 2d 14h 32m              │
├──────────────────────────────────────────────┤
│                                              │
│  JORNADA 1                                   │
│  ┌────────────────────────────────────────┐  │
│  │ 🇲🇽 México    [2] - [1]  Sudáfrica 🇿🇦 │  │
│  │              📅 Jun 11, 18:00          │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │ 🇨🇦 Canadá    [_] - [_]  Argentina 🇦🇷 │  │
│  │              📅 Jun 12, 15:00          │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  JORNADA 2                                   │
│  ...                                         │
│                                              │
│  JORNADA 3                                   │
│  ...                                         │
│                                              │
│  [💾 GUARDAR PRONÓSTICOS]                    │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 8. Modelos de Datos

### 8.1 Diagrama Entidad-Relación

```mermaid
erDiagram
    USER ||--o{ PRONOSTICO_PARTIDO : "realiza"
    USER ||--o| PRONOSTICO_TORNEO : "tiene"
    USER {
        uuid id PK
        string email
        string username
        string avatar_url
        string pais_favorito
        int puntos_totales
        datetime created_at
    }

    EQUIPO ||--o{ GRUPO_EQUIPO : "pertenece"
    EQUIPO ||--o{ JUGADOR : "tiene"
    EQUIPO {
        int id PK
        string nombre
        string nombre_corto
        string codigo_iso
        string bandera_url
        string confederacion
        int ranking_fifa
    }

    GRUPO ||--o{ GRUPO_EQUIPO : "contiene"
    GRUPO ||--o{ PARTIDO : "alberga"
    GRUPO {
        int id PK
        string letra
        string nombre
    }

    GRUPO_EQUIPO {
        int id PK
        int grupo_id FK
        int equipo_id FK
        int posicion
    }

    FASE {
        int id PK
        string nombre
        string slug
        int orden
        datetime fecha_apertura
        datetime fecha_cierre
        boolean activa
        boolean bloqueada
    }

    PARTIDO ||--o{ PRONOSTICO_PARTIDO : "tiene"
    PARTIDO {
        int id PK
        int grupo_id FK
        int fase_id FK
        int equipo_local_id FK
        int equipo_visitante_id FK
        int jornada
        datetime fecha_hora
        int goles_local
        int goles_visitante
        string estado
        boolean resultado_cargado
    }

    PRONOSTICO_PARTIDO {
        int id PK
        uuid usuario_id FK
        int partido_id FK
        int goles_local_pred
        int goles_visitante_pred
        int puntos_ganados
        datetime created_at
        datetime updated_at
    }

    PRONOSTICO_TORNEO {
        int id PK
        uuid usuario_id FK
        int campeon_id FK
        int subcampeon_id FK
        int tercer_lugar_id FK
        int cuarto_lugar_id FK
        int goleador_id FK
        int asistente_id FK
        int puntos_especiales
        datetime created_at
        datetime updated_at
    }

    JUGADOR {
        int id PK
        int equipo_id FK
        string nombre
        string posicion
        string foto_url
        int goles
        int asistencias
    }
```

### 8.2 Modelos Django (Detalle)

```python
# core/models.py

class Equipo(models.Model):
    nombre = models.CharField(max_length=100)
    nombre_corto = models.CharField(max_length=3)  # "MEX", "ARG"
    codigo_iso = models.CharField(max_length=2)     # "MX", "AR"
    bandera_url = models.URLField(blank=True)
    confederacion = models.CharField(max_length=20)  # "CONCACAF", "UEFA"
    ranking_fifa = models.IntegerField(default=0)

class Grupo(models.Model):
    letra = models.CharField(max_length=1, unique=True)  # A-L
    equipos = models.ManyToManyField(Equipo, through='GrupoEquipo')

class Fase(models.Model):
    FASES = [
        ('grupos', 'Fase de Grupos'),
        ('ronda32', 'Ronda de 32'),
        ('octavos', 'Octavos de Final'),
        ('cuartos', 'Cuartos de Final'),
        ('semifinales', 'Semifinales'),
        ('tercer_puesto', 'Tercer Puesto'),
        ('final', 'Final'),
    ]
    nombre = models.CharField(max_length=50)
    slug = models.SlugField(unique=True)
    orden = models.IntegerField()
    fecha_apertura = models.DateTimeField(null=True)
    fecha_cierre = models.DateTimeField(null=True)  # kickoff primer partido
    activa = models.BooleanField(default=False)
    bloqueada = models.BooleanField(default=False)

    def esta_abierta(self):
        now = timezone.now()
        return self.activa and not self.bloqueada and now < self.fecha_cierre

class Partido(models.Model):
    ESTADOS = [
        ('programado', 'Programado'),
        ('en_curso', 'En Curso'),
        ('finalizado', 'Finalizado'),
        ('suspendido', 'Suspendido'),
    ]
    grupo = models.ForeignKey(Grupo, on_delete=models.SET_NULL, null=True, blank=True)
    fase = models.ForeignKey(Fase, on_delete=models.CASCADE)
    equipo_local = models.ForeignKey(Equipo, related_name='partidos_local', on_delete=models.CASCADE)
    equipo_visitante = models.ForeignKey(Equipo, related_name='partidos_visitante', on_delete=models.CASCADE)
    jornada = models.IntegerField(default=1)
    fecha_hora = models.DateTimeField()
    goles_local = models.IntegerField(null=True, blank=True)
    goles_visitante = models.IntegerField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='programado')
    resultado_cargado = models.BooleanField(default=False)

class PronosticoPartido(models.Model):
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    partido = models.ForeignKey(Partido, on_delete=models.CASCADE)
    goles_local_pred = models.IntegerField()
    goles_visitante_pred = models.IntegerField()
    puntos_ganados = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('usuario', 'partido')

class PronosticoTorneo(models.Model):
    usuario = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    campeon = models.ForeignKey(Equipo, related_name='+', null=True, on_delete=models.SET_NULL)
    subcampeon = models.ForeignKey(Equipo, related_name='+', null=True, on_delete=models.SET_NULL)
    tercer_lugar = models.ForeignKey(Equipo, related_name='+', null=True, on_delete=models.SET_NULL)
    cuarto_lugar = models.ForeignKey(Equipo, related_name='+', null=True, on_delete=models.SET_NULL)
    goleador = models.ForeignKey('Jugador', related_name='+', null=True, on_delete=models.SET_NULL)
    asistente = models.ForeignKey('Jugador', related_name='+', null=True, on_delete=models.SET_NULL)
    puntos_especiales = models.IntegerField(default=0)

class Jugador(models.Model):
    equipo = models.ForeignKey(Equipo, on_delete=models.CASCADE)
    nombre = models.CharField(max_length=200)
    posicion = models.CharField(max_length=30)
    foto_url = models.URLField(blank=True)
    goles = models.IntegerField(default=0)
    asistencias = models.IntegerField(default=0)
```

---

## 9. API Endpoints (Django REST Framework)

### 9.1 Autenticación

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/auth/register/` | Registro de usuario |
| `POST` | `/api/auth/login/` | Inicio de sesión |
| `POST` | `/api/auth/logout/` | Cerrar sesión |
| `POST` | `/api/auth/refresh/` | Refrescar JWT |
| `GET` | `/api/auth/me/` | Perfil del usuario actual |
| `PUT` | `/api/auth/me/` | Actualizar perfil |

### 9.2 Torneo

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/equipos/` | Lista de las 48 selecciones |
| `GET` | `/api/grupos/` | Los 12 grupos con equipos |
| `GET` | `/api/grupos/{letra}/` | Detalle de un grupo |
| `GET` | `/api/fases/` | Estado de todas las fases |
| `GET` | `/api/fases/{slug}/` | Detalle de fase con partidos |
| `GET` | `/api/partidos/` | Todos los partidos (filtrable por fase, grupo, fecha) |
| `GET` | `/api/partidos/{id}/` | Detalle de un partido |
| `GET` | `/api/jugadores/` | Lista de jugadores (filtrable por equipo) |

### 9.3 Pronósticos

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/pronosticos/partidos/` | Pronósticos del usuario autenticado |
| `POST` | `/api/pronosticos/partidos/` | Crear/actualizar pronóstico de partido |
| `POST` | `/api/pronosticos/partidos/bulk/` | Crear/actualizar múltiples pronósticos |
| `GET` | `/api/pronosticos/torneo/` | Predicciones especiales del usuario |
| `POST` | `/api/pronosticos/torneo/` | Crear/actualizar predicciones especiales |
| `GET` | `/api/pronosticos/resumen/` | Resumen de puntos del usuario |

### 9.4 Leaderboard

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/leaderboard/` | Ranking global (paginado) |
| `GET` | `/api/leaderboard/top/{n}/` | Top N jugadores |
| `GET` | `/api/leaderboard/mi-posicion/` | Posición del usuario actual |

### 9.5 Admin

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/admin/resultados/{partido_id}/` | Cargar resultado real |
| `POST` | `/api/admin/calcular-puntos/` | Trigger de cálculo masivo |
| `POST` | `/api/admin/sync-api/` | Sincronizar datos desde API externa |
| `POST` | `/api/admin/activar-fase/{slug}/` | Activar/desbloquear fase |

---

## 10. Estructura del Proyecto

```
quiniela-mundial-2026/
│
├── backend/                          # Django Project
│   ├── manage.py
│   ├── requirements.txt
│   ├── config/                       # Django Settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── core/                         # App principal
│   │   ├── models.py                 # Modelos de datos
│   │   ├── serializers.py            # DRF Serializers
│   │   ├── views.py                  # API Views
│   │   ├── urls.py                   # URL routing
│   │   ├── permissions.py            # Custom permissions (lock logic)
│   │   ├── signals.py                # Auto-cálculo de puntos
│   │   ├── utils.py                  # Lógica de puntuación
│   │   └── admin.py                  # Django Admin customizado
│   ├── users/                        # App de usuarios
│   │   ├── models.py                 # Perfil extendido
│   │   ├── serializers.py
│   │   └── views.py
│   ├── sync/                         # App de sincronización
│   │   ├── management/
│   │   │   └── commands/
│   │   │       └── sync_worldcup_data.py
│   │   ├── services.py               # Lógica de consumo de API
│   │   └── tasks.py                  # Celery tasks
│   └── fixtures/                     # Datos estáticos fallback
│       ├── worldcup2026_groups.json
│       ├── worldcup2026_schedule.json
│       └── worldcup2026_teams.json
│
├── frontend/                         # React Project (Vite)
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── public/
│   │   ├── favicon.ico
│   │   └── flags/                    # Banderas SVG
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css                 # Design system global
│   │   ├── api/
│   │   │   ├── client.js             # Axios instance
│   │   │   ├── auth.js               # Auth endpoints
│   │   │   ├── matches.js            # Partidos endpoints
│   │   │   └── predictions.js        # Pronósticos endpoints
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   └── Layout.jsx
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   ├── RegisterForm.jsx
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── groups/
│   │   │   │   ├── GroupCard.jsx
│   │   │   │   ├── GroupGrid.jsx
│   │   │   │   └── GroupDetail.jsx
│   │   │   ├── matches/
│   │   │   │   ├── MatchCard.jsx
│   │   │   │   ├── MatchList.jsx
│   │   │   │   └── ScoreInput.jsx
│   │   │   ├── predictions/
│   │   │   │   ├── PredictionForm.jsx
│   │   │   │   ├── SpecialPredictions.jsx
│   │   │   │   └── PredictionSummary.jsx
│   │   │   ├── leaderboard/
│   │   │   │   ├── LeaderboardTable.jsx
│   │   │   │   └── LeaderboardRow.jsx
│   │   │   └── ui/
│   │   │       ├── CountdownTimer.jsx
│   │   │       ├── ProgressBar.jsx
│   │   │       ├── SkeletonLoader.jsx
│   │   │       ├── GlassCard.jsx
│   │   │       └── AnimatedNumber.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Groups.jsx
│   │   │   ├── GroupDetail.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useCountdown.js
│   │   │   └── usePredictions.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   └── utils/
│   │       ├── constants.js
│   │       └── formatters.js
│   └── styles/
│       ├── variables.css
│       ├── animations.css
│       ├── components.css
│       └── pages.css
│
├── PRD.md                            # Este documento
├── README.md
├── docker-compose.yml                # Desarrollo local
└── .env.example                      # Variables de entorno
```

---

## 11. Flujo del Usuario (User Journey)

### 11.1 Primer Uso

```mermaid
graph TD
    A[Landing Page] --> B{¿Tiene cuenta?}
    B -->|No| C[Registro]
    C --> D[Verificar email]
    D --> E[Dashboard]
    B -->|Sí| F[Login]
    F --> E
    E --> G[Ver Grupos]
    G --> H[Seleccionar Grupo]
    H --> I[Cargar Pronósticos]
    I --> J{¿Completó todos?}
    J -->|No| G
    J -->|Sí| K[Predicciones Especiales]
    K --> L[Dashboard completo]
    L --> M[Esperar inicio del torneo]
```

### 11.2 Durante el Torneo

```mermaid
graph TD
    A[Dashboard] --> B[Ver Leaderboard]
    A --> C[Ver Resultados vs Pronósticos]
    A --> D{¿Nueva fase desbloqueada?}
    D -->|Sí| E[Notificación]
    E --> F[Cargar Pronósticos Nueva Fase]
    F --> A
    D -->|No| G[Seguir esperando]
    A --> H[Ver Evolución de Puntos]
```

---

## 12. Roadmap de Desarrollo

### Fase 1: Fundación (Semana 1-2)
- [ ] Configuración del proyecto Django + React (Vite)
- [ ] Conexión Django ↔ Supabase (PostgreSQL)
- [ ] Configuración de Supabase Auth
- [ ] Modelos de datos + migraciones
- [ ] Design system CSS (variables, tipografía, colores)
- [ ] Layout base (Navbar, Footer, rutas)

### Fase 2: Datos del Mundial (Semana 2-3)
- [ ] Integración con API deportiva (football-data.org o similar)
- [ ] Management command para sincronizar equipos, grupos y fixtures
- [ ] Datos fallback en JSON estático
- [ ] API endpoints para equipos, grupos y partidos
- [ ] Vista de grupos con tarjetas glassmorphism

### Fase 3: Autenticación y Pronósticos (Semana 3-4)
- [ ] Flujo completo de registro/login con Supabase Auth
- [ ] Protected routes en React
- [ ] Formulario de pronósticos por grupo
- [ ] Auto-save con debounce
- [ ] Predicciones especiales (campeón, goleador, etc.)
- [ ] Lógica de Hard Lock (frontend + backend)

### Fase 4: Puntuación y Leaderboard (Semana 4-5)
- [ ] Panel admin para cargar resultados
- [ ] Algoritmo de cálculo de puntos (signals/triggers)
- [ ] Leaderboard global con rankings
- [ ] Dashboard personal con resumen de puntos
- [ ] Comparativa pronóstico vs resultado real

### Fase 5: Desbloqueo Progresivo (Semana 5-6)
- [ ] Lógica de activación de fases por fecha
- [ ] UI de fases bloqueadas/desbloqueadas
- [ ] Pronósticos de fases eliminatorias
- [ ] Countdown timers por fase
- [ ] Notificaciones de nueva fase disponible

### Fase 6: Pulido y Lanzamiento (Semana 6-7)
- [ ] Animaciones completas (Framer Motion)
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Performance optimization (lazy loading, code splitting)
- [ ] SEO (meta tags, Open Graph)
- [ ] Testing E2E
- [ ] Deploy a producción

---

## 13. Variables de Entorno

```env
# === Backend (Django) ===
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# === Supabase ===
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# === API Deportiva ===
FOOTBALL_API_KEY=your-api-key
FOOTBALL_API_BASE_URL=https://api.football-data.org/v4

# === Frontend (React) ===
VITE_API_BASE_URL=http://localhost:8000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# === Celery (opcional) ===
CELERY_BROKER_URL=redis://localhost:6379/0
```

---

## 14. Plan de Verificación

### 14.1 Tests Automatizados
- **Backend**: pytest + Django test client para cada endpoint
- **Frontend**: Vitest + React Testing Library para componentes
- **E2E**: Playwright para flujos completos (registro → pronóstico → leaderboard)

### 14.2 Verificación Manual
- Flujo completo de usuario en mobile y desktop
- Validación de bloqueo de pronósticos post-deadline
- Cálculo correcto de puntos para todos los escenarios
- Rendimiento bajo carga simulada

### 14.3 Criterios de Aceptación
- [ ] Usuario puede registrarse e iniciar sesión
- [ ] Se muestran los 12 grupos con equipos y banderas
- [ ] Usuario puede pronosticar los 144 partidos de fase de grupos
- [ ] Pronósticos se bloquean al iniciar el primer partido
- [ ] Los puntos se calculan correctamente
- [ ] El leaderboard muestra posiciones en tiempo real
- [ ] Las fases se desbloquean progresivamente
- [ ] La app es responsive y funcional en mobile
- [ ] Las animaciones son fluidas (60fps)

---

> **NOTA:** Este PRD es un documento vivo que se actualizará conforme avance el desarrollo. Las prioridades y alcance pueden ajustarse según feedback del equipo y restricciones de tiempo antes del inicio del Mundial (11 de junio de 2026).
