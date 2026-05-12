import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { adminAPI, partidosAPI } from '../api/matches';

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pagos'); // Por defecto en pagos
  const [fases, setFases] = useState([]);
  const [partidos, setPartidos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Estado local para editar goles en la tabla
  const [editScores, setEditScores] = useState({});

  useEffect(() => {
    if (user && user.is_admin) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const [fasesRes, partidosRes, usuariosRes, pagosRes] = await Promise.all([
        adminAPI.fases(),
        partidosAPI.list(),
        adminAPI.usuarios(),
        adminAPI.pagos()
      ]);
      setFases(fasesRes.data);
      setUsuarios(usuariosRes.data.results || usuariosRes.data);
      setPagos(pagosRes.data);
      
      const p = partidosRes.data.results || partidosRes.data;
      setPartidos(p);
      
      const scores = {};
      p.forEach(partido => {
        scores[partido.id] = {
          goles_local: partido.goles_local ?? '',
          goles_visitante: partido.goles_visitante ?? '',
          estado: partido.estado
        };
      });
      setEditScores(scores);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function showMessage(text, type = 'success') {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }

  // --- Pagos ---
  async function handleAprobarPago(id) {
    if (!window.confirm('¿Estás seguro de aprobar este pago? Esto activará la quiniela del usuario.')) return;
    setSaving(true);
    try {
      await adminAPI.aprobarPago(id);
      showMessage('Pago aprobado y quiniela activada correctamente.');
      const res = await adminAPI.pagos();
      setPagos(res.data);
    } catch (e) {
      showMessage('Error al aprobar el pago.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleRechazarPago(id) {
    if (!window.confirm('¿Estás seguro de rechazar este pago?')) return;
    setSaving(true);
    try {
      await adminAPI.rechazarPago(id);
      showMessage('Pago rechazado.', 'warning');
      const res = await adminAPI.pagos();
      setPagos(res.data);
    } catch (e) {
      showMessage('Error al rechazar el pago.', 'error');
    } finally {
      setSaving(false);
    }
  }

  // --- Fases ---
  async function handleFaseAction(slug, action) {
    try {
      if (action === 'activar') await adminAPI.activarFase(slug);
      if (action === 'desactivar') await adminAPI.desactivarFase(slug);
      if (action === 'bloquear') await adminAPI.bloquearFase(slug);
      
      showMessage(`Fase actualizada: ${action}`);
      const fasesRes = await adminAPI.fases();
      setFases(fasesRes.data);
    } catch (error) {
      showMessage('Error al actualizar la fase', 'error');
    }
  }

  // --- Partidos ---
  async function handleSaveResultado(partidoId) {
    const scores = editScores[partidoId];
    if (scores.goles_local === '' || scores.goles_visitante === '') {
      showMessage('Debes ingresar los goles de ambos equipos', 'error');
      return;
    }
    
    setSaving(true);
    try {
      await adminAPI.cargarResultado(
        partidoId, 
        scores.goles_local, 
        scores.goles_visitante, 
        scores.estado
      );
      showMessage('Resultado guardado y puntos recalculados exitosamente.');
      const partidosRes = await partidosAPI.list();
      setPartidos(partidosRes.data.results || partidosRes.data);
    } catch (e) {
      showMessage('Error al guardar el resultado.', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleScoreChange(partidoId, field, value) {
    setEditScores(prev => ({
      ...prev,
      [partidoId]: {
        ...prev[partidoId],
        [field]: value
      }
    }));
  }

  if (loading) {
    return <Layout><div className="loading-center"><div className="spinner" /></div></Layout>;
  }

  if (!user || !user.is_admin) {
    return (
      <Layout>
        <section style={{ padding: 'var(--space-20) 0', textAlign: 'center' }}>
          <h2>Acceso Denegado</h2>
          <p>No tienes permisos de administrador para ver esta página.</p>
        </section>
      </Layout>
    );
  }

  const tabs = [
    { id: 'pagos', label: 'Validar Pagos', icon: '💳' },
    { id: 'fases', label: 'Gestión de Fases', icon: '🗓️' },
    { id: 'resultados', label: 'Resultados Reales', icon: '⚽' },
    { id: 'usuarios', label: 'Usuarios', icon: '👥' },
  ];

  return (
    <Layout>
      <section style={{ padding: 'var(--space-10) 0 var(--space-24)' }}>
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="section-label">Panel de Control</span>
            <h1 className="section-title" style={{ marginBottom: 'var(--space-8)' }}>
              🔧 Administración del Torneo
            </h1>
          </motion.div>

          {message && (
            <motion.div
              className={`alert alert-${message.type === 'error' ? 'error' : message.type === 'warning' ? 'warning' : 'success'}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: 'var(--space-6)' }}
            >
              {message.text}
            </motion.div>
          )}

          {/* Tabs Navigation */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-8)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`btn ${activeTab === tab.id ? 'btn-gold' : 'btn-ghost'}`}
                style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* TAB: PAGOS */}
              {activeTab === 'pagos' && (
                <div className="glass-card">
                  <h3 style={{ marginBottom: 'var(--space-6)' }}>💳 Validación de Pagos</h3>
                  <div className="table-responsive">
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                          <th style={{ padding: 'var(--space-3)' }}>Usuario / Quiniela</th>
                          <th style={{ padding: 'var(--space-3)' }}>Ref / Monto</th>
                          <th style={{ padding: 'var(--space-3)' }}>Estado</th>
                          <th style={{ padding: 'var(--space-3)' }}>Captura</th>
                          <th style={{ padding: 'var(--space-3)' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagos.map(p => (
                          <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: 'var(--space-3)' }}>
                              <div style={{ fontWeight: 600 }}>@{p.username}</div>
                              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{p.quiniela_nombre}</div>
                            </td>
                            <td style={{ padding: 'var(--space-3)' }}>
                              <div>{p.referencia}</div>
                              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent-gold)', fontWeight: 700 }}>
                                {p.monto} {p.moneda}
                              </div>
                            </td>
                            <td style={{ padding: 'var(--space-3)' }}>
                              <span className={`badge ${p.estado === 'completado' ? 'badge-done' : p.estado === 'rechazado' ? 'badge-locked' : 'badge-open'}`}>
                                {p.estado.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: 'var(--space-3)' }}>
                              {p.comprobante ? (
                                <a href={p.comprobante} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '10px' }}>
                                  👁️ VER FOTO
                                </a>
                              ) : (
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sin capture</span>
                              )}
                            </td>
                            <td style={{ padding: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)' }}>
                              {p.estado === 'pendiente' && (
                                <>
                                  <button 
                                    className="btn btn-primary" 
                                    style={{ padding: '4px 12px', fontSize: 'var(--text-xs)', background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                                    onClick={() => handleAprobarPago(p.id)}
                                    disabled={saving}
                                  >
                                    Aprobar
                                  </button>
                                  <button 
                                    className="btn btn-outline" 
                                    style={{ padding: '4px 12px', fontSize: 'var(--text-xs)', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                                    onClick={() => handleRechazarPago(p.id)}
                                    disabled={saving}
                                  >
                                    Rechazar
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                        {pagos.length === 0 && (
                          <tr>
                            <td colSpan="5" style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--text-muted)' }}>
                              No hay reportes de pago registrados.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB: FASES */}
              {activeTab === 'fases' && (
                <div className="glass-card">
                  <h3 style={{ marginBottom: 'var(--space-6)' }}>🗓️ Gestión de Fases</h3>
                  <div className="table-responsive">
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                          <th style={{ padding: 'var(--space-3)' }}>Fase</th>
                          <th style={{ padding: 'var(--space-3)' }}>Estado</th>
                          <th style={{ padding: 'var(--space-3)' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fases.map(f => (
                          <tr key={f.slug} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: 'var(--space-3)', fontWeight: 600 }}>{f.nombre}</td>
                            <td style={{ padding: 'var(--space-3)' }}>
                              {f.activa ? (
                                <span className="badge badge-open">Activa</span>
                              ) : f.bloqueada ? (
                                <span className="badge badge-locked">Bloqueada</span>
                              ) : (
                                <span className="badge badge-done">Inactiva</span>
                              )}
                            </td>
                            <td style={{ padding: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)' }}>
                              {!f.activa && (
                                <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: 'var(--text-xs)' }} onClick={() => handleFaseAction(f.slug, 'activar')}>🔓 Activar</button>
                              )}
                              {f.activa && !f.bloqueada && (
                                <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: 'var(--text-xs)', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} onClick={() => handleFaseAction(f.slug, 'bloquear')}>🔒 Bloquear</button>
                              )}
                              <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: 'var(--text-xs)' }} onClick={() => handleFaseAction(f.slug, 'desactivar')}>Apagar</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB: RESULTADOS */}
              {activeTab === 'resultados' && (
                <div className="glass-card">
                  <h3 style={{ marginBottom: 'var(--space-6)' }}>⚽ Cargar Resultados Reales</h3>
                  <div className="table-responsive">
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                          <th style={{ padding: 'var(--space-3)' }}>Partido</th>
                          <th style={{ padding: 'var(--space-3)' }}>Local</th>
                          <th style={{ padding: 'var(--space-3)' }}>Visita</th>
                          <th style={{ padding: 'var(--space-3)' }}>Estado</th>
                          <th style={{ padding: 'var(--space-3)' }}>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {partidos.map(p => {
                          const pId = p.partido || p.id;
                          if (!pId || !editScores[pId]) return null;
                          return (
                            <tr key={pId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: 'var(--space-3)', fontSize: 'var(--text-xs)' }}>
                                <strong>{p.partido_display || `${p.equipo_local?.nombre} vs ${p.equipo_visitante?.nombre}`}</strong>
                                <div>{p.fase_slug}</div>
                              </td>
                              <td style={{ padding: 'var(--space-3)' }}>
                                <input type="number" className="form-input" style={{ width: 50, padding: '4px' }} value={editScores[pId].goles_local} onChange={(e) => handleScoreChange(pId, 'goles_local', e.target.value)} />
                              </td>
                              <td style={{ padding: 'var(--space-3)' }}>
                                <input type="number" className="form-input" style={{ width: 50, padding: '4px' }} value={editScores[pId].goles_visitante} onChange={(e) => handleScoreChange(pId, 'goles_visitante', e.target.value)} />
                              </td>
                              <td style={{ padding: 'var(--space-3)' }}>
                                <select className="form-input" style={{ padding: '4px', fontSize: '10px' }} value={editScores[pId].estado} onChange={(e) => handleScoreChange(pId, 'estado', e.target.value)}>
                                  <option value="programado">Prog.</option>
                                  <option value="en_curso">Curso</option>
                                  <option value="finalizado">Final</option>
                                </select>
                              </td>
                              <td style={{ padding: 'var(--space-3)' }}>
                                <button className="btn btn-gold" style={{ padding: '4px 8px', fontSize: '10px' }} onClick={() => handleSaveResultado(pId)} disabled={saving}>💾 OK</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB: USUARIOS */}
              {activeTab === 'usuarios' && (
                <div className="glass-card">
                  <h3 style={{ marginBottom: 'var(--space-6)' }}>👥 Usuarios Registrados</h3>
                  <div className="table-responsive">
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                          <th style={{ padding: 'var(--space-3)' }}>Usuario</th>
                          <th style={{ padding: 'var(--space-3)' }}>Email</th>
                          <th style={{ padding: 'var(--space-3)' }}>Puntos</th>
                          <th style={{ padding: 'var(--space-3)' }}>Rol</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usuarios.map(u => (
                          <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: 'var(--space-3)', fontWeight: 600 }}>{u.username}</td>
                            <td style={{ padding: 'var(--space-3)' }}>{u.email}</td>
                            <td style={{ padding: 'var(--space-3)' }}>{u.puntos_totales}</td>
                            <td style={{ padding: 'var(--space-3)' }}>
                              {u.is_admin ? <span className="badge badge-done">Admin</span> : <span className="badge badge-open">Jugador</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

        </div>
      </section>
    </Layout>
  );
}
