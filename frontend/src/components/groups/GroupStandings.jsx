import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * GroupStandings — Tabla de posiciones calculada en tiempo real 
 * basada en los pronósticos del usuario.
 */
export default function GroupStandings({ equipos = [], partidos = [], predictions = {} }) {
  
  const standings = useMemo(() => {
    // Inicializar tabla
    const table = equipos.map(({ equipo }) => ({
      id: equipo.id,
      nombre: equipo.nombre,
      nombre_corto: equipo.nombre_corto,
      bandera_url: equipo.bandera_url,
      pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dg: 0, pts: 0
    }));

    // Procesar cada partido
    partidos.forEach(partido => {
      const pred = predictions[partido.id];
      // Solo contar si hay un pronóstico completo (ambos campos con valor)
      if (pred && pred.goles_local_pred !== '' && pred.goles_visitante_pred !== '' && 
          pred.goles_local_pred !== null && pred.goles_visitante_pred !== null) {
        
        const gl = parseInt(pred.goles_local_pred, 10);
        const gv = parseInt(pred.goles_visitante_pred, 10);

        const local = table.find(t => t.id === partido.equipo_local.id);
        const visit = table.find(t => t.id === partido.equipo_visitante.id);

        if (local && visit) {
          local.pj += 1;
          visit.pj += 1;
          local.gf += gl;
          local.gc += gv;
          visit.gf += gv;
          visit.gc += gl;

          if (gl > gv) {
            local.g += 1;
            local.pts += 3;
            visit.p += 1;
          } else if (gl < gv) {
            visit.g += 1;
            visit.pts += 3;
            local.p += 1;
          } else {
            local.e += 1;
            local.pts += 1;
            visit.e += 1;
            visit.pts += 1;
          }
          local.dg = local.gf - local.gc;
          visit.dg = visit.gf - visit.gc;
        }
      }
    });

    // Ordenar: Pts > DG > GF
    return table.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.dg !== a.dg) return b.dg - a.dg;
      return b.gf - a.gf;
    });
  }, [equipos, partidos, predictions]);

  return (
    <motion.div 
      className="glass-card standings-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ overflow: 'hidden', marginBottom: 'var(--space-8)' }}
    >
      <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
        <h5 style={{ margin: 0, fontSize: 'var(--text-sm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          📊 Posiciones proyectadas
        </h5>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table className="standings-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ padding: 'var(--space-3) var(--space-6)', fontWeight: 500 }}>Pos</th>
              <th style={{ padding: 'var(--space-3)', fontWeight: 500 }}>Equipo</th>
              <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 500 }}>PJ</th>
              <th style={{ padding: 'var(--space-3)', textAlign: 'center', fontWeight: 500 }}>DG</th>
              <th style={{ padding: 'var(--space-3) var(--space-6)', textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)' }}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, idx) => (
              <tr key={team.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="standing-row">
                <td style={{ padding: 'var(--space-4) var(--space-6)' }}>
                  <span style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    width: 24, height: 24, borderRadius: '50%',
                    background: idx < 2 ? 'rgba(0,200,83,0.15)' : idx === 2 ? 'rgba(255,171,0,0.1)' : 'transparent',
                    color: idx < 2 ? 'var(--color-success)' : idx === 2 ? 'var(--color-warning)' : 'var(--text-muted)',
                    fontSize: 'var(--text-xs)', fontWeight: 700
                  }}>
                    {idx + 1}
                  </span>
                </td>
                <td style={{ padding: 'var(--space-4) var(--space-1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    {team.bandera_url && (
                      <img src={team.bandera_url} alt="" style={{ width: 24, height: 16, borderRadius: 2, objectFit: 'cover' }} />
                    )}
                    <span style={{ fontWeight: 600 }}>{team.nombre}</span>
                  </div>
                </td>
                <td style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-secondary)' }}>{team.pj}</td>
                <td style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  {team.dg > 0 ? `+${team.dg}` : team.dg}
                </td>
                <td style={{ padding: 'var(--space-4) var(--space-6)', textAlign: 'center', fontWeight: 800, color: 'var(--color-accent)' }}>
                  {team.pts}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div style={{ padding: 'var(--space-3) var(--space-6)', background: 'rgba(255,255,255,0.02)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)' }} /> Clasifica
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-warning)' }} /> Posible mejor 3ro
          </span>
        </div>
      </div>
    </motion.div>
  );
}
