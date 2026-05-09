import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Eager load critical pages
import Landing from './pages/Landing';
import Groups from './pages/Groups';

// Lazy load non-critical pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const GroupDetail = lazy(() => import('./pages/GroupDetail'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Profile = lazy(() => import('./pages/Profile'));
const SpecialPredictions = lazy(() => import('./pages/SpecialPredictions'));
const Eliminatorias = lazy(() => import('./pages/Eliminatorias'));
const KnockoutPhase = lazy(() => import('./pages/KnockoutPhase'));

function LoadingFallback() {
  return (
    <div className="loading-center" style={{ minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/grupos" element={<Groups />} />
              <Route path="/grupos/:letra" element={<GroupDetail />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/dashboard" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              } />
              <Route path="/perfil" element={
                <ProtectedRoute><Profile /></ProtectedRoute>
              } />
              <Route path="/predicciones" element={
                <ProtectedRoute><SpecialPredictions /></ProtectedRoute>
              } />
              <Route path="/eliminatorias" element={<Eliminatorias />} />
              <Route path="/eliminatorias/:slug" element={
                <ProtectedRoute><KnockoutPhase /></ProtectedRoute>
              } />
              {/* 404 */}
              <Route path="*" element={
                <div style={{ textAlign: 'center', padding: 'var(--space-24)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <h1 style={{ fontSize: 'var(--text-6xl)', color: 'var(--color-accent)' }}>404</h1>
                  <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-4)' }}>Página no encontrada</p>
                </div>
              } />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
