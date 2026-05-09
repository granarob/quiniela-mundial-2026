import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{
      marginTop: 'auto',
      borderTop: '1px solid var(--glass-border)',
      background: 'rgba(15,12,41,0.8)',
      backdropFilter: 'blur(20px)',
      padding: 'var(--space-10) 0',
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-8)',
          marginBottom: 'var(--space-10)',
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <span style={{ fontSize: '1.5rem' }}>⚽</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-lg)' }}>
                Quiniela <span style={{ color: 'var(--color-accent)' }}>2026</span>
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              La plataforma de pronósticos del Mundial de Fútbol FIFA 2026.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h6 style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              Navegación
            </h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {[
                { to: '/', label: 'Inicio' },
                { to: '/grupos', label: 'Grupos' },
                { to: '/leaderboard', label: 'Ranking' },
                { to: '/register', label: 'Regístrate' },
              ].map((link) => (
                <Link key={link.to} to={link.to}
                  style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', transition: 'color 0.15s' }}
                  onMouseOver={e => e.target.style.color = 'var(--text-primary)'}
                  onMouseOut={e => e.target.style.color = 'var(--text-muted)'}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Mundial Info */}
          <div>
            <h6 style={{ marginBottom: 'var(--space-4)', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              Mundial 2026
            </h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              <span>📅 11 Jun – 19 Jul 2026</span>
              <span>🏟️ 48 selecciones</span>
              <span>🌎 USA · México · Canadá</span>
              <span>⚽ 104 partidos</span>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div style={{
          borderTop: '1px solid var(--glass-border)',
          paddingTop: 'var(--space-6)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            © 2026 Quiniela Mundial 2026. Todos los derechos reservados.
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            Hecho con ❤️ para el Mundial
          </p>
        </div>
      </div>
    </footer>
  );
}
