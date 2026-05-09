import React from 'react';
import { motion } from 'framer-motion';
import useCountdown from '../../hooks/useCountdown';

/**
 * CountdownTimer — Cuenta regresiva estilo flip-clock.
 * Se bloquea con overlay cuando llega a 0.
 */
export default function CountdownTimer({ targetDate, label = 'Cierre de pronósticos' }) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate);

  if (!targetDate) return null;

  // Hora local legible del cierre (se convierte automáticamente a la zona del navegador)
  const cierreLocal = new Date(targetDate).toLocaleString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  if (isExpired) {
    return (
      <motion.div
        className="countdown-container countdown-expired"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="countdown-lock-icon">
          <motion.span
            animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            style={{ display: 'inline-block', fontSize: '2rem' }}
          >
            🔒
          </motion.span>
        </div>
        <span className="countdown-expired-text">Pronósticos cerrados</span>
      </motion.div>
    );
  }

  const segments = [
    { value: days, label: 'Días' },
    { value: hours, label: 'Hrs' },
    { value: minutes, label: 'Min' },
    { value: seconds, label: 'Seg' },
  ];

  const isUrgent = days === 0 && hours < 6;

  return (
    <div className={`countdown-container ${isUrgent ? 'countdown-urgent' : ''}`}>
      <span className="countdown-label">{label}</span>
      <div className="countdown-segments">
        {segments.map(({ value, label: segLabel }, i) => (
          <div key={segLabel} className="countdown-segment">
            <motion.div
              className="countdown-number"
              key={value}
              initial={{ rotateX: -90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {String(value).padStart(2, '0')}
            </motion.div>
            <span className="countdown-seg-label">{segLabel}</span>
          </div>
        ))}
      </div>
      {/* Hora local exacta de cierre — elimina confusión de zonas horarias */}
      <p className="countdown-local-time">
        📅 Se cierra: <strong>{cierreLocal}</strong>
      </p>
    </div>
  );
}
