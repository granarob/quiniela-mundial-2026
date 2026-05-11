"""
Modelos principales de Quiniela Mundial 2026
Basado en el PRD §8.2
"""
from django.db import models
from django.conf import settings
from django.utils import timezone


class Equipo(models.Model):
    """48 selecciones del Mundial 2026."""
    CONFEDERACIONES = [
        ('UEFA', 'UEFA - Europa'),
        ('CONMEBOL', 'CONMEBOL - Sudamérica'),
        ('CONCACAF', 'CONCACAF - Norte/Centro América y Caribe'),
        ('CAF', 'CAF - África'),
        ('AFC', 'AFC - Asia'),
        ('OFC', 'OFC - Oceanía'),
    ]

    nombre = models.CharField(max_length=100)
    nombre_corto = models.CharField(max_length=3)    # MEX, ARG, BRA
    codigo_iso = models.CharField(max_length=2)       # MX, AR, BR
    bandera_url = models.URLField(blank=True, default='')
    confederacion = models.CharField(max_length=20, choices=CONFEDERACIONES)
    ranking_fifa = models.IntegerField(default=0)
    # Para la API externa
    api_id = models.IntegerField(null=True, blank=True, unique=True)

    class Meta:
        ordering = ['ranking_fifa']
        verbose_name = 'Equipo'
        verbose_name_plural = 'Equipos'

    def __str__(self):
        return f"{self.nombre} ({self.nombre_corto})"

    @property
    def bandera_emoji(self):
        """Devuelve el emoji de bandera según código ISO."""
        if not self.codigo_iso:
            return '🏳️'
        return ''.join(chr(127397 + ord(c)) for c in self.codigo_iso.upper())


class Grupo(models.Model):
    """12 grupos del Mundial (A-L)."""
    LETRAS = [(l, f'Grupo {l}') for l in 'ABCDEFGHIJKL']

    letra = models.CharField(max_length=1, unique=True, choices=LETRAS)
    equipos = models.ManyToManyField(Equipo, through='GrupoEquipo', related_name='grupos')

    class Meta:
        ordering = ['letra']
        verbose_name = 'Grupo'
        verbose_name_plural = 'Grupos'

    def __str__(self):
        return f"Grupo {self.letra}"


class GrupoEquipo(models.Model):
    """Tabla intermedia Grupo-Equipo con posición."""
    grupo = models.ForeignKey(Grupo, on_delete=models.CASCADE)
    equipo = models.ForeignKey(Equipo, on_delete=models.CASCADE)
    posicion = models.IntegerField(default=0)  # Posición dentro del grupo (1-4)

    class Meta:
        unique_together = ('grupo', 'equipo')
        ordering = ['posicion']

    def __str__(self):
        return f"{self.grupo} — {self.equipo}"


class Fase(models.Model):
    """Fases del torneo con control de apertura/cierre."""
    SLUGS = [
        ('grupos', 'Fase de Grupos'),
        ('ronda32', 'Ronda de 32'),
        ('octavos', 'Octavos de Final'),
        ('cuartos', 'Cuartos de Final'),
        ('semifinales', 'Semifinales'),
        ('tercer_puesto', 'Tercer Puesto'),
        ('final', 'Final'),
    ]

    nombre = models.CharField(max_length=50)
    slug = models.SlugField(unique=True, choices=SLUGS)
    orden = models.IntegerField()
    fecha_apertura = models.DateTimeField(null=True, blank=True)
    fecha_cierre = models.DateTimeField(null=True, blank=True)   # Kickoff primer partido
    activa = models.BooleanField(default=False)
    bloqueada = models.BooleanField(default=False)

    class Meta:
        ordering = ['orden']
        verbose_name = 'Fase'
        verbose_name_plural = 'Fases'

    def __str__(self):
        return self.nombre

    def esta_abierta(self):
        """True si la fase acepta pronósticos."""
        if not self.activa or self.bloqueada:
            return False
        if self.fecha_cierre and timezone.now() >= self.fecha_cierre:
            return False
        return True

    def tiempo_restante(self):
        """Segundos restantes antes del cierre (Hard Lock)."""
        if not self.fecha_cierre:
            return None
        delta = self.fecha_cierre - timezone.now()
        return max(0, int(delta.total_seconds()))


