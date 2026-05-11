import React, { createContext, useContext, useState, useEffect } from 'react';
import { quinielasAPI } from '../api/matches';
import { useAuth } from './AuthContext';

const QuinielaContext = createContext(null);

export function QuinielaProvider({ children }) {
  const { user, token } = useAuth();
  const [quinielas, setQuinielas] = useState([]);
  const [selectedQuiniela, setSelectedQuiniela] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && token) {
      loadQuinielas();
    } else {
      setQuinielas([]);
      setSelectedQuiniela(null);
    }
  }, [user, token]);

  async function loadQuinielas() {
    setLoading(true);
    try {
      const res = await quinielasAPI.list();
      setQuinielas(res.data);
      
      // Intentar recuperar la última quiniela seleccionada de localStorage
      const savedId = localStorage.getItem('selected_quiniela_id');
      if (savedId && res.data.find(q => q.id === parseInt(savedId))) {
        setSelectedQuiniela(res.data.find(q => q.id === parseInt(savedId)));
      } else if (res.data.length > 0) {
        // Por defecto la primera
        selectQuiniela(res.data[0]);
      }
    } catch (err) {
      console.error("Error cargando quinielas", err);
    } finally {
      setLoading(false);
    }
  }

  function selectQuiniela(quiniela) {
    setSelectedQuiniela(quiniela);
    if (quiniela) {
      localStorage.setItem('selected_quiniela_id', quiniela.id);
    } else {
      localStorage.removeItem('selected_quiniela_id');
    }
  }

  async function createQuiniela(nombre) {
    const res = await quinielasAPI.create(nombre);
    const newQ = res.data;
    setQuinielas(prev => [newQ, ...prev]);
    selectQuiniela(newQ);
    return newQ;
  }

  return (
    <QuinielaContext.Provider value={{ 
      quinielas, 
      selectedQuiniela, 
      loading, 
      selectQuiniela, 
      createQuiniela,
      refreshQuinielas: loadQuinielas 
    }}>
      {children}
    </QuinielaContext.Provider>
  );
}

export function useQuiniela() {
  const context = useContext(QuinielaContext);
  if (!context) {
    throw new Error('useQuiniela debe usarse dentro de QuinielaProvider');
  }
  return context;
}
