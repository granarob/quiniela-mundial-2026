import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { pagosAPI } from '../../api/matches';

const DataField = ({ label, value, onCopy }) => (
  <div style={{ 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    background: 'rgba(255,255,255,0.02)', padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)'
  }}>
    <div>
      {label && <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>}
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{value}</div>
    </div>
    <button 
      type="button" 
      onClick={onCopy}
      style={{ 
        background: 'var(--color-accent)', color: 'white', border: 'none', 
        borderRadius: '4px', padding: '4px 8px', fontSize: '10px', fontWeight: 700
      }}
    >
      COPIAR
    </button>
  </div>
);

export default function PaymentModal({ quiniela, onClose, onSuccess }) {
  const [moneda, setMoneda] = useState('VES');
  const [referencia, setReferencia] = useState('');
  const [comprobante, setComprobante] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!referencia) return setError('La referencia es obligatoria');
    
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('quiniela', quiniela.id);
    formData.append('monto', moneda === 'VES' ? 6000 : 10);
    formData.append('moneda', moneda);
    formData.append('referencia', referencia);
    if (comprobante) {
      formData.append('comprobante', comprobante);
    }

    try {
      await pagosAPI.create(formData);
      onSuccess();
    } catch (err) {
      setError('Error al reportar el pago. Verifica los datos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    // Podríamos añadir un toast aquí después
    alert(`${label} copiado: ${text}`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div 
        className="glass-card modal-content" 
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ maxWidth: 500, width: '90%', padding: 'var(--space-6)', border: '1px solid var(--color-accent-gold)' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <h3 style={{ marginBottom: 'var(--space-1)', fontSize: 'var(--text-2xl)' }}>🚀 Activa tu Quiniela</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>ID: {quiniela.nombre}</p>
        </div>

        {/* Instrucciones de Pago */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <button 
              className={`btn btn-sm ${moneda === 'VES' ? 'btn-gold' : 'btn-ghost'}`}
              onClick={() => setMoneda('VES')}
              style={{ flex: 1 }}
            >
              🇻🇪 Bolívares (Pago Móvil)
            </button>
            <button 
              className={`btn btn-sm ${moneda === 'USD' ? 'btn-gold' : 'btn-ghost'}`}
              onClick={() => setMoneda('USD')}
              style={{ flex: 1 }}
            >
              🇺🇸 Dólares (Zelle/Binance)
            </button>
          </div>

          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            padding: 'var(--space-5)', 
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--glass-border)'
          }}>
            {moneda === 'VES' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ textAlign: 'center', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--glass-border)' }}>
                  <p style={{ color: 'var(--color-accent-gold)', fontWeight: 800, fontSize: 'var(--text-lg)', margin: 0 }}>Monto: Bs. 6,000</p>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', margin: 'var(--space-2) 0' }}>
                  {/* Placeholder para QR */}
                  <div style={{ 
                    width: 140, height: 140, background: 'rgba(255,255,255,0.05)', 
                    border: '2px dashed var(--glass-border)', borderRadius: 'var(--radius-md)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                    fontSize: '10px', color: 'var(--text-muted)', padding: 'var(--space-4)'
                  }}>
                    Espacio para Código QR Banesco
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <DataField label="Banco" value="Banesco (0134)" onCopy={() => copyToClipboard('0134', 'Banco')} />
                  <DataField label="Nombre" value="Robert Granadillo" onCopy={() => copyToClipboard('Robert Granadillo', 'Nombre')} />
                  <DataField label="Cédula" value="15660834" onCopy={() => copyToClipboard('15660834', 'Cédula')} />
                  <DataField label="Teléfono" value="04140455347" onCopy={() => copyToClipboard('04140455347', 'Teléfono')} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ textAlign: 'center', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--glass-border)' }}>
                  <p style={{ color: 'var(--color-accent-gold)', fontWeight: 800, fontSize: 'var(--text-lg)', margin: 0 }}>Monto: $10.00</p>
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: '4px' }}>🇺🇸 Zelle</p>
                  <DataField value="pagos@tu-zelle-real.com" onCopy={() => copyToClipboard('pagos@tu-zelle-real.com', 'Zelle')} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: '4px' }}>🔶 Binance Pay (Email/ID)</p>
                  <DataField value="usuario_binance@email.com" onCopy={() => copyToClipboard('usuario_binance@email.com', 'Binance')} />
                </div>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}

          <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="form-label">Moneda de Pago</label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button 
                type="button" 
                className={`btn btn-sm ${moneda === 'VES' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setMoneda('VES')}
                style={{ flex: 1 }}
              >
                Bolívares (Bs.)
              </button>
              <button 
                type="button" 
                className={`btn btn-sm ${moneda === 'USD' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setMoneda('USD')}
                style={{ flex: 1 }}
              >
                Dólares ($)
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="form-label">Número de Referencia</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Últimos 4-6 dígitos o ref completa"
              value={referencia}
              onChange={e => setReferencia(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
            <label className="form-label">Comprobante (Opcional)</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={e => setComprobante(e.target.files[0])}
              style={{ fontSize: '12px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-gold" style={{ flex: 2 }} disabled={loading}>
              {loading ? 'Enviando...' : 'Reportar Pago'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