class Partido(models.Model):
    """Fixture completo del torneo."""
    ESTADOS = [
        ('programado', 'Programado'),
        ('en_curso', 'En Curso'),
        ('finalizado', 'Finalizado'),
        ('suspendido', 'Suspendido'),
    ]

    grupo = models.ForeignKey(
        Grupo, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='partidos'
    )
    fase = models.ForeignKey(Fase, on_delete=models.CASCADE, related_name='partidos')
    equipo_local = models.ForeignKey(
        Equipo, related_name='partidos_local', on_delete=models.CASCADE
    )
    equipo_visitante = models.ForeignKey(
        Equipo, related_name='partidos_visitante', on_delete=models.CASCADE
    )
    jornada = models.IntegerField(default=1)
    fecha_hora = models.DateTimeField()
    sede = models.CharField(max_length=100, blank=True, default='')
    ciudad = models.CharField(max_length=100, blank=True, default='')

    # Resultado real
    goles_local = models.IntegerField(null=True, blank=True)
    goles_visitante = models.IntegerField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='programado')
    resultado_cargado = models.BooleanField(default=False)

    # Para la API externa
    api_id = models.IntegerField(null=True, blank=True, unique=True)

    class Meta:
        ordering = ['fecha_hora']
        verbose_name = 'Partido'
        verbose_name_plural = 'Partidos'

    def __str__(self):
        return f"{self.equipo_local} vs {self.equipo_visitante} — {self.fecha_hora.strftime('%d/%m/%Y %H:%M')}"

    @property
    def resultado_display(self):
        if self.resultado_cargado:
            return f"{self.goles_local} - {self.goles_visitante}"
        return "- : -"


class Jugador(models.Model):
    """Planteles de los 48 equipos (para predicciones de goleador/asistente)."""
    POSICIONES = [
        ('POR', 'Portero'),
        ('DEF', 'Defensa'),
        ('MED', 'Mediocampista'),
        ('DEL', 'Delantero'),
    ]

    equipo = models.ForeignKey(Equipo, on_delete=models.CASCADE, related_name='jugadores')
    nombre = models.CharField(max_length=200)
    posicion = models.CharField(max_length=3, choices=POSICIONES, blank=True)
    foto_url = models.URLField(blank=True, default='')
    numero_camiseta = models.IntegerField(null=True, blank=True)
    # Estadísticas durante el torneo
    goles = models.IntegerField(default=0)
    asistencias = models.IntegerField(default=0)
    # Para la API externa
    api_id = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ['equipo', 'posicion', 'nombre']
        verbose_name = 'Jugador'
        verbose_name_plural = 'Jugadores'

    def __str__(self):
        return f"{self.nombre} ({self.equipo.nombre_corto})"


class Quiniela(models.Model):
    """Representa una quiniela específica de un usuario."""
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='quinielas'
    )
    nombre = models.CharField(max_length=100)
    puntos_totales = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Quiniela'
        verbose_name_plural = 'Quinielas'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.nombre} (@{self.usuario.username})"


class PronosticoPartido(models.Model):
    """Pronóstico de un usuario para un partido específico dentro de una quiniela."""
    quiniela = models.ForeignKey(
        Quiniela,
        on_delete=models.CASCADE,
        related_name='pronosticos_partido',
        null=True, blank=True
    )
    partido = models.ForeignKey(
        Partido,
        on_delete=models.CASCADE,
        related_name='pronosticos'
    )
    goles_local_pred = models.IntegerField()
    goles_visitante_pred = models.IntegerField()
    puntos_ganados = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('quiniela', 'partido')
        verbose_name = 'Pronóstico de Partido'
        verbose_name_plural = 'Pronósticos de Partidos'

    def __str__(self):
        return f"{self.quiniela.nombre} → {self.partido} | {self.goles_local_pred}-{self.goles_visitante_pred}"


class PronosticoTorneo(models.Model):
    """Predicciones especiales del torneo (bonos) para una quiniela."""
    quiniela = models.OneToOneField(
        Quiniela,
        on_delete=models.CASCADE,
        related_name='pronostico_torneo',
        null=True, blank=True
    )
    campeon = models.ForeignKey(
        Equipo, related_name='pronosticos_campeon',
        null=True, blank=True, on_delete=models.SET_NULL
    )
    subcampeon = models.ForeignKey(
        Equipo, related_name='pronosticos_subcampeon',
        null=True, blank=True, on_delete=models.SET_NULL
    )
    tercer_lugar = models.ForeignKey(
        Equipo, related_name='pronosticos_tercer',
        null=True, blank=True, on_delete=models.SET_NULL
    )
    cuarto_lugar = models.ForeignKey(
        Equipo, related_name='pronosticos_cuarto',
        null=True, blank=True, on_delete=models.SET_NULL
    )
    goleador = models.ForeignKey(
        Jugador, related_name='pronosticos_goleador',
        null=True, blank=True, on_delete=models.SET_NULL
    )
    goleador_nombre = models.CharField(max_length=200, blank=True, default='')
    asistente = models.ForeignKey(
        Jugador, related_name='pronosticos_asistente',
        null=True, blank=True, on_delete=models.SET_NULL
    )
    asistente_nombre = models.CharField(max_length=200, blank=True, default='')
    puntos_especiales = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Pronóstico de Torneo'
        verbose_name_plural = 'Pronósticos de Torneo'

    def __str__(self):
        return f"Torneo → {self.quiniela.nombre}"
