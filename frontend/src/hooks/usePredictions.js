import { useState, useCallback, useRef, useEffect } from 'react';
import { pronosticosAPI } from '../api/matches';
import { useQuiniela } from '../context/QuinielaContext';

/**
 * Hook optimizado para gestionar pronósticos con auto-save global.
 * @param {Array} partidos — lista de partidos del grupo/fase
 * @returns {{ predictions, setPrediction, saveStatus, saveAll, isSaving, completados, total }}
 */
export default function usePredictions(partidos = []) {
  const { selectedQuiniela } = useQuiniela();
  const quinielaId = selectedQuiniela?.id;

  const [predictions, setPredictions] = useState({});
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [isSaving, setIsSaving] = useState(false);
  
  const globalTimer = useRef(null);
  const mountedRef = useRef(true);
  
  // Referencia actualizada para que saveAll siempre vea los últimos datos sin recrearse
  const predictionsRef = useRef({});
  useEffect(() => {
    predictionsRef.current = predictions;
  }, [predictions]);

  useEffect(() => {
    mountedRef.current = true;
    if (quinielaId) {
      loadExisting();
    } else {
      setPredictions({});
    }
    return () => {
      mountedRef.current = false;
      if (globalTimer.current) clearTimeout(globalTimer.current);
    };
  }, [partidos, quinielaId]);

  async function loadExisting() {
    if (!quinielaId) return;
    try {
      const res = await pronosticosAPI.listPartidos(quinielaId);
      const list = res.data.results || res.data;
      const map = {};
      list.forEach(p => {
        map[p.partido] = {
          goles_local_pred: p.goles_local_pred,
          goles_visitante_pred: p.goles_visitante_pred,
          puntos_ganados: p.puntos_ganados,
          saved: true,
          dirty: false,
        };
      });
      if (mountedRef.current) setPredictions(map);
    } catch {
      // Error silencioso (ej. no autenticado)
    }
  }

  // Guardar todos los cambios pendientes (bulk)
  const saveAll = useCallback(async () => {
    const currentPredictions = predictionsRef.current;
    const dirtyList = Object.entries(currentPredictions)
      .filter(([, p]) => p.dirty && p.goles_local_pred !== '' && p.goles_visitante_pred !== '')
      .map(([partidoId, p]) => ({
        partido: parseInt(partidoId),
        goles_local_pred: p.goles_local_pred,
        goles_visitante_pred: p.goles_visitante_pred,
      }));

    if (dirtyList.length === 0 || !quinielaId) return;

    if (mountedRef.current) {
      setSaveStatus('saving');
      setIsSaving(true);
    }

    try {
      await pronosticosAPI.bulkSave(quinielaId, dirtyList);
      if (mountedRef.current) {
        setPredictions(prev => {
          const next = { ...prev };
          dirtyList.forEach(({ partido }) => {
            if (next[partido]) {
              next[partido] = { ...next[partido], saved: true, dirty: false };
            }
          });
          return next;
        });
        setSaveStatus('saved');
        setTimeout(() => {
          if (mountedRef.current) setSaveStatus('idle');
        }, 2000);
      }
    } catch (err) {
      if (mountedRef.current) setSaveStatus('error');
    } finally {
      if (mountedRef.current) setIsSaving(false);
    }
  }, [quinielaId]);

  // Actualizar un pronóstico con debounce GLOBAL
  const setPrediction = useCallback((partidoId, field, value) => {
    const numVal = value === '' ? '' : Math.max(0, Math.min(99, parseInt(value) || 0));

    setPredictions(prev => {
      const current = prev[partidoId] || { goles_local_pred: '', goles_visitante_pred: '', saved: false, dirty: false };
      // Solo marcar como dirty si el valor realmente cambió
      if (current[field] === numVal) return prev;

      return {
        ...prev,
        [partidoId]: {
          ...current,
          [field]: numVal,
          dirty: true,
          saved: false,
        },
      };
    });

    // Reiniciar el temporizador global de auto-guardado
    if (globalTimer.current) clearTimeout(globalTimer.current);
    globalTimer.current = setTimeout(() => {
      saveAll();
    }, 1500); // 1.5 segundos de inactividad para guardar todo
  }, [saveAll]);

  // Contadores para UI
  const partidoIds = partidos.map(p => p.id);
  const completados = partidoIds.filter(id => {
    const p = predictions[id];
    return p && p.goles_local_pred !== '' && p.goles_visitante_pred !== '';
  }).length;

  return {
    predictions,
    setPrediction,
    saveStatus,
    saveAll,
    isSaving,
    completados,
    total: partidos.length,
  };
}
