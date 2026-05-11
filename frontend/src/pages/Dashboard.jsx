import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useQuiniela } from '../context/QuinielaContext';
import { pronosticosAPI, leaderboardAPI, fasesAPI } from '../api/matches';
import QuinielaManager from '../components/dashboard/QuinielaManager';

export default function Dashboard() {
  const { user } = useAuth();
  const { selectedQuiniela } = useQuiniela();
  const navigate = useNavigate();
  const [resumen, setResumen] = useState(null);
  const [miPosicion, setMiPosicion] = useState(null);
  const [fases, setFases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!selectedQuiniela) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [resRes, posRes, fasesRes] = await Promise.all([
          pronosticosAPI.resumen(selectedQuiniela.id),
          leaderboardAPI.miPosicion(),
          fasesAPI.list(),
        ]);
        const resumenData = resRes.data;

        // Force special predictions if all matches are predicted but special aren't
        if (resumenData.pronósticos_completados === resumenData.total_partidos && resumenData.total_partidos > 0) {
          if (!resumenData.especiales_completos) {
            navigate('/predicciones', { state: { forced: true } });
            return;
          }
        }

        setResumen(resumenData);
        setMiPosicion(posRes.data);
        setFases(fasesRes.data.results || fasesRes.data);
      } catch (err) {
        console.error(err);
      }
      finally { setLoading(false); }
    }
    load();
  }, [selectedQuiniela]);

  const stats = [
    { label: 'Puntos totales', value: resumen?.puntos_totales ?? '—', icon: '📊', accent: true },
    { label: 'Posición global', value: miPosicion?.posicion ? `#${miPosicion.posicion}` : '—', icon: '🏅' },
    { label: 'Pronósticos', value: resumen ? `${resumen['pronósticos_completados']}/${resumen.total_partidos}` : '—', icon: '✅' },
  ];

  return (
    <Layout>
      <section style={{ padding: 'var(--space-20) 0 var(--space-24)' }}>
        <div className="container">
          {/* Welcome */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>
              ¡Bienvenido de vuelta!
            </p>
            <h1 style={{ marginBottom: 'var(--space-10)' }}>
              👋 {user?.username}
            </h1>
          </motion.div>

          {/* Manager de Quinielas */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }}
            style={{ marginBottom: 'var(--space-12)' }}
          >
            <QuinielaManager />
          </motion.div>

          {/* Stats Cards */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-10)' }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120 }} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-10)' }}>
              {stats.map(({ label, value, icon, accent }, i) => (
                <motion.div
                  key={label}
                  className="glass-card stat-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>{icon}</div>
                  <div className="stat-number" style={accent ? {} : { background: 'none', WebkitTextFillColor: 'var(--text-primary)' }}>
                    {value}
                  </div>
                  <div className="stat-label">{label}</div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Phases */}
          <motion.div
            className="glass-card"
            style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-8)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h4 style={{ marginBottom: 'var(--space-5)' }}>🗓️ Fases del Torneo</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              {fases.map(fase => (
                <div key={fase.slug} style={{
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-full)',
                  background: fase.activa ? 'var(--color-success-bg)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${fase.activa ? 'var(--color-success)' : 'var(--glass-border)'}`,
                  fontSize: 'var(--text-sm)',
                  color: fase.activa ? 'var(--color-success)' : 'var(--text-muted)',
                  fontWeight: 600,
                }}>
                  {fase.activa ? '🔓' : '🔒'} {fase.nombre}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)' }}>
            <Link to="/grupos" style={{ textDecoration: 'none' }}>
              <div className="glass-card glass-card-interactive" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-4)' }}>⚽</div>
                <h5 style={{ marginBottom: 'var(--space-2)' }}>Hacer pronósticos</h5>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Completa tus picks para los 12 grupos</p>
              </div>
            </Link>
            <Link to="/eliminatorias" style={{ textDecoration: 'none' }}>
              <div className="glass-card glass-card-interactive" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-4)' }}>🏟️</div>
                <h5 style={{ marginBottom: 'var(--space-2)' }}>Eliminatorias</h5>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Predice los cruces eliminatorios</p>
              </div>
            </Link>
            <Link to="/leaderboard" style={{ textDecoration: 'none' }}>
              <div className="glass-card glass-card-interactive" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-4)' }}>🏆</div>
                <h5 style={{ marginBottom: 'var(--space-2)' }}>Ver Ranking</h5>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>¿Cómo vas contra los demás?</p>
              </div>
            </Link>
            <Link to="/predicciones" style={{ textDecoration: 'none' }}>
              <div className="glass-card glass-card-interactive" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-4)' }}>🌟</div>
                <h5 style={{ marginBottom: 'var(--space-2)' }}>Predicciones Especiales</h5>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Campeón, Goleador y más bonos</p>
              </div>
            </Link>
            <Link to="/perfil" style={{ textDecoration: 'none' }}>
              <div className="glass-card glass-card-interactive" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-4)' }}>👤</div>
                <h5 style={{ marginBottom: 'var(--space-2)' }}>Mi Perfil</h5>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Actualiza tu avatar y datos</p>
              </div>
            </Link>
            {user?.is_admin && (
              <Link to="/admin-panel" style={{ textDecoration: 'none' }}>
                <div className="glass-card glass-card-interactive" style={{ padding: 'var(--space-6)', textAlign: 'center', borderColor: 'var(--color-accent)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 'var(--space-4)' }}>🔧</div>
                  <h5 style={{ marginBottom: 'var(--space-2)', color: 'var(--color-accent)' }}>Panel Admin</h5>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Configurar el torneo</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
