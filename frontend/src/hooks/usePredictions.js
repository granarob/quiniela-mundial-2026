import { useState, useCallback, useRef, useEffect } from 'react';
import { pronosticosAPI } from '../api/matches';

/**
 * Hook para gestionar pronósticos con auto-save debounce.
 * @param {Array} partidos — lista de partidos del grupo/fase
 * @returns {{ predictions, setPrediction, saveStatus, saveAll, isSaving }}
 */
export default function usePredictions(partidos = []) {
  // { [partidoId]: { goles_local_pred, goles_visitante_pred, saved, dirty } }
  const [predictions, setPredictions] = useState({});
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [isSaving, setIsSaving] = useState(false);
  const debounceTimers = useRef({});
  const mountedRef = useRef(true);

  // Cargar pronósticos existentes del usuario al montar
  useEffect(() => {
    mountedRef.current = true;
    loadExisting();
    return () => {
      mountedRef.current = false;
      // Limpiar timers
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, [partidos]);

  async function loadExisting() {
    try {
      const res = await pronosticosAPI.listPartidos();
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
      // Si no está autenticado, no cargar nada
    }
  }

  // Actualizar un pronóstico (llama auto-save con debounce de 2s)
  const setPrediction = useCallback((partidoId, field, value) => {
    const numVal = value === '' ? '' : Math.max(0, Math.min(99, parseInt(value) || 0));

    setPredictions(prev => {
      const current = prev[partidoId] || { goles_local_pred: '', goles_visitante_pred: '', saved: false, dirty: false };
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

    // Auto-save con debounce
    if (debounceTimers.current[partidoId]) {
      clearTimeout(debounceTimers.current[partidoId]);
    }

    debounceTimers.current[partidoId] = setTimeout(() => {
      autoSaveSingle(partidoId);
    }, 2000);
  }, []);

  // Guardar un solo pronóstico
  async function autoSaveSingle(partidoId) {
    setPredictions(prev => {
      const p = prev[partidoId];
      if (!p || p.goles_local_pred === '' || p.goles_visitante_pred === '') return prev;

      // Disparar el save
      setSaveStatus('saving');
      setIsSaving(true);

      pronosticosAPI.savePartido({
        partido: partidoId,
        goles_local_pred: p.goles_local_pred,
        goles_visitante_pred: p.goles_visitante_pred,
      }).then(() => {
        if (mountedRef.current) {
          setPredictions(pp => ({
            ...pp,
            [partidoId]: { ...pp[partidoId], saved: true, dirty: false },
          }));
          setSaveStatus('saved');
          setTimeout(() => {
            if (mountedRef.current) setSaveStatus('idle');
          }, 2000);
        }
      }).catch(() => {
        if (mountedRef.current) setSaveStatus('error');
      }).finally(() => {
        if (mountedRef.current) setIsSaving(false);
      });

      return prev;
    });
  }

  // Guardar todos los pronósticos pendientes (dirty) de una vez
  const saveAll = useCallback(async () => {
    const dirtyList = Object.entries(predictions)
      .filter(([, p]) => p.dirty && p.goles_local_pred !== '' && p.goles_visitante_pred !== '')
      .map(([partidoId, p]) => ({
        partido: parseInt(partidoId),
        goles_local_pred: p.goles_local_pred,
        goles_visitante_pred: p.goles_visitante_pred,
      }));

    if (dirtyList.length === 0) return;

    setSaveStatus('saving');
    setIsSaving(true);

    try {
      await pronosticosAPI.bulkSave(dirtyList);
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
    } catch {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [predictions]);

  // Contadores
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
