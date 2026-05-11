from django.contrib import admin
from .models import (
    Equipo, Grupo, GrupoEquipo, Fase, Partido,
    Jugador, Quiniela, PronosticoPartido, PronosticoTorneo
)


@admin.register(Equipo)
class EquipoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'nombre_corto', 'codigo_iso', 'confederacion', 'ranking_fifa']
    list_filter = ['confederacion']
    search_fields = ['nombre', 'nombre_corto', 'codigo_iso']
    ordering = ['ranking_fifa']


class GrupoEquipoInline(admin.TabularInline):
    model = GrupoEquipo
    extra = 4


@admin.register(Grupo)
class GrupoAdmin(admin.ModelAdmin):
    list_display = ['letra']
    inlines = [GrupoEquipoInline]


@admin.register(Fase)
class FaseAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'slug', 'orden', 'activa', 'bloqueada', 'fecha_cierre']
    list_editable = ['activa', 'bloqueada']
    ordering = ['orden']


@admin.register(Partido)
class PartidoAdmin(admin.ModelAdmin):
    list_display = [
        'equipo_local', 'equipo_visitante', 'fase', 'grupo',
        'jornada', 'fecha_hora', 'goles_local', 'goles_visitante',
        'estado', 'resultado_cargado'
    ]
    list_filter = ['fase', 'grupo', 'estado', 'resultado_cargado']
    list_editable = ['goles_local', 'goles_visitante', 'resultado_cargado', 'estado']
    search_fields = ['equipo_local__nombre', 'equipo_visitante__nombre']
    ordering = ['fecha_hora']
    actions = ['calcular_puntos_accion']

    @admin.action(description='Recalcular puntos para los partidos seleccionados')
    def calcular_puntos_accion(self, request, queryset):
        from .signals import calcular_puntos_al_guardar_resultado
        actualizados = 0
        for partido in queryset:
            if partido.resultado_cargado and partido.goles_local is not None and partido.goles_visitante is not None:
                # Disparamos la señal o lógica manual
                calcular_puntos_al_guardar_resultado(sender=partido.__class__, instance=partido)
                actualizados += 1
        self.message_user(request, f"Se recalcularon puntos de {actualizados} partido(s).")


@admin.register(Jugador)
class JugadorAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'equipo', 'posicion', 'goles', 'asistencias']
    list_filter = ['equipo__confederacion', 'posicion']
    search_fields = ['nombre', 'equipo__nombre']


@admin.register(Quiniela)
class QuinielaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'usuario', 'puntos_totales', 'created_at']
    list_filter = ['created_at']
    search_fields = ['nombre', 'usuario__username']


@admin.register(PronosticoPartido)
class PronosticoPartidoAdmin(admin.ModelAdmin):
    list_display = ['quiniela', 'partido', 'goles_local_pred', 'goles_visitante_pred', 'puntos_ganados']
    list_filter = ['partido__fase']
    search_fields = ['quiniela__nombre', 'quiniela__usuario__username', 'partido__equipo_local__nombre']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(PronosticoTorneo)
class PronosticoTorneoAdmin(admin.ModelAdmin):
    list_display = ['quiniela', 'campeon', 'subcampeon', 'goleador', 'puntos_especiales']
    readonly_fields = ['created_at', 'updated_at']
