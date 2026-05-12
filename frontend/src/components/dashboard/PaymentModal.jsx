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

const RequiredBadge = () => (
  <span style={{ 
    background: 'rgba(220,53,69,0.2)', color: '#ff6b7a', 
    fontSize: '9px', fontWeight: 700, padding: '1px 5px', 
    borderRadius: '3px', marginLeft: '6px', verticalAlign: 'middle'
  }}>OBLIGATORIO</span>
);

export default function PaymentModal({ quiniela, onClose, onSuccess }) {
  const [metodo, setMetodo] = useState('pagomovil'); // pagomovil | zelle | binance
  const [referencia, setReferencia] = useState('');
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const esBinance = metodo === 'binance';
  const moneda = metodo === 'pagomovil' ? 'VES' : metodo === 'zelle' ? 'USD' : 'USDT';
  const monto = metodo === 'pagomovil' ? 6000 : 10;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!referencia.trim()) {
      return setError(esBinance ? 'El número de transacción es obligatorio' : 'El número de referencia es obligatorio');
    }
    if (!esBinance && !telefono.trim()) {
      return setError('El número de teléfono de origen es obligatorio');
    }

    setLoading(true);
    setError('');

    // Construimos la referencia completa con el teléfono si aplica
    const referenciaCompleta = esBinance
      ? `TXN: ${referencia.trim()}`
      : `REF: ${referencia.trim()} | TEL: ${telefono.trim()}`;

    try {
      await pagosAPI.create({
        quiniela: quiniela.id,
        monto,
        moneda,
        referencia: referenciaCompleta,
      });
      onSuccess();
    } catch (err) {
      const errorMsg = err.response?.data 
        ? JSON.stringify(err.response.data) 
        : 'Error de conexión con el servidor';
      setError(`Error al reportar: ${errorMsg}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copiado: ${text}`);
  };

  const tabStyle = (active) => ({
    flex: 1, padding: '8px 4px', fontSize: '11px', fontWeight: 700,
    border: `1px solid ${active ? 'var(--color-accent-gold)' : 'var(--glass-border)'}`,
    borderRadius: 'var(--radius-md)', cursor: 'pointer',
    background: active ? 'rgba(255,193,7,0.15)' : 'rgba(255,255,255,0.03)',
    color: active ? 'var(--color-accent-gold)' : 'var(--text-muted)',
    transition: 'all 0.2s'
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div 
        className="glass-card modal-content" 
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ maxWidth: 500, width: '90%', padding: 'var(--space-6)', border: '1px solid var(--color-accent-gold)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
          <h3 style={{ marginBottom: 'var(--space-1)', fontSize: 'var(--text-2xl)' }}>🚀 Activa tu Quiniela</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{quiniela.nombre}</p>
        </div>

        {/* Selector de método */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: 'var(--space-5)' }}>
          <button type="button" style={tabStyle(metodo === 'pagomovil')} onClick={() => setMetodo('pagomovil')}>
            🇻🇪 Pago Móvil
          </button>
          <button type="button" style={tabStyle(metodo === 'zelle')} onClick={() => setMetodo('zelle')}>
            🇺🇸 Zelle
          </button>
          <button type="button" style={tabStyle(metodo === 'binance')} onClick={() => setMetodo('binance')}>
            🔶 Binance
          </button>
        </div>

        {/* Datos según método */}
        <div style={{ 
          background: 'rgba(255,255,255,0.03)', padding: 'var(--space-4)', 
          borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)',
          marginBottom: 'var(--space-5)'
        }}>
          {metodo === 'pagomovil' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <p style={{ color: 'var(--color-accent-gold)', fontWeight: 800, fontSize: 'var(--text-lg)', margin: '0 0 var(--space-3)', textAlign: 'center' }}>
                Monto: Bs. 6,000
              </p>
              <DataField label="Banco" value="Banesco (0134)" onCopy={() => copyToClipboard('0134', 'Banco')} />
              <DataField label="Nombre" value="Robert Granadillo" onCopy={() => copyToClipboard('Robert Granadillo', 'Nombre')} />
              <DataField label="Cédula" value="15608346" onCopy={() => copyToClipboard('15608346', 'Cédula')} />
              <DataField label="Teléfono destino" value="04140455347" onCopy={() => copyToClipboard('04140455347', 'Teléfono')} />
            </div>
          )}
          {metodo === 'zelle' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <p style={{ color: 'var(--color-accent-gold)', fontWeight: 800, fontSize: 'var(--text-lg)', margin: '0 0 var(--space-3)', textAlign: 'center' }}>
                Monto: $10.00 USD
              </p>
              <DataField label="Zelle — Número de teléfono" value="4482380873" onCopy={() => copyToClipboard('4482380873', 'Zelle')} />
            </div>
          )}
          {metodo === 'binance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <p style={{ color: 'var(--color-accent-gold)', fontWeight: 800, fontSize: 'var(--text-lg)', margin: '0 0 var(--space-3)', textAlign: 'center' }}>
                Monto: 10 USDT
              </p>
              <DataField label="Binance Pay ID" value="82528100" onCopy={() => copyToClipboard('82528100', 'Binance ID')} />
            </div>
          )}
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>{error}</div>}

          {/* Referencia / Transacción */}
          <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="form-label" style={{ fontWeight: 700 }}>
              {esBinance ? '🔢 Número de Transacción' : '🔢 Número de Referencia'}
              <RequiredBadge />
            </label>
            <input 
              type="text" 
              className="form-input" 
              placeholder={esBinance ? 'Ej: 123456789 (ID de la transacción Binance)' : 'Ej: 0099123456 (referencia completa)'}
              value={referencia}
              onChange={e => setReferencia(e.target.value)}
              required
            />
          </div>

          {/* Teléfono de origen — solo Pago Móvil y Zelle */}
          {!esBinance && (
            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="form-label" style={{ fontWeight: 700 }}>
                📱 Teléfono desde donde realizaste el pago
                <RequiredBadge />
              </label>
              <input 
                type="text" 
                className="form-input" 
                placeholder={metodo === 'pagomovil' ? 'Ej: 04141234567' : 'Ej: +13051234567'}
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                required
              />
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {metodo === 'pagomovil' 
                  ? '⚠️ Este dato es necesario para verificar tu pago en el banco.' 
                  : '⚠️ Número de teléfono asociado a tu cuenta Zelle.'}
              </p>
            </div>
          )}

          {/* Aviso */}
          <div style={{ 
            background: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.3)',
            borderRadius: 'var(--radius-md)', padding: 'var(--space-3)',
            marginBottom: 'var(--space-5)', fontSize: '11px', color: 'var(--text-secondary)'
          }}>
            ℹ️ El administrador verificará tu pago y activará tu quiniela en menos de 24 horas.
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-gold" style={{ flex: 2 }} disabled={loading}>
              {loading ? 'Enviando...' : '✅ Reportar Pago'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
