import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch {
      setError('Usuario o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-16) 0' }}>
        <motion.div
          className="glass-card"
          style={{ width: '100%', maxWidth: 440, padding: 'var(--space-10)', margin: '0 var(--space-4)' }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>⚽</div>
            <h2 style={{ marginBottom: 'var(--space-2)' }}>Bienvenido de vuelta</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Inicia sesión para ver tus pronósticos</p>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Usuario</label>
              <input
                id="login-username"
                className="form-input"
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="tu_usuario"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input
                id="login-password"
                className="form-input"
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                required
              />
            </div>
            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 'var(--space-4)' }}
              disabled={loading}
            >
              {loading ? '⏳ Ingresando...' : '🚀 Iniciar Sesión'}
            </button>
            <div style={{ textAlign: 'right', marginTop: 'var(--space-3)' }}>
              <Link to="/forgot-password" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </form>

          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            ¿No tienes cuenta?{' '}
            <Link to="/register" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
              Regístrate gratis
            </Link>
          </p>
        </motion.div>
      </section>
    </Layout>
  );
}
