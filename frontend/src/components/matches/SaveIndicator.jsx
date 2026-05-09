import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SaveIndicator — Muestra el estado de guardado con animaciones.
 * Estados: idle | saving | saved | error
 */
export default function SaveIndicator({ status, completados, total }) {
  return (
    <div className="save-indicator-bar">
      <div className="save-indicator-left">
        <div className="save-progress-info">
          <span className="save-progress-label">
            ⚽ Pronósticos: <strong>{completados}</strong> / {total}
          </span>
          <div className="progress-bar-container" style={{ width: 120, height: 6 }}>
            <div
              className="progress-bar-fill"
              style={{ width: `${total ? (completados / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status === 'saving' && (
          <motion.div
            key="saving"
            className="save-status save-status-saving"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            <span>Guardando...</span>
          </motion.div>
        )}

        {status === 'saved' && (
          <motion.div
            key="saved"
            className="save-status save-status-saved"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" style={{ strokeDasharray: 100, animation: 'checkDraw 0.5s ease forwards' }} />
            </svg>
            <span>¡Guardado!</span>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            key="error"
            className="save-status save-status-error"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
          >
            ⚠️ Error al guardar
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
