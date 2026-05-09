import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { leaderboardAPI } from '../api/matches';
import { useAuth } from '../context/AuthContext';

export default function Leaderboard() {
  const [ranking, setRanking] = useState([]);
  const [miPosicion, setMiPosicion] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function load() {
      try {
        const [rRes] = await Promise.all([leaderboardAPI.list()]);
        setRanking(rRes.data.results || rRes.data);
        if (user) {
          const posRes = await leaderboardAPI.miPosicion();
          setMiPosicion(posRes.data);
        }
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, [user]);

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

          {miPosicion?.posicion && (
            <motion.div
              className="glass-card"
              style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-8)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: 'var(--color-accent)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span style={{ fontWeight: 600 }}>Tu posición: #{miPosicion.posicion}</span>
              <span style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'var(--text-xl)' }}>
                {miPosicion.puntos} pts
              </span>
            </motion.div>
          )}

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              {ranking.length === 0 ? (
                <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Aún no hay participantes en el ranking.
                </div>
              ) : ranking.map((perfil, i) => (
                <motion.div
                  key={perfil.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    padding: 'var(--space-4) var(--space-6)',
                    borderBottom: '1px solid var(--glass-border)',
                    background: user?.username === perfil.username ? 'rgba(233,69,96,0.08)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onMouseOver={e => { if (user?.username !== perfil.username) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = user?.username === perfil.username ? 'rgba(233,69,96,0.08)' : 'transparent'; }}
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
                    <div style={{ fontWeight: 600, color: user?.username === perfil.username ? 'var(--color-accent)' : 'var(--text-primary)' }}>
                      {perfil.username} {user?.username === perfil.username && '← tú'}
                    </div>
                    {perfil.pais_favorito && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{perfil.pais_favorito}</div>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'var(--text-lg)', color: 'var(--color-accent-gold)' }}>
                    {perfil.puntos_totales} <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 400 }}>pts</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
