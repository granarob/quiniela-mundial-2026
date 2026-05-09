import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { fasesAPI } from '../api/matches';
import { useAuth } from '../context/AuthContext';

/**
 * Eliminatorias — Hub principal que lista todas las fases eliminatorias
 * con su estado: 🔒 bloqueada, 🔓 activa, ✅ finalizada
 */
const FASES_ELIM = [
  { slug: 'ronda32',      nombre: 'Ronda de 32',     equipos: 32, partidos: 16, emoji: '⚔️'  },
  { slug: 'octavos',      nombre: 'Octavos de Final', equipos: 16, partidos: 8,  emoji: '🔥'  },
  { slug: 'cuartos',      nombre: 'Cuartos de Final', equipos: 8,  partidos: 4,  emoji: '💥'  },
  { slug: 'semifinales',  nombre: 'Semifinales',      equipos: 4,  partidos: 2,  emoji: '⭐'  },
  { slug: 'tercer_puesto',nombre: 'Tercer Puesto',    equipos: 2,  partidos: 1,  emoji: '🥉'  },
  { slug: 'final',        nombre: 'La Gran Final',    equipos: 2,  partidos: 1,  emoji: '🏆'  },
];

export default function Eliminatorias() {
  const [fases, setFases] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fasesAPI.list()
      .then(res => setFases(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function getFaseData(slug) {
    return fases.find(f => f.slug === slug) || null;
  }

  function getEstado(faseData) {
    if (!faseData) return 'locked';
    if (!faseData.activa) return 'locked';
    if (faseData.bloqueada || !faseData.esta_abierta) return 'finished';
    return 'open';
  }

  return (
    <Layout>
      <section style={{ padding: 'var(--space-20) 0 var(--space-24)' }}>
        <div className="container" style={{ maxWidth: 860 }}>

          {/* Header */}
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="section-label">FIFA World Cup 2026</span>
            <h1 className="section-title">Fases Eliminatorias</h1>
            <p className="section-subtitle">
              Las fases se desbloquean progresivamente. Cuando una fase se activa, tienes tiempo limitado para pronosticar.
            </p>
          </motion.div>

          {/* Grid de fases */}
          {loading ? (
            <div className="elim-grid">
              {FASES_ELIM.map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 160 }} />
              ))}
            </div>
          ) : (
            <div className="elim-grid">
              {FASES_ELIM.map((meta, i) => {
                const faseData = getFaseData(meta.slug);
                const estado = getEstado(faseData);
                const isOpen = estado === 'open';
                const isFinished = estado === 'finished';
                const isLocked = estado === 'locked';

                const card = (
                  <motion.div
                    className={`elim-card glass-card ${isOpen ? 'elim-card-open' : ''} ${isFinished ? 'elim-card-finished' : ''} ${isLocked ? 'elim-card-locked' : ''}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={isOpen || isFinished ? { y: -6, transition: { duration: 0.2 } } : {}}
                  >
                    {/* Icono y nombre */}
                    <div className="elim-card-emoji">{meta.emoji}</div>
                    <h3 className="elim-card-title">{meta.nombre}</h3>

                    {/* Info */}
                    <div className="elim-card-info">
                      <span>{meta.equipos} selecciones</span>
                      <span>·</span>
                      <span>{meta.partidos} partidos</span>
                    </div>

                    {/* Badge de estado */}
                    <div className="elim-card-badge">
                      {isOpen && <span className="badge badge-open">🔓 Abierta — ¡Pronostica!</span>}
                      {isFinished && <span className="badge badge-done">✅ Finalizada</span>}
                      {isLocked && <span className="badge badge-locked">🔒 Bloqueada</span>}
                    </div>

                    {/* Countdown si está abierta */}
                    {isOpen && faseData?.fecha_cierre && (
                      <div className="elim-card-cierre">
                        📅 Cierra: {new Date(faseData.fecha_cierre).toLocaleDateString('es-MX', {
                          weekday: 'short', day: 'numeric', month: 'short',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    )}

                    {/* CTA */}
                    {(isOpen || isFinished) && (
                      <div className="elim-card-cta">
                        {isOpen ? '⚽ Ver partidos →' : '📊 Ver resultados →'}
                      </div>
                    )}
                  </motion.div>
                );

                // Solo las fases activas o finalizadas son clickeables
                if (isOpen || isFinished) {
                  return (
                    <Link key={meta.slug} to={`/eliminatorias/${meta.slug}`} style={{ textDecoration: 'none' }}>
                      {card}
                    </Link>
                  );
                }
                return <div key={meta.slug}>{card}</div>;
              })}
            </div>
          )}

          {/* Nota informativa */}
          <motion.div
            className="alert alert-warning"
            style={{ marginTop: 'var(--space-10)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            ℹ️ Las fases se activan automáticamente al conocerse los clasificados de cada ronda. Recibirás una notificación cuando una nueva fase esté abierta.
          </motion.div>

        </div>
      </section>
    </Layout>
  );
}
