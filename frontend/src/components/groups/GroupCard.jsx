import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function GroupCard({ grupo, index = 0, userProgress = {} }) {
  const { letra, equipos_detalle = [], total_partidos = 6 } = grupo;
  const completados = userProgress[letra] || 0;
  const porcentaje = total_partidos > 0 ? Math.round((completados / total_partidos) * 100) : 0;

  const getBadge = () => {
    if (completados === total_partidos && total_partidos > 0)
      return <span className="badge badge-done">✅ Completo</span>;
    if (completados > 0)
      return <span className="badge badge-warning">⚠️ En progreso</span>;
    return <span className="badge badge-locked">⬜ Sin pronósticos</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -8 }}
    >
      <Link to={`/grupos/${letra}`} style={{ textDecoration: 'none' }}>
        <div className="glass-card" style={{
          padding: 'var(--space-6)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Group Letter watermark */}
          <div style={{
            position: 'absolute', top: '-10px', right: '-10px',
            fontFamily: 'var(--font-display)', fontSize: '6rem', fontWeight: 900,
            color: 'rgba(255,255,255,0.03)', lineHeight: 1, pointerEvents: 'none',
          }}>
            {letra}
          </div>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-5)' }}>
            <div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-1)' }}>
                GRUPO
              </p>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-4xl)', fontWeight: 900, color: 'var(--color-accent)', lineHeight: 1 }}>
                {letra}
              </h3>
            </div>
            {getBadge()}
          </div>

          {/* Teams / Flags */}
          <div style={{ marginBottom: 'var(--space-5)' }}>
            {equipos_detalle.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {equipos_detalle.map(({ equipo, posicion }) => (
                  <div key={equipo.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    {equipo.bandera_url ? (
                      <img
                        src={equipo.bandera_url}
                        alt={equipo.nombre}
                        style={{ width: 24, height: 16, objectFit: 'cover', borderRadius: 2 }}
                      />
                    ) : (
                      <span style={{ fontSize: '1.2rem' }}>{equipo.bandera_emoji || '🏳️'}</span>
                    )}
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      {equipo.nombre}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                      {equipo.nombre_corto}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>4 equipos por definir</span>
              </div>
            )}
          </div>

          {/* Progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Pronósticos</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {completados}/{total_partidos}
              </span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${porcentaje}%` }} />
            </div>
          </div>

          {/* Arrow indicator */}
          <div style={{
            marginTop: 'var(--space-4)',
            textAlign: 'right',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
          }}>
            Ver partidos →
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
