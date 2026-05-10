import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { adminAPI, partidosAPI } from '../api/matches';

export default function Admin() {
  const { user } = useAuth();
  const [fases, setFases] = useState([]);
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Filtros para partidos
  const [filtroEstado, setFiltroEstado] = useState('programado');
  const [filtroFase, setFiltroFase] = useState('grupos');

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
    try {
      const [fasesRes, partidosRes] = await Promise.all([
        adminAPI.fases(),
        partidosAPI.list() 
      ]);
      setFases(fasesRes.data);
      // Extraemos la lista de partidos de la respuesta
      const p = partidosRes.data.results || partidosRes.data;
      setPartidos(p);
      
      // Inicializamos el estado de edición para los partidos
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
      // Refrescar partidos
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

  const partidosFiltrados = partidos.filter(p => {
    // Si la API devuelve fase_slug o grupo_letra podemos filtrar
    // Si no, filtramos manualmente o cargamos de la API de /partidos/ global.
    return true; // Simplificado para este ejemplo
  });

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
              className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: 'var(--space-6)' }}
            >
              {message.text}
            </motion.div>
          )}

          {/* Sección de Fases */}
          <div className="glass-card" style={{ marginBottom: 'var(--space-10)' }}>
            <h3 style={{ marginBottom: 'var(--space-6)' }}>🗓️ Gestión de Fases</h3>
            <div className="table-responsive">
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: 'var(--space-3)' }}>Fase</th>
                    <th style={{ padding: 'var(--space-3)' }}>Estado Actual</th>
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
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '4px 12px', fontSize: 'var(--text-xs)' }}
                            onClick={() => handleFaseAction(f.slug, 'activar')}
                          >
                            🔓 Activar
                          </button>
                        )}
                        {f.activa && !f.bloqueada && (
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '4px 12px', fontSize: 'var(--text-xs)', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                            onClick={() => handleFaseAction(f.slug, 'bloquear')}
                          >
                            🔒 Bloquear (Cerrar)
                          </button>
                        )}
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '4px 12px', fontSize: 'var(--text-xs)' }}
                          onClick={() => handleFaseAction(f.slug, 'desactivar')}
                        >
                          Apagar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-4)' }}>
              * Activar permite que los usuarios hagan pronósticos. Bloquear cierra la fase (ya no pueden editar) pero la mantiene visible en rojo. Apagar la oculta/inactiva.
            </p>
          </div>

          {/* Sección de Partidos */}
          <div className="glass-card">
            <h3 style={{ marginBottom: 'var(--space-6)' }}>⚽ Cargar Resultados Reales</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
              Al marcar un partido como "Finalizado" y presionar Guardar, el sistema recalculará automáticamente los puntos de todos los usuarios que hayan hecho un pronóstico para ese partido.
            </p>

            <div className="table-responsive">
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: 'var(--space-3)' }}>Partido</th>
                    <th style={{ padding: 'var(--space-3)' }}>Goles Local</th>
                    <th style={{ padding: 'var(--space-3)' }}>Goles Visita</th>
                    <th style={{ padding: 'var(--space-3)' }}>Estado</th>
                    <th style={{ padding: 'var(--space-3)' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {partidos.map(p => {
                    const equipoL = p.equipo_local?.nombre || p.equipo_local;
                    const equipoV = p.equipo_visitante?.nombre || p.equipo_visitante;
                    const display = p.partido_display || `${equipoL} vs ${equipoV}`;
                    // En la API de pronosticos, "partido" es el ID real del partido.
                    // En la API de partidos, "id" es el ID del partido.
                    // Usaremos p.partido si usamos la API de pronosticos, o p.id si usamos la de partidos.
                    const pId = p.partido || p.id;

                    // Ignoramos pronosticos que no tengan id de partido o nombre
                    if (!pId || !editScores[pId]) return null;

                    return (
                      <tr key={pId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                          <strong>{display}</strong>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            {p.fase_slug} {p.grupo_letra ? `| Grupo ${p.grupo_letra}` : ''}
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-3)' }}>
                          <input 
                            type="number" 
                            min="0"
                            className="form-input" 
                            style={{ width: 60, padding: '4px' }}
                            value={editScores[pId].goles_local}
                            onChange={(e) => handleScoreChange(pId, 'goles_local', e.target.value)}
                          />
                        </td>
                        <td style={{ padding: 'var(--space-3)' }}>
                          <input 
                            type="number" 
                            min="0"
                            className="form-input" 
                            style={{ width: 60, padding: '4px' }}
                            value={editScores[pId].goles_visitante}
                            onChange={(e) => handleScoreChange(pId, 'goles_visitante', e.target.value)}
                          />
                        </td>
                        <td style={{ padding: 'var(--space-3)' }}>
                          <select 
                            className="form-input" 
                            style={{ padding: '4px', fontSize: 'var(--text-sm)' }}
                            value={editScores[pId].estado}
                            onChange={(e) => handleScoreChange(pId, 'estado', e.target.value)}
                          >
                            <option value="programado">Programado</option>
                            <option value="en_curso">En Curso</option>
                            <option value="finalizado">Finalizado</option>
                          </select>
                        </td>
                        <td style={{ padding: 'var(--space-3)' }}>
                          <button 
                            className="btn btn-gold" 
                            style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                            onClick={() => handleSaveResultado(pId)}
                            disabled={saving}
                          >
                            💾 Guardar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      </section>
    </Layout>
  );
}
