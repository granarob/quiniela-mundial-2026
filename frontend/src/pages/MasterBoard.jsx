import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import api from '../api/client';

export default function MasterBoard() {
  const [data, setData] = useState({ partidos: [], usuarios: [], matrix: {} });
  const [jornada, setJornada] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/pronosticos/partidos/matrix/?jornada=${jornada}`);
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [jornada]);

  return (
    <Layout>
      <section style={{ padding: 'var(--space-16) 0' }}>
        <div className="container-fluid" style={{ padding: '0 var(--space-6)' }}>
          <div className="section-header" style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
            <span className="section-label">📊 El Tablero Maestro</span>
            <h1 className="section-title">Todos contra Todos</h1>
            <p className="section-subtitle">Mira qué ligan tus rivales en tiempo real</p>
          </div>

          {/* Selector de Jornada */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
            {[1, 2, 3].map(j => (
              <button 
                key={j} 
                className={`btn btn-sm ${jornada === j ? 'btn-gold' : 'btn-ghost'}`}
                onClick={() => setJornada(j)}
                style={{ minWidth: '100px' }}
              >
                Jornada {j}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div className="glass-card" style={{ padding: 0, overflowX: 'auto', borderRadius: '16px' }}>
              <table className="master-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <th style={{ padding: '16px', textAlign: 'left', minWidth: '150px', position: 'sticky', left: 0, background: '#1a1a2e', zIndex: 10 }}>USUARIO</th>
                    {data.partidos.map(p => (
                      <th key={p.id} style={{ padding: '12px', textAlign: 'center', minWidth: '100px', borderLeft: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <img src={p.equipo_local?.bandera_url || ''} alt="L" style={{ width: '16px', height: '10px' }} />
                            <span style={{ fontSize: '10px' }}>vs</span>
                            <img src={p.equipo_visitante?.bandera_url || ''} alt="V" style={{ width: '16px', height: '10px' }} />
                          </div>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{p.equipo_local?.nombre_corto || 'TBD'} - {p.equipo_visitante?.nombre_corto || 'TBD'}</span>
                          {p.resultado_cargado && (
                            <div style={{ background: 'var(--color-gold)', color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                              {p.goles_local}-{p.goles_visitante}
                            </div>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.usuarios.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, position: 'sticky', left: 0, background: '#1a1a2e', zIndex: 5 }}>
                        {u.nombre}
                        <div style={{ fontSize: '9px', fontWeight: 400, color: 'var(--text-muted)' }}>@{u.username}</div>
                      </td>
                      {data.partidos.map(p => {
                        const prono = data.matrix[u.id]?.[p.id];
                        const isSuccess = prono && prono.pts > 0;
                        return (
                          <td key={p.id} style={{ 
                            padding: '12px', 
                            textAlign: 'center', 
                            borderLeft: '1px solid var(--glass-border)',
                            background: isSuccess ? 'rgba(0, 255, 0, 0.05)' : 'transparent'
                          }}>
                            {prono ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontWeight: 800, fontSize: '14px', color: isSuccess ? 'var(--color-gold)' : 'var(--text-primary)' }}>
                                  {prono.l}-{prono.v}
                                </span>
                                {prono.pts !== null && p.resultado_cargado && (
                                  <span style={{ fontSize: '9px', color: isSuccess ? '#00ff00' : 'var(--text-muted)' }}>
                                    {prono.pts > 0 ? `+${prono.pts}` : '0'} pts
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: 'rgba(255,255,255,0.1)' }}>-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
