import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import MatchCard from '../components/matches/MatchCard';
import SaveIndicator from '../components/matches/SaveIndicator';
import CountdownTimer from '../components/ui/CountdownTimer';
import { useAuth } from '../context/AuthContext';
import { gruposAPI, fasesAPI } from '../api/matches';
import usePredictions from '../hooks/usePredictions';
import GroupStandings from '../components/groups/GroupStandings';

export default function GroupDetail() {
  const { letra } = useParams();
  const { user } = useAuth();
  const [grupo, setGrupo] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [faseGrupos, setFaseGrupos] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hook de pronósticos con auto-save
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
        const [gRes, pRes, fasesRes] = await Promise.all([
          gruposAPI.get(letra),
          gruposAPI.partidos(letra),
          fasesAPI.list(),
        ]);
        setGrupo(gRes.data);
        const matchList = pRes.data.results || pRes.data;
        setPartidos(matchList);

        // Buscar la fase de grupos para el countdown
        const fases = fasesRes.data.results || fasesRes.data;
        const fg = fases.find(f => f.slug === 'grupos');
        if (fg) setFaseGrupos(fg);
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, [letra]);

  // Ordenar y agrupar partidos por jornada
  const porJornada = [...partidos]
    .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))
    .reduce((acc, p) => {
      const j = p.jornada || 1;
      if (!acc[j]) acc[j] = [];
      acc[j].push(p);
      return acc;
    }, {});

  const isLocked = faseGrupos ? !faseGrupos.esta_abierta : false;

  return (
    <Layout>
      <section style={{ padding: 'var(--space-20) 0 var(--space-24)' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          {/* Back */}
          <Link
            to="/grupos"
            className="back-link"
            style={{
              color: 'var(--text-muted)',
              fontSize: 'var(--text-sm)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-8)',
              textDecoration: 'none',
            }}
          >
            ← Volver a grupos
          </Link>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : grupo ? (
            <>
              {/* Header */}
              <motion.div
                className="section-header"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="section-label">Fase de Grupos</span>
                <h1 className="section-title">Grupo {letra}</h1>
              </motion.div>

              {/* Real-time Group Standings */}
              <GroupStandings 
                equipos={grupo.equipos_detalle} 
                partidos={partidos} 
                predictions={predictions} 
              />

              {/* Countdown Timer */}
              {faseGrupos?.fecha_cierre && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  style={{ marginBottom: 'var(--space-6)' }}
                >
                  <CountdownTimer
                    targetDate={faseGrupos.fecha_cierre}
                    label="Cierre de pronósticos — Fase de Grupos"
                  />
                </motion.div>
              )}

              {/* Save indicator (sticky) */}
              {user && (
                <div className="save-indicator-sticky">
                  <SaveIndicator
                    status={saveStatus}
                    completados={completados}
                    total={total}
                  />
                </div>
              )}

              {/* Lock overlay */}
              {isLocked && (
                <motion.div
                  className="alert alert-warning"
                  style={{ marginBottom: 'var(--space-6)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  🔒 Esta fase ya está cerrada. Los pronósticos no se pueden modificar.
                </motion.div>
              )}

              {/* Not logged in alert */}
              {!user && (
                <motion.div
                  className="alert alert-warning"
                  style={{ marginBottom: 'var(--space-6)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  ⚠️ <Link to="/login" style={{ fontWeight: 700 }}>Inicia sesión</Link> para guardar tus pronósticos.
                </motion.div>
              )}

              {/* Matches by Jornada */}
              {Object.entries(porJornada).map(([jornada, matches]) => (
                <motion.div
                  key={jornada}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Number(jornada) * 0.1 }}
                  style={{ marginBottom: 'var(--space-8)' }}
                >
                  <h5 style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>
                    📅 Jornada {jornada}
                  </h5>
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

              {/* Bulk save button */}
              {user && !isLocked && (
                <motion.div
                  style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <button
                    id="save-all-predictions"
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
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Grupo no encontrado.</p>
          )}
        </div>
      </section>
    </Layout>
  );
}
