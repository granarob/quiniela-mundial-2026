import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';

export default function ResetPassword() {
  const { uidb64, token } = useParams();
  const navigate = useNavigate();
  const { confirmPasswordReset } = useAuth();
  
  const [form, setForm] = useState({ password: '', passwordConfirm: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (form.password !== form.passwordConfirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(uidb64, token, form.password, form.passwordConfirm);
      setMessage('¡Contraseña actualizada con éxito!');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'El enlace es inválido o ha expirado.');
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
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🔑</div>
            <h2 style={{ marginBottom: 'var(--space-2)' }}>Nueva Contraseña</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              Ingresa tu nueva contraseña para acceder a tu cuenta.
            </p>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>{error}</div>}
          {message && <div className="alert alert-success" style={{ marginBottom: 'var(--space-5)' }}>{message}</div>}

          {!message ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nueva Contraseña</label>
                <input
                  className="form-input"
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  minLength={8}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmar Contraseña</label>
                <input
                  className="form-input"
                  type="password"
                  value={form.passwordConfirm}
                  onChange={e => setForm(f => ({ ...f, passwordConfirm: e.target.value }))}
                  placeholder="••••••••"
                  minLength={8}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 'var(--space-4)' }}
                disabled={loading}
              >
                {loading ? '⏳ Actualizando...' : '💾 Guardar Contraseña'}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
                Ir a Iniciar Sesión
              </Link>
            </div>
          )}
        </motion.div>
      </section>
    </Layout>
  );
}
