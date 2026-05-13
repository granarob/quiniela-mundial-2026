import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import GroupCard from '../components/groups/GroupCard';
import { gruposAPI, pronosticosAPI } from '../api/matches';
import { useAuth } from '../context/AuthContext';
import { useQuiniela } from '../context/QuinielaContext';

export default function Groups() {
  const navigate = useNavigate();
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({});
  const { user } = useAuth();
  const { quinielas, selectedQuiniela, loading: loadingQuinielas } = useQuiniela();

  useEffect(() => {
    if (!loadingQuinielas && quinielas.length === 0 && user) {
      navigate('/dashboard');
      return;
    }

    async function load() {
      try {
        const res = await gruposAPI.list();
        const sortedGroups = (res.data.results || res.data).sort((a, b) => a.letra.localeCompare(b.letra));
        setGrupos(sortedGroups);
      } catch (e) {
        setError('No se pudieron cargar los grupos.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [loadingQuinielas, quinielas, user, navigate]);

  useEffect(() => {
    if (!user || !selectedQuiniela) {
      setProgress({});
      return;
    }
    
    Promise.all([
      pronosticosAPI.listPartidos(selectedQuiniela.id),
      pronosticosAPI.resumen(selectedQuiniela.id)
    ]).then(([partidosRes, resumenRes]) => {
      const map = {};
      const data = partidosRes.data.results || partidosRes.data;
      data.forEach(p => {
        const letra = p.grupo_letra;
        if (letra) map[letra] = (map[letra] || 0) + 1;
      });
      setProgress(map);

      const resumenData = resumenRes.data;
      if (resumenData.pronósticos_completados === resumenData.total_partidos && resumenData.total_partidos > 0) {
        if (!resumenData.especiales_completos) {
          navigate('/predicciones', { state: { forced: true }, replace: true });
        }
      }
    }).catch(() => {});
  }, [user, navigate, selectedQuiniela]);

  const totalCompletados = Object.values(progress).reduce((a, b) => a + b, 0);
  const totalPartidos = grupos.reduce((acc, g) => acc + (g.total_partidos || 6), 0);
  const globalPct = totalPartidos > 0 ? Math.round((totalCompletados / totalPartidos) * 100) : 0;

  return (
    <Layout>
      <section style={{ padding: 'var(--space-20) 0 var(--space-24)' }}>
        <div className="container">
          {/* Header */}
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="section-label">⚽ Fase de Grupos</span>
            <h1 className="section-title">Los 12 Grupos</h1>
            <p className="section-subtitle">
              72 partidos. 48 selecciones. Predice cada resultado antes del kickoff.
            </p>
          </motion.div>

          {/* Global Progress (only for authenticated users) */}
          {user && (
            <motion.div
              className="glass-card"
              style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-10)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  📊 Tu progreso global
                </span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  {totalCompletados} / {totalPartidos} pronósticos ({globalPct}%)
                </span>
              </div>
              <div className="progress-bar-container" style={{ height: 10 }}>
                <div className="progress-bar-fill" style={{ width: `${globalPct}%` }} />
              </div>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 'var(--space-8)' }}>
              {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
              {Array(12).fill(0).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 240 }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
              {grupos.map((grupo, i) => (
                <GroupCard key={grupo.id} grupo={grupo} index={i} userProgress={progress} />
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
