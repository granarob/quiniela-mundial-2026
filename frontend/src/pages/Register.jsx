import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', password2: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await register(form.username, form.email, form.password, form.password2);
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      setError(data ? JSON.stringify(data) : 'Error al registrarse.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-16) 0' }}>
        <motion.div
          className="glass-card"
          style={{ width: '100%', maxWidth: 480, padding: 'var(--space-10)', margin: '0 var(--space-4)' }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🏆</div>
            <h2 style={{ marginBottom: 'var(--space-2)' }}>Únete a la Quiniela</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Crea tu cuenta y empieza a pronosticar</p>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            {[
              { id: 'reg-username', key: 'username', label: 'Nombre de usuario', type: 'text', placeholder: 'tu_nombre' },
              { id: 'reg-email', key: 'email', label: 'Email', type: 'email', placeholder: 'tu@email.com' },
              { id: 'reg-password', key: 'password', label: 'Contraseña', type: 'password', placeholder: 'Mínimo 8 caracteres' },
              { id: 'reg-password2', key: 'password2', label: 'Confirmar contraseña', type: 'password', placeholder: '••••••••' },
            ].map(field => (
              <div key={field.key} className="form-group">
                <label className="form-label">{field.label}</label>
                <input
                  id={field.id}
                  className="form-input"
                  type={field.type}
                  value={form[field.key]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  required
                />
              </div>
            ))}
            <button
              id="reg-submit"
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 'var(--space-4)' }}
              disabled={loading}
            >
              {loading ? '⏳ Creando cuenta...' : '✨ Crear mi cuenta'}
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
              Inicia sesión
            </Link>
          </p>
        </motion.div>
      </section>
    </Layout>
  );
}
