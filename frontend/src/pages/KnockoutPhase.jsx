import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import MatchCard from '../components/matches/MatchCard';
import SaveIndicator from '../components/matches/SaveIndicator';
import CountdownTimer from '../components/ui/CountdownTimer';
import { useAuth } from '../context/AuthContext';
import { fasesAPI } from '../api/matches';
import usePredictions from '../hooks/usePredictions';

const NOMBRE_FASES = {
  ronda32:       'Ronda de 32',
  octavos:       'Octavos de Final',
  cuartos:       'Cuartos de Final',
  semifinales:   'Semifinales',
  tercer_puesto: 'Tercer Puesto',
  final:         'La Gran Final',
};

const EMOJI_FASES = {
  ronda32: '⚔️', octavos: '🔥', cuartos: '💥',
  semifinales: '⭐', tercer_puesto: '🥉', final: '🏆',
};

/**
 * KnockoutPhase — Vista de una fase eliminatoria específica.
 * Reutiliza MatchCard y usePredictions igual que GroupDetail.
 */
export default function KnockoutPhase() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [fase, setFase] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);

  const {
    predictions,
    setPrediction,
    saveStatus,
    saveAll,
    isSaving,
    completados,
    total,
  } = usePredictions(partidos);

  useEffect(() => {
    async function load() {
      try {
        const [faseRes, pRes] = await Promise.all([
          fasesAPI.get(slug),
          fasesAPI.partidos(slug),
        ]);
        setFase(faseRes.data);
        setPartidos(pRes.data.results || pRes.data);
      } catch {
        navigate('/eliminatorias');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const isLocked = fase ? (!fase.esta_abierta) : true;
  const nombre = NOMBRE_FASES[slug] || fase?.nombre || slug;
  const emoji  = EMOJI_FASES[slug] || '⚽';

  // Agrupar por rondas dentro de la fase (jornada = round)
  const porRonda = partidos.reduce((acc, p) => {
    const r = p.jornada || 1;
    if (!acc[r]) acc[r] = [];
    acc[r].push(p);
    return acc;
  }, {});

  return (
    <Layout>
      <section style={{ padding: 'var(--space-20) 0 var(--space-24)' }}>
        <div className="container" style={{ maxWidth: 800 }}>

          {/* Breadcrumb */}
          <Link
            to="/eliminatorias"
            style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)',
              display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
              marginBottom: 'var(--space-8)', textDecoration: 'none' }}
          >
            ← Volver a Eliminatorias
          </Link>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <>
              {/* Header */}
              <motion.div
                className="section-header"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>{emoji}</div>
                <span className="section-label">Fases Eliminatorias</span>
                <h1 className="section-title">{nombre}</h1>
              </motion.div>

              {/* Countdown */}
              {fase?.fecha_cierre && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{ marginBottom: 'var(--space-6)' }}
                >
                  <CountdownTimer
                    targetDate={fase.fecha_cierre}
                    label={`Cierre de pronósticos — ${nombre}`}
                  />
                </motion.div>
              )}

              {/* Save indicator */}
              {user && partidos.length > 0 && (
                <div className="save-indicator-sticky">
                  <SaveIndicator
                    status={saveStatus}
                    completados={completados}
                    total={total}
                  />
                </div>
              )}

              {/* Alertas de estado */}
              {isLocked && fase?.activa && (
                <motion.div className="alert alert-warning" style={{ marginBottom: 'var(--space-6)' }}>
                  🔒 Esta fase ya está cerrada. Los pronósticos no se pueden modificar.
                </motion.div>
              )}
              {!fase?.activa && (
                <motion.div className="alert alert-warning" style={{ marginBottom: 'var(--space-6)' }}>
                  ⏳ Esta fase aún no está activa. Se desbloqueará cuando se conozcan los clasificados.
                </motion.div>
              )}
              {!user && (
                <motion.div className="alert alert-warning" style={{ marginBottom: 'var(--space-6)' }}>
                  ⚠️ <Link to="/login" style={{ fontWeight: 700 }}>Inicia sesión</Link> para guardar tus pronósticos.
                </motion.div>
              )}

              {/* Partidos vacíos */}
              {!loading && partidos.length === 0 && fase?.activa && (
                <div className="glass-card" style={{ padding: 'var(--space-10)', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🕐</div>
                  <h4 style={{ marginBottom: 'var(--space-2)' }}>Los cruces se definirán pronto</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                    Los partidos se cargarán cuando se conozcan los clasificados de la fase anterior.
                  </p>
                </div>
              )}

              {/* Partidos agrupados por ronda */}
              {Object.entries(porRonda).map(([ronda, matches], ri) => (
                <motion.div
                  key={ronda}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: ri * 0.1 }}
                  style={{ marginBottom: 'var(--space-8)' }}
                >
                  {Object.keys(porRonda).length > 1 && (
                    <h5 style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>
                      🏟️ Ronda {ronda}
                    </h5>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    {matches.map((partido, i) => (
                      <MatchCard
                        key={partido.id}
                        partido={partido}
                        prediction={predictions[partido.id]}
                        onSetPrediction={setPrediction}
                        isLocked={isLocked || !user}
                        index={i}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}

              {/* Botón de guardar todo */}
              {user && !isLocked && partidos.length > 0 && (
                <motion.div
                  style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <button
                    id={`save-all-${slug}`}
                    className="btn btn-primary btn-lg"
                    onClick={saveAll}
                    disabled={isSaving}
                    style={{ minWidth: 200 }}
                  >
                    {isSaving ? '⏳ Guardando...' : '💾 Guardar Todo'}
                  </button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
