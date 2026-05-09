import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ pais_favorito: user?.pais_favorito || '', bio: user?.bio || '' });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/auth/me/', form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    finally { setLoading(false); }
  }

  return (
    <Layout>
      <section style={{ padding: 'var(--space-20) 0 var(--space-24)' }}>
        <div className="container" style={{ maxWidth: 600 }}>
          <motion.div
            className="glass-card"
            style={{ padding: 'var(--space-10)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'var(--gradient-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', fontWeight: 700, margin: '0 auto var(--space-4)',
                border: '3px solid var(--glass-border)',
              }}>
                {user?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <h3>{user?.username}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{user?.email}</p>
            </div>

            {saved && <div className="alert alert-success" style={{ marginBottom: 'var(--space-5)' }}>✅ Perfil actualizado</div>}

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">País favorito</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.pais_favorito}
                  onChange={e => setForm(f => ({ ...f, pais_favorito: e.target.value }))}
                  placeholder="ej. México, Argentina..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea
                  className="form-input"
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Cuéntanos algo sobre ti..."
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? '⏳ Guardando...' : '💾 Guardar cambios'}
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
