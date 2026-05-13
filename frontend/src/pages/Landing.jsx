import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';

const COUNTDOWN_TARGET = new Date('2026-06-11T22:00:00Z');

function useCountdown(target) {
  const [time, setTime] = React.useState({});
  React.useEffect(() => {
    function calc() {
      const diff = target - Date.now();
      if (diff <= 0) return setTime({ d: 0, h: 0, m: 0, s: 0 });
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [target]);
  return time;
}

export default function Landing() {
  const { user } = useAuth();
  const time = useCountdown(COUNTDOWN_TARGET);

  const stats = [
    { number: '48', label: 'Selecciones' },
    { number: '104', label: 'Partidos' },
    { number: '1,029', label: 'Puntos máx.' },
    { number: '3', label: 'Países sede' },
  ];

  const howItWorks = [
    { icon: '📝', step: '01', title: 'Regístrate', desc: 'Crea tu cuenta en segundos y accede a la plataforma.' },
    { icon: '⚽', step: '02', title: 'Haz tus picks', desc: 'Predice los marcadores de los 104 partidos del mundial y más.' },
    { icon: '🏆', step: '03', title: 'Gana puntos', desc: 'Acumula puntos con cada acierto y sube en el ranking.' },
  ];

  return (
    <Layout>
      {/* ── Hero ── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: 'var(--space-24) 0',
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: 'absolute', top: '10%', right: '5%',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(233,69,96,0.15) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', left: '5%',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(41,121,255,0.1) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="section-label">FIFA World Cup 2026 ⚽</span>

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              fontWeight: 900,
              lineHeight: 1.05,
              marginBottom: 'var(--space-6)',
              marginTop: 'var(--space-4)',
            }}>
              <span style={{ color: 'var(--text-primary)' }}>Quiniela</span>
              <br />
              <span style={{
                background: 'var(--gradient-accent)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>Mundial 2026</span>
            </h1>

            <p style={{
              fontSize: 'var(--text-xl)',
              color: 'var(--text-secondary)',
              maxWidth: '600px',
              margin: '0 auto var(--space-10)',
              lineHeight: 1.7,
            }}>
              Predice los resultados del Mundial FIFA 2026. Compite con amigos, acumula puntos y demuestra que eres el mejor estratega del balón.
            </p>

            {user ? (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Link to="/dashboard" className="btn btn-primary btn-lg animate-glow-pulse">
                  🚀 Ir a mi Panel
                </Link>
              </motion.div>
            ) : (
              <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Link to="/register" className="btn btn-primary btn-lg animate-glow-pulse">
                    ✨ Únete Ahora
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Link to="/grupos" className="btn btn-secondary btn-lg">
                    👀 Ver Grupos
                  </Link>
                </motion.div>
              </div>
            )}
          </motion.div>

          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            style={{ marginTop: 'var(--space-16)' }}
          >
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              ⏱️ Cuenta regresiva al partido inaugural
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { value: time.d ?? '--', label: 'Días' },
                { value: String(time.h ?? '--').padStart(2, '0'), label: 'Horas' },
                { value: String(time.m ?? '--').padStart(2, '0'), label: 'Min' },
                { value: String(time.s ?? '--').padStart(2, '0'), label: 'Seg' },
              ].map(({ value, label }) => (
                <div key={label} className="glass-card" style={{
                  padding: 'var(--space-5) var(--space-6)',
                  textAlign: 'center',
                  minWidth: '80px',
                }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-4xl)', fontWeight: 900, color: 'var(--color-accent)' }}>
                    {value}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 'var(--space-1)' }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ padding: 'var(--space-16) 0', borderTop: '1px solid var(--glass-border)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-6)' }}>
            {stats.map(({ number, label }, i) => (
              <motion.div
                key={label}
                className={`glass-card stat-card stagger-${i + 1} animate-slide-up`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="stat-number">{number}</div>
                <div className="stat-label">{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ padding: 'var(--space-24) 0' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">¿Cómo funciona?</span>
            <h2 className="section-title">Simple. Rápido. Emocionante.</h2>
            <p className="section-subtitle">En 3 pasos estarás compitiendo por el primer lugar del ranking.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-6)' }}>
            {howItWorks.map(({ icon, step, title, desc }, i) => (
              <motion.div
                key={step}
                className="glass-card glass-card-interactive"
                style={{ padding: 'var(--space-8)', position: 'relative', overflow: 'hidden' }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div style={{
                  position: 'absolute', top: 'var(--space-4)', right: 'var(--space-5)',
                  fontFamily: 'var(--font-display)', fontSize: '4rem', fontWeight: 900,
                  color: 'rgba(255,255,255,0.04)',
                }}>
                  {step}
                </div>
                <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-5)' }}>{icon}</div>
                <h4 style={{ marginBottom: 'var(--space-3)' }}>{title}</h4>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{desc}</p>
              </motion.div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}>
            <Link to="/reglas" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', textDecoration: 'none', borderBottom: '1px solid var(--text-muted)', paddingBottom: 2 }}>
              Ver sistema detallado de puntos y reglas →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      {!user && (
        <section style={{
          padding: 'var(--space-24) 0',
          background: 'linear-gradient(135deg, rgba(233,69,96,0.1) 0%, rgba(41,121,255,0.08) 100%)',
          borderTop: '1px solid var(--glass-border)',
          borderBottom: '1px solid var(--glass-border)',
          textAlign: 'center',
        }}>
          <div className="container">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <h2 style={{ marginBottom: 'var(--space-5)' }}>
                ¿Listo para el <span style={{ color: 'var(--color-accent)' }}>Mundial</span>?
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)', fontSize: 'var(--text-lg)' }}>
                Únete ahora y empieza a hacer tus pronósticos antes del 11 de junio de 2026.
              </p>
              <Link to="/register" className="btn btn-primary btn-lg animate-glow-pulse">
                🏆 Crear mi cuenta gratis
              </Link>
            </motion.div>
          </div>
        </section>
      )}
    </Layout>
  );
}
