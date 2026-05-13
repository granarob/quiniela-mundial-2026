import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { leaderboardAPI } from '../api/matches';
import { useAuth } from '../context/AuthContext';
import { useQuiniela } from '../context/QuinielaContext';

export default function Leaderboard() {
  const [ranking, setRanking] = useState([]);
  const [miPosicion, setMiPosicion] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { selectedQuiniela } = useQuiniela();

  useEffect(() => {
    async function load() {
      try {
        const [rRes] = await Promise.all([leaderboardAPI.list()]);
        setRanking(rRes.data.results || rRes.data);
        
        if (user && selectedQuiniela) {
          const posRes = await leaderboardAPI.miPosicion(selectedQuiniela.id);
          setMiPosicion(posRes.data);
        } else {
          setMiPosicion(null);
        }
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, [user, selectedQuiniela]);

  const medalIcon = (i) => {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return `#${i + 1}`;
  };

  return (
    <Layout>
      <section style={{ padding: 'var(--space-20) 0 var(--space-24)' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="section-header">
            <span className="section-label">🏆 Ranking</span>
            <h1 className="section-title">Leaderboard Global</h1>
            <p className="section-subtitle">¿En qué posición estás?</p>
          </div>

          {miPosicion && (
            <motion.div
              className="glass-card"
              style={{ 
                padding: 'var(--space-5)', marginBottom: 'var(--space-8)', 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                borderColor: miPosicion.estado === 'pagada' ? 'var(--color-accent)' : 'var(--color-warning)' 
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  Quiniela: <strong>{selectedQuiniela?.nombre}</strong>
                </div>
                <div style={{ fontWeight: 600 }}>
                  Posición: {typeof miPosicion.posicion === 'number' ? `#${miPosicion.posicion}` : miPosicion.posicion}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'var(--text-xl)' }}>
                  {miPosicion.puntos} pts
                </span>
                {miPosicion.estado !== 'pagada' && (
                  <div style={{ fontSize: '10px', color: 'var(--color-warning)' }}>
                    Actívala para participar
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              {ranking.length === 0 ? (
                <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Aún no hay quinielas activas participando.
                </div>
              ) : ranking.map((item, i) => (
                <Link
                  key={item.quiniela_id}
                  to={`/jugador/${item.quiniela_id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    padding: 'var(--space-4) var(--space-6)',
                    borderBottom: '1px solid var(--glass-border)',
                    background: selectedQuiniela?.id === item.quiniela_id ? 'rgba(233,69,96,0.08)' : 'transparent',
                    transition: 'all 0.2s',
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                  className="leaderboard-row"
                >
                  <span style={{
                    minWidth: 36,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 900,
                    fontSize: i < 3 ? 'var(--text-xl)' : 'var(--text-sm)',
                    color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--text-muted)',
                  }}>
                    {medalIcon(i)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.nombre}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      by @{item.username} {selectedQuiniela?.id === item.quiniela_id && ' (Tú)'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'var(--text-lg)', color: 'var(--color-accent-gold)' }}>
                      {item.puntos} <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 400 }}>pts</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--color-accent)', fontWeight: 600 }}>VER PICKS →</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
