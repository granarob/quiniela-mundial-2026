import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { equiposAPI, jugadoresAPI, pronosticosAPI } from '../api/matches';

/**
 * SpecialPredictions — Predicciones especiales del torneo:
 * Campeón, Subcampeón, 3er y 4to lugar, Goleador, Asistente.
 */
export default function SpecialPredictions() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isForced = location.state?.forced;

  const [equipos, setEquipos] = useState([]);
  const [jugadores, setJugadores] = useState([]);
  const [form, setForm] = useState({
    campeon: '', subcampeon: '', tercer_lugar: '', cuarto_lugar: '',
    goleador: '', goleador_nombre: '',
    asistente: '', asistente_nombre: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [searchTeam, setSearchTeam] = useState({ field: null, query: '' });
  const [searchPlayer, setSearchPlayer] = useState({ field: null, query: '' });

  useEffect(() => {
    async function load() {
      try {
        const [eqRes, jugRes, predRes] = await Promise.all([
          equiposAPI.list({ participando: 'true', ordering: 'nombre' }),
          jugadoresAPI.list({ participando: 'true', ordering: 'nombre' }),
          pronosticosAPI.getTorneo(),
        ]);
        setEquipos(eqRes.data.results || eqRes.data);
        setJugadores(jugRes.data.results || jugRes.data);
        const pred = Array.isArray(predRes.data) ? predRes.data[0] : predRes.data;
        if (pred) {
          setForm({
            campeon: pred.campeon || '',
            subcampeon: pred.subcampeon || '',
            tercer_lugar: pred.tercer_lugar || '',
            cuarto_lugar: pred.cuarto_lugar || '',
            goleador: pred.goleador || '',
            goleador_nombre: pred.goleador_nombre || '',
            asistente: pred.asistente || '',
            asistente_nombre: pred.asistente_nombre || '',
          });
        }
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {};
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '') payload[k] = v;
        else payload[k] = null;
      });
      await pronosticosAPI.saveTorneo(payload);
      setSaved(true);
      if (isForced) {
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {}
    finally { setSaving(false); }
  }

  function getTeamName(id) {
    const eq = equipos.find(e => e.id === id);
    return eq ? eq.nombre : '';
  }

  function getPlayerName(id) {
    const j = jugadores.find(p => p.id === id);
    return j ? `${j.nombre} (${j.equipo_codigo})` : '';
  }

  const teamPredictions = [
    { key: 'campeon', label: '🏆 Campeón', points: 25 },
    { key: 'subcampeon', label: '🥈 Subcampeón', points: 20 },
    { key: 'tercer_lugar', label: '🥉 Tercer Lugar', points: 10 },
    { key: 'cuarto_lugar', label: '4️⃣ Cuarto Lugar', points: 5 },
  ];

  const playerPredictions = [
    { key: 'goleador', label: '⚽ Goleador (Bota de Oro)', points: 15 },
    { key: 'asistente', label: '🅰️ Líder en Asistencias', points: 10 },
  ];

  const filteredTeams = equipos.filter(e =>
    e.nombre.toLowerCase().includes(searchTeam.query.toLowerCase()) ||
    e.nombre_corto.toLowerCase().includes(searchTeam.query.toLowerCase())
  );

  const filteredPlayers = jugadores.filter(j =>
    j.nombre.toLowerCase().includes(searchPlayer.query.toLowerCase()) ||
    (j.equipo_nombre || '').toLowerCase().includes(searchPlayer.query.toLowerCase())
  );

  return (
    <Layout>
      <section style={{ padding: 'var(--space-20) 0 var(--space-24)' }}>
        <div className="container" style={{ maxWidth: 700 }}>
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="section-label">Predicciones Especiales</span>
            <h1 className="section-title">Bonos del Torneo</h1>
            <p className="section-subtitle">
              Predice los puestos finales y los mejores jugadores. Se bloquean al iniciar el primer partido.
            </p>
          </motion.div>

          {isForced && (
            <motion.div
              className="alert alert-warning"
              style={{ marginBottom: 'var(--space-6)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              🎉 <strong>¡Felicidades por completar todos los partidos!</strong> Para continuar con tu progreso y asegurar todos tus puntos, debes llenar tus pronósticos especiales del torneo.
            </motion.div>
          )}

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <>
              {/* Predicciones de equipos */}
              <motion.div
                className="glass-card special-pred-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h4 style={{ marginBottom: 'var(--space-6)' }}>🌍 Posiciones Finales</h4>
                <div className="special-pred-grid">
                  {teamPredictions.map(({ key, label, points }) => (
                    <div key={key} className="special-pred-item">
                      <div className="special-pred-label">
                        <span>{label}</span>
                        <span className="special-pred-points">+{points} pts</span>
                      </div>
                      <div className="special-pred-selector">
                        {searchTeam.field === key ? (
                          <div className="special-pred-dropdown">
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Buscar selección..."
                              value={searchTeam.query}
                              onChange={e => setSearchTeam({ field: key, query: e.target.value })}
                              autoFocus
                              onBlur={() => setTimeout(() => setSearchTeam({ field: null, query: '' }), 200)}
                            />
                            <div className="special-pred-options">
                              {filteredTeams.slice(0, 10).map(eq => (
                                <button
                                  key={eq.id}
                                  className="special-pred-option"
                                  onMouseDown={() => {
                                    setForm(f => ({ ...f, [key]: eq.id }));
                                    setSearchTeam({ field: null, query: '' });
                                  }}
                                >
                                  {eq.bandera_url && <img src={eq.bandera_url} alt="" className="special-pred-flag" />}
                                  <span>{eq.nombre}</span>
                                  <span className="special-pred-conf">{eq.confederacion}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <button
                            className="special-pred-selected"
                            onClick={() => setSearchTeam({ field: key, query: '' })}
                          >
                            {form[key] ? (
                              <>
                                {equipos.find(e => e.id === form[key])?.bandera_url && (
                                  <img src={equipos.find(e => e.id === form[key])?.bandera_url} alt="" className="special-pred-flag" />
                                )}
                                <span>{getTeamName(form[key])}</span>
                              </>
                            ) : (
                              <span className="special-pred-placeholder">Seleccionar...</span>
                            )}
                            <span className="special-pred-chevron">▾</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Predicciones de jugadores (Manual) */}
              <motion.div
                className="glass-card special-pred-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ marginTop: 'var(--space-6)' }}
              >
                <h4 style={{ marginBottom: 'var(--space-6)' }}>👤 Premios Individuales</h4>
                <div className="special-pred-grid">
                  {playerPredictions.map(({ key, label, points }) => (
                    <div key={key} className="special-pred-item">
                      <div className="special-pred-label">
                        <span>{label}</span>
                        <span className="special-pred-points">+{points} pts</span>
                      </div>
                      <div className="special-pred-selector">
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Escribe el nombre del jugador..."
                          value={form[`${key}_nombre`] || ''}
                          onChange={(e) => setForm({ ...form, [`${key}_nombre`]: e.target.value })}
                          style={{
                            width: '100%',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-primary)',
                            padding: 'var(--space-3) var(--space-4)',
                            borderRadius: 'var(--radius-md)',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Botón de guardar */}
              <motion.div
                style={{ marginTop: 'var(--space-8)', textAlign: 'center' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <button
                  id="save-special-predictions"
                  className="btn btn-gold btn-lg"
                  onClick={handleSave}
                  disabled={saving}
                  style={{ minWidth: 240 }}
                >
                  {saving ? '⏳ Guardando...' : saved ? '✅ ¡Guardado!' : '💾 Guardar Predicciones'}
                </button>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-3)' }}>
                  Puedes modificar hasta que inicie el primer partido del mundial
                </p>
              </motion.div>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
