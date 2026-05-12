from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Equipo, Grupo, GrupoEquipo, Fase, Partido,
    Jugador, Quiniela, Pago, PronosticoPartido, PronosticoTorneo
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
    list_display = ['nombre', 'usuario', 'estado', 'puntos_totales', 'created_at']
    list_filter = ['estado', 'created_at']
    search_fields = ['nombre', 'usuario__username']


@admin.register(Pago)
class PagoAdmin(admin.ModelAdmin):
    list_display = ('referencia', 'quiniela_nombre', 'monto_display', 'estado', 'ver_comprobante', 'fecha_pago')
    list_filter = ('estado', 'moneda', 'fecha_pago')
    search_fields = ('referencia', 'quiniela__nombre', 'quiniela__usuario__username')
    readonly_fields = ('ver_comprobante_detalle',)
    actions = ['aprobar_pagos']

    def quiniela_nombre(self, obj):
        return obj.quiniela.nombre
    quiniela_nombre.short_description = 'Quiniela'

    def monto_display(self, obj):
        return f"{obj.monto} {obj.moneda}"
    monto_display.short_description = 'Monto'

    def ver_comprobante(self, obj):
        if obj.comprobante:
            return format_html('<img src="{}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" />', obj.comprobante.url)
        return "Sin foto"
    ver_comprobante.short_description = 'Vista Previa'

    def ver_comprobante_detalle(self, obj):
        if obj.comprobante:
            return format_html('<a href="{0}" target="_blank"><img src="{0}" style="max-width: 400px; border: 1px solid #ccc;" /></a>', obj.comprobante.url)
        return "No hay comprobante adjunto"
    ver_comprobante_detalle.short_description = 'Comprobante Completo'

    @admin.action(description='Aprobar pagos seleccionados y Activar Quinielas')
    def aprobar_pagos(self, request, queryset):
        count = 0
        for pago in queryset:
            # Activar la quiniela asociada
            quiniela = pago.quiniela
            quiniela.estado = 'pagada'
            quiniela.save()
        self.message_user(request, f"{queryset.count()} pagos aprobados y quinielas activadas.")

    def rechazar_pago(self, request, queryset):
        queryset.update(estado='rechazado')
        self.message_user(request, f"{queryset.count()} pagos rechazados.")


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
