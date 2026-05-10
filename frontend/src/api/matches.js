import api from './client';

export const equiposAPI = {
  list: (params) => api.get('/equipos/', { params }),
  get: (id) => api.get(`/equipos/${id}/`),
};

export const gruposAPI = {
  list: () => api.get('/grupos/'),
  get: (letra) => api.get(`/grupos/${letra}/`),
  partidos: (letra) => api.get(`/grupos/${letra}/partidos/`),
};

export const fasesAPI = {
  list: () => api.get('/fases/'),
  get: (slug) => api.get(`/fases/${slug}/`),
  partidos: (slug) => api.get(`/fases/${slug}/partidos/`),
};

export const partidosAPI = {
  list: (params) => api.get('/partidos/', { params }),
  get: (id) => api.get(`/partidos/${id}/`),
};

export const jugadoresAPI = {
  list: (params) => api.get('/jugadores/', { params }),
};

export const pronosticosAPI = {
  listPartidos: () => api.get('/pronosticos/partidos/'),
  savePartido: (data) => api.post('/pronosticos/partidos/', data),
  bulkSave: (pronosticos) => api.post('/pronosticos/partidos/bulk/', { pronosticos }),
  resumen: () => api.get('/pronosticos/partidos/resumen/'),
  getTorneo: () => api.get('/pronosticos/torneo/'),
  saveTorneo: (data) => api.post('/pronosticos/torneo/', data),
};

export const leaderboardAPI = {
  list: () => api.get('/leaderboard/'),
  miPosicion: () => api.get('/leaderboard/mi-posicion/'),
};

export const adminAPI = {
  fases: () => api.get('/admin/fases/'),
  usuarios: () => api.get('/auth/admin/users/'),
  activarFase: (slug) => api.post(`/admin/fases/${slug}/activar/`),
  bloquearFase: (slug) => api.post(`/admin/fases/${slug}/bloquear/`),
  desactivarFase: (slug) => api.post(`/admin/fases/${slug}/desactivar/`),
  cargarResultado: (id, goles_local, goles_visitante, estado = 'finalizado') => 
    api.patch(`/admin/partidos/${id}/resultado/`, { goles_local, goles_visitante, estado }),
};

