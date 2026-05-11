import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuiniela } from '../../context/QuinielaContext';
import PaymentModal from './PaymentModal';

export default function QuinielaManager() {
  const { quinielas, selectedQuiniela, selectQuiniela, createQuiniela, loading, refreshQuinielas } = useQuiniela();
  const [showCreate, setShowCreate] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newNombre.trim()) return;
    setIsCreating(true);
    try {
      await createQuiniela(newNombre);
      setNewNombre('');
      setShowCreate(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="quiniela-manager">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <h4 style={{ margin: 0 }}>📋 Mis Quinielas</h4>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>
            Puedes crear varias quinielas con diferentes predicciones
          </p>
        </div>
        <button 
          className="btn btn-sm btn-gold" 
          onClick={() => setShowCreate(!showCreate)}
        >
          {showCreate ? 'Cancelar' : '+ Nueva Quiniela'}
        </button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <form onSubmit={handleCreate} style={{ 
              background: 'rgba(255,255,255,0.03)', 
              padding: 'var(--space-4)', 
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--glass-border)',
              marginBottom: 'var(--space-6)',
              display: 'flex',
              gap: 'var(--space-3)'
            }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ej: Quiniela Familiar, Oficina, etc."
                value={newNombre}
                onChange={e => setNewNombre(e.target.value)}
                autoFocus
                required
              />
              <button type="submit" className="btn btn-accent" disabled={isCreating}>
                {isCreating ? 'Creando...' : 'Crear'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
        {quinielas.map((q) => (
          <motion.div
            key={q.id}
            onClick={() => selectQuiniela(q)}
            className={`glass-card quiniela-card ${selectedQuiniela?.id === q.id ? 'active' : ''}`}
            style={{ 
              padding: 'var(--space-4)', 
              cursor: 'pointer',
              border: selectedQuiniela?.id === q.id ? '2px solid var(--color-accent)' : '1px solid var(--glass-border)',
              position: 'relative',
              overflow: 'hidden'
            }}
            whileHover={{ y: -2 }}
          >
            {selectedQuiniela?.id === q.id && (
              <div style={{ 
                position: 'absolute', top: 0, right: 0, 
                background: 'var(--color-accent)', color: 'white',
                fontSize: '10px', fontWeight: 800, padding: '2px 8px',
                borderBottomLeftRadius: 'var(--radius-md)', zIndex: 1
              }}>
                SELECCIONADA
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>
                {q.nombre}
              </div>
              <div style={{ 
                fontSize: '9px', padding: '2px 6px', borderRadius: '4px',
                fontWeight: 700, textTransform: 'uppercase',
                background: q.estado === 'pagada' ? 'var(--color-success-bg)' : q.estado === 'pendiente' ? 'var(--color-warning-bg)' : 'rgba(255,255,255,0.05)',
                color: q.estado === 'pagada' ? 'var(--color-success)' : q.estado === 'pendiente' ? 'var(--color-warning)' : 'var(--text-muted)',
                border: `1px solid ${q.estado === 'pagada' ? 'var(--color-success)' : q.estado === 'pendiente' ? 'var(--color-warning)' : 'var(--glass-border)'}`
              }}>
                {q.estado === 'borrador' ? 'No participa' : q.estado === 'pendiente' ? 'Pendiente' : 'Activa'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                {new Date(q.created_at).toLocaleDateString()}
              </span>
              <span style={{ 
                fontWeight: 800, color: 'var(--color-accent-gold)',
                fontSize: 'var(--text-lg)'
              }}>
                {q.puntos_totales} pts
              </span>
            </div>

            {q.estado === 'borrador' && (
              <button 
                className="btn btn-sm btn-gold" 
                style={{ width: '100%' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setPaymentTarget(q);
                }}
              >
                💳 Activar Quiniela
              </button>
            )}
            {q.estado === 'pendiente' && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning)', textAlign: 'center', fontStyle: 'italic' }}>
                Verificando pago...
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {quinielas.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--text-muted)' }}>
          Aún no tienes ninguna quiniela. ¡Crea la primera!
        </div>
      )}

      {paymentTarget && (
        <PaymentModal 
          quiniela={paymentTarget} 
          onClose={() => setPaymentTarget(null)} 
          onSuccess={() => {
            setPaymentTarget(null);
            refreshQuinielas();
          }}
        />
      )}
    </div>
  );
}
