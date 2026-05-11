from rest_framework import serializers
from .models import (
    Equipo, Grupo, GrupoEquipo, Fase, Partido,
    Jugador, Quiniela, Pago, PronosticoPartido, PronosticoTorneo
)


class EquipoSerializer(serializers.ModelSerializer):
    bandera_emoji = serializers.ReadOnlyField()

    class Meta:
        model = Equipo
        fields = [
            'id', 'nombre', 'nombre_corto', 'codigo_iso',
            'bandera_url', 'bandera_emoji', 'confederacion', 'ranking_fifa'
        ]


class GrupoEquipoSerializer(serializers.ModelSerializer):
    equipo = EquipoSerializer(read_only=True)

    class Meta:
        model = GrupoEquipo
        fields = ['posicion', 'equipo']


class GrupoSerializer(serializers.ModelSerializer):
    equipos_detalle = GrupoEquipoSerializer(
        source='grupoequipo_set', many=True, read_only=True
    )
    total_partidos = serializers.SerializerMethodField()

    class Meta:
        model = Grupo
        fields = ['id', 'letra', 'equipos_detalle', 'total_partidos']

    def get_total_partidos(self, obj):
        return obj.partidos.count()


class FaseSerializer(serializers.ModelSerializer):
    esta_abierta = serializers.ReadOnlyField()
    tiempo_restante = serializers.ReadOnlyField()

    class Meta:
        model = Fase
        fields = [
            'id', 'nombre', 'slug', 'orden',
            'fecha_apertura', 'fecha_cierre',
            'activa', 'bloqueada',
            'esta_abierta', 'tiempo_restante'
        ]


class PartidoListSerializer(serializers.ModelSerializer):
    """Serializer compacto para listas."""
    equipo_local = EquipoSerializer(read_only=True)
    equipo_visitante = EquipoSerializer(read_only=True)
    fase_nombre = serializers.CharField(source='fase.nombre', read_only=True)
    grupo_letra = serializers.CharField(source='grupo.letra', read_only=True)
    resultado_display = serializers.ReadOnlyField()

    class Meta:
        model = Partido
        fields = [
            'id', 'equipo_local', 'equipo_visitante',
            'fase_nombre', 'grupo_letra', 'jornada',
            'fecha_hora', 'sede', 'ciudad',
            'goles_local', 'goles_visitante',
            'estado', 'resultado_cargado', 'resultado_display'
        ]


class PartidoDetailSerializer(PartidoListSerializer):
    """Serializer completo con info de fase."""
    fase = FaseSerializer(read_only=True)
    grupo = GrupoSerializer(read_only=True)

    class Meta(PartidoListSerializer.Meta):
        fields = PartidoListSerializer.Meta.fields + ['fase', 'grupo']


class QuinielaSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = Quiniela
        fields = ['id', 'nombre', 'usuario', 'username', 'estado', 'puntos_totales', 'created_at', 'updated_at']
        read_only_fields = ['usuario', 'puntos_totales', 'created_at', 'updated_at']


class PagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pago
        fields = [
            'id', 'quiniela', 'monto', 'moneda', 'referencia',
            'comprobante', 'estado', 'fecha_pago', 'notas_admin'
        ]
        read_only_fields = ['estado', 'fecha_pago', 'notas_admin']


class JugadorSerializer(serializers.ModelSerializer):
    equipo_nombre = serializers.CharField(source='equipo.nombre', read_only=True)
    equipo_codigo = serializers.CharField(source='equipo.nombre_corto', read_only=True)

    class Meta:
        model = Jugador
        fields = [
            'id', 'nombre', 'posicion', 'foto_url', 'numero_camiseta',
            'equipo', 'equipo_nombre', 'equipo_codigo',
            'goles', 'asistencias'
        ]


class PronosticoPartidoSerializer(serializers.ModelSerializer):
    partido_display = serializers.CharField(source='partido.__str__', read_only=True)
    grupo_letra = serializers.CharField(source='partido.grupo.letra', read_only=True, allow_null=True)
    fase_slug = serializers.CharField(source='partido.fase.slug', read_only=True)

    class Meta:
        model = PronosticoPartido
        fields = [
            'id', 'quiniela', 'partido', 'partido_display', 'grupo_letra', 'fase_slug',
            'goles_local_pred', 'goles_visitante_pred',
            'puntos_ganados', 'created_at', 'updated_at'
        ]
        read_only_fields = ['puntos_ganados', 'created_at', 'updated_at']

    def validate(self, data):
        partido = data.get('partido')
        if partido and not partido.fase.esta_abierta():
            raise serializers.ValidationError(
                "Esta fase ya está cerrada. No puedes modificar pronósticos."
            )
        return data


class PronosticoBulkSerializer(serializers.Serializer):
    """Para guardar múltiples pronósticos en una sola llamada."""
    pronosticos = PronosticoPartidoSerializer(many=True)


class PronosticoTorneoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PronosticoTorneo
        fields = [
            'id', 'quiniela', 'campeon', 'subcampeon', 'tercer_lugar', 'cuarto_lugar',
            'goleador', 'goleador_nombre', 'asistente', 'asistente_nombre',
            'puntos_especiales', 'created_at', 'updated_at'
        ]
        read_only_fields = ['puntos_especiales', 'created_at', 'updated_at']
