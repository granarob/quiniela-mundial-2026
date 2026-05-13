import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import MatchCard from '../components/matches/MatchCard';
import api from '../api/client';

export default function UserDetail() {
  const { id } = useParams();
  const [quiniela, setQuiniela] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [qRes, pRes] = await Promise.all([
          api.get(`/quinielas/${id}/`),
          api.get(`/pronosticos/partidos/?quiniela=${id}`)
        ]);
        setQuiniela(qRes.data);
        
        // Los partidos vienen dentro de los pronósticos
        const pronos = pRes.data.results || pRes.data;
        // Transformamos para que sea compatible con MatchCard
        const mapped = pronos.map(pr => ({
          ...pr.partido,
          prediction: pr // Inyectamos el pronóstico completo
        }));
        setPartidos(mapped);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Agrupar por jornada
  const porJornada = partidos.reduce((acc, p) => {
    const j = p.jornada || 1;
    if (!acc[j]) acc[j] = [];
    acc[j].push(p);
    return acc;
  }, {});

  return (
    <Layout>
      <section style={{ padding: 'var(--space-20) 0 var(--space-24)' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <Link to="/leaderboard" className="back-link" style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '32px', textDecoration: 'none' }}>
            ← Volver al Ranking
          </Link>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : quiniela ? (
            <>
              <motion.div 
                className="glass-card" 
                style={{ padding: 'var(--space-8)', marginBottom: 'var(--space-8)', textAlign: 'center', border: '1px solid var(--color-gold)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="section-label" style={{ color: 'var(--color-gold)' }}>🕵️ Espiando a:</span>
                <h1 style={{ fontSize: 'var(--text-4xl)', marginBottom: '8px' }}>{quiniela.nombre}</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Usuario: <strong>@{quiniela.usuario_username}</strong></p>
                <div style={{ marginTop: '24px', display: 'inline-block', padding: '12px 24px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', display: 'block' }}>PUNTOS TOTALES</span>
                  <span style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-gold)' }}>{quiniela.puntos_totales} pts</span>
                </div>
              </motion.div>

              <h3 style={{ marginBottom: '24px' }}>📋 Pronósticos de este jugador</h3>

              {Object.entries(porJornada).sort((a,b) => a[0] - b[0]).map(([jornada, matches]) => (
                <div key={jornada} style={{ marginBottom: '40px' }}>
                  <h5 style={{ color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '30px', height: '1px', background: 'var(--glass-border)' }}></span>
                    Jornada {jornada}
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {matches.sort((a,b) => new Date(a.fecha_hora) - new Date(b.fecha_hora)).map((p, i) => (
                      <MatchCard 
                        key={p.id} 
                        partido={p} 
                        prediction={p.prediction} 
                        isLocked={true} 
                        index={i}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <h3>Quiniela no encontrada</h3>
              <p>O tal vez aún no ha sido pagada.</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
