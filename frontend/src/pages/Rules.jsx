import React from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';

export default function Rules() {
  const sections = [
    {
      title: "⚽ Fase de Grupos",
      icon: "📋",
      points: [
        { label: "🎯 Marcador Exacto", value: "5 pts", desc: "Aciertas goles local y visitante idénticos al resultado real." },
        { label: "📊 Tendencia Correcta", value: "3 pts", desc: "Aciertas ganador o empate, pero no el marcador exacto." },
        { label: "❌ Error", value: "0 pts", desc: "No aciertas ni el resultado ni la tendencia." }
      ]
    },
    {
      title: "⚔️ Fases Eliminatorias",
      icon: "🔥",
      points: [
        { label: "🎯 Marcador Exacto", value: "7 pts", desc: "Marcador idéntico en tiempo reglamentario (90' + compensación)." },
        { label: "📊 Tendencia Correcta", value: "4 pts", desc: "Aciertas quién gana el partido sin marcador exacto." },
        { label: "🔮 Clasificado Correcto", value: "2 pts", desc: "Aciertas quién avanza a la siguiente ronda (incluye penales)." }
      ]
    },
    {
      title: "🌟 Predicciones Especiales",
      icon: "🏆",
      points: [
        { label: "🏆 Campeón", value: "25 pts", desc: "Predicción de quién levantará la copa." },
        { label: "🥈 Subcampeón", value: "20 pts", desc: "Predicción del segundo lugar." },
        { label: "🥉 Tercer Lugar", value: "10 pts", desc: "Predicción del ganador del partido de consolación." },
        { label: "4️⃣ Cuarto Lugar", value: "5 pts", desc: "Predicción del cuarto puesto." },
        { label: "⚽ Bota de Oro", value: "15 pts", desc: "Máximo goleador del torneo." },
        { label: "🅰️ Líder de Asistencias", value: "10 pts", desc: "Jugador con más asistencias." }
      ]
    }
  ];

  return (
    <Layout>
      <section style={{ padding: 'var(--space-20) 0 var(--space-24)' }}>
        <div className="container" style={{ maxWidth: 900 }}>
          {/* Header */}
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="section-label">Reglamento</span>
            <h1 className="section-title">Reglas y Puntuación</h1>
            <p className="section-subtitle">
              Entiende cómo ganar puntos y escalar en el ranking global de la Quiniela 2026.
            </p>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-10)' }}>
            {sections.map((section, idx) => (
              <motion.div 
                key={section.title}
                className="glass-card"
                style={{ padding: 'var(--space-8)' }}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                  <span style={{ fontSize: '2.5rem' }}>{section.icon}</span>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 800 }}>
                    {section.title}
                  </h2>
                </div>

                <div className="rules-grid" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
                  gap: 'var(--space-4)' 
                }}>
                  {section.points.map((p) => (
                    <div key={p.label} style={{ 
                      padding: 'var(--space-4)', 
                      borderRadius: 'var(--radius-md)', 
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--glass-border)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{p.label}</span>
                        <span className="badge badge-done">{p.value}</span>
                      </div>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {p.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}

            {/* Lock Rule */}
            <motion.div 
              className="alert alert-warning"
              style={{ padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h3 style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--text-lg)' }}>🔒 Regla de Cierre (Hard Lock)</h3>
              <p>
                Los pronósticos de cada fase se bloquean automáticamente al inicio del primer partido de dicha fase. 
                Las predicciones especiales se cierran al inicio del partido inaugural del Mundial. 
                ¡Asegúrate de guardar tus picks a tiempo!
              </p>
            </motion.div>

            {/* FAQ Sutil */}
            <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                ¿Dudas adicionales? Contáctanos a través de nuestro soporte.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
