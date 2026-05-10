import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const navLinks = [
    { to: '/grupos', label: '⚽ Grupos' },
    { to: '/eliminatorias', label: '🏟️ Eliminatorias' },
    { to: '/leaderboard', label: '🏆 Ranking' },
    ...(user ? [
      { to: '/predicciones', label: '🌟 Predicciones' },
      { to: '/dashboard', label: '📊 Mi Panel' },
    ] : []),
    ...(user?.is_admin ? [
      { to: '/admin-panel', label: '🔧 Admin' },
    ] : []),
  ];

  return (
    <motion.nav
      className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.container}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>⚽</span>
          <span className={styles.logoText}>Quiniela</span>
          <span className={styles.logoAccent}>2026</span>
        </Link>

        {/* Desktop Nav */}
        <div className={styles.desktopNav}>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`${styles.navLink} ${location.pathname === link.to ? styles.active : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth Actions */}
        <div className={styles.actions}>
          {user ? (
            <div className={styles.userMenu}>
              <Link to="/perfil" className={styles.avatar}>
                {user.avatar_url
                  ? <img src={user.avatar_url} alt={user.username} />
                  : <span>{user.username?.[0]?.toUpperCase() || '?'}</span>
                }
              </Link>
              <button onClick={logout} className="btn btn-ghost btn-sm">
                Salir
              </button>
            </div>
          ) : (
            <div className={styles.authBtns}>
              <Link to="/login" className="btn btn-ghost btn-sm">Entrar</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Regístrate</Link>
            </div>
          )}

          {/* Hamburger */}
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menú"
          >
            <span className={menuOpen ? styles.barOpen : ''}></span>
            <span className={menuOpen ? styles.barOpen : ''}></span>
            <span className={menuOpen ? styles.barOpen : ''}></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className={styles.mobileMenu}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className={styles.mobileLink}>
                {link.label}
              </Link>
            ))}
            {user ? (
              <button onClick={logout} className={styles.mobileLink}>🚪 Cerrar sesión</button>
            ) : (
              <>
                <Link to="/login" className={styles.mobileLink}>Entrar</Link>
                <Link to="/register" className={styles.mobileLink}>Regístrate</Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
