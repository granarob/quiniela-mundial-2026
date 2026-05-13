import React, { memo } from 'react';
import { motion } from 'framer-motion';
import ScoreInput from './ScoreInput';

/**
 * MatchCard — Partido con inputs de pronóstico integrados.
 * Layout: [Bandera] Equipo [__]-[__] Equipo [Bandera]
 */
const MatchCard = memo(function MatchCard({
  partido,
  prediction,
  onSetPrediction,
  isLocked = false,
  index = 0,
}) {
  const { equipo_local, equipo_visitante, fecha_hora, sede, ciudad, resultado_cargado, goles_local, goles_visitante } = partido;

  const pred = prediction || { goles_local_pred: '', goles_visitante_pred: '' };
  const hasResult = resultado_cargado;

  // Calcular puntos si el resultado ya fue cargado
  let puntosDisplay = null;
  if (hasResult && pred.puntos_ganados !== undefined) {
    puntosDisplay = pred.puntos_ganados;
  }

  // Estado visual del pronóstico
  const isSaved = prediction?.saved;
  const isDirty = prediction?.dirty;

  // Ref para el timer de auto-salto
  const jumpTimer = React.useRef(null);

  const handleLocalComplete = (val) => {
    if (jumpTimer.current) clearTimeout(jumpTimer.current);
    
    // Si ya puso 2 dígitos, saltar de inmediato
    if (val.length >= 2) {
      document.getElementById(`pred-visit-${partido.id}`)?.focus();
    } else if (val.length === 1) {
      // Si puso 1 dígito, esperar un momento por si quiere poner otro
      jumpTimer.current = setTimeout(() => {
        const nextInput = document.getElementById(`pred-visit-${partido.id}`);
        // Solo saltar si el foco sigue en el input original (opcional, pero más seguro)
        if (document.activeElement?.id === `pred-local-${partido.id}`) {
          nextInput?.focus();
          nextInput?.select(); // Seleccionar para facilitar sobrescribir
        }
      }, 700);
    }
  };

  React.useEffect(() => {
    return () => {
      if (jumpTimer.current) clearTimeout(jumpTimer.current);
    };
  }, []);

  return (
    <motion.div
      className={`match-card glass-card ${hasResult ? 'match-card-finished' : ''} ${isSaved && !isDirty ? 'match-card-saved' : ''}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      {/* Header: fecha y estado */}
      <div className="match-card-header">
        <span className="match-date">
          {new Date(fecha_hora).toLocaleString(undefined, {
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true
          })}
        </span>
        {hasResult && (
          <span className="badge badge-done">✅ Final</span>
        )}
        {!hasResult && isSaved && !isDirty && (
          <span className="badge badge-open">💾 Guardado</span>
        )}
        {!hasResult && isDirty && (
          <span className="badge badge-warning">⏳ Sin guardar</span>
        )}
      </div>

      {/* Main: equipos + scores */}
      <div className="match-card-body">
        {/* Equipo Local */}
        <div className="match-team match-team-local">
          {equipo_local?.bandera_url && (
            <img
              src={equipo_local.bandera_url}
              alt={equipo_local.nombre}
              className="match-flag"
            />
          )}
          <span className="match-team-name">{equipo_local?.nombre || 'TBD'}</span>
        </div>

        {/* Scores */}
        <div className="match-scores">
          {hasResult ? (
            <>
              {/* Resultado real */}
              <div className="match-result-real">
                <span className="result-number">{goles_local}</span>
                <span className="result-separator">-</span>
                <span className="result-number">{goles_visitante}</span>
              </div>
              {/* Pronóstico del usuario (debajo) */}
              {pred.goles_local_pred !== '' && pred.goles_visitante_pred !== '' && (
                <div className="match-result-prediction">
                  <span className="prediction-label">Tu pick:</span>
                  <span className="prediction-values">
                    {pred.goles_local_pred} - {pred.goles_visitante_pred}
                  </span>
                  {puntosDisplay !== null && (
                    <span className={`prediction-points ${puntosDisplay > 0 ? 'points-positive' : 'points-zero'}`}>
                      {puntosDisplay > 0 ? `+${puntosDisplay} pts` : '0 pts'}
                    </span>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Inputs de pronóstico */}
              <ScoreInput
                id={`pred-local-${partido.id}`}
                value={pred.goles_local_pred}
                onChange={(val) => onSetPrediction(partido.id, 'goles_local_pred', val)}
                onComplete={handleLocalComplete}
                disabled={isLocked}
              />
              <span className="score-separator">-</span>
              <ScoreInput
                id={`pred-visit-${partido.id}`}
                value={pred.goles_visitante_pred}
                onChange={(val) => onSetPrediction(partido.id, 'goles_visitante_pred', val)}
                disabled={isLocked}
              />
            </>
          )}
        </div>

        {/* Equipo Visitante */}
        <div className="match-team match-team-visit">
          <span className="match-team-name">{equipo_visitante?.nombre || 'TBD'}</span>
          {equipo_visitante?.bandera_url && (
            <img
              src={equipo_visitante.bandera_url}
              alt={equipo_visitante.nombre}
              className="match-flag"
            />
          )}
        </div>
      </div>

      {/* Footer: sede */}
      {(sede || ciudad) && (
        <div className="match-card-footer">
          🏟️ {sede}{sede && ciudad ? ' — ' : ''}{ciudad}
        </div>
      )}
    </motion.div>
  );
});

export default MatchCard;
