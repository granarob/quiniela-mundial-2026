import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { requestPasswordReset } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setMessage('Si el correo existe, te hemos enviado un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada.');
    } catch (err) {
      setError('Ocurrió un error al intentar enviar el correo. Por favor, intenta de nuevo.');
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
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🔐</div>
            <h2 style={{ marginBottom: 'var(--space-2)' }}>Recuperar Contraseña</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
            </p>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>{error}</div>}
          {message && <div className="alert alert-success" style={{ marginBottom: 'var(--space-5)' }}>{message}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Correo Electrónico</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 'var(--space-4)' }}
              disabled={loading}
            >
              {loading ? '⏳ Enviando...' : '✉️ Enviar enlace'}
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            ¿Recordaste tu contraseña?{' '}
            <Link to="/login" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
              Inicia sesión
            </Link>
          </p>
        </motion.div>
      </section>
    </Layout>
  );
}
