import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 'var(--navbar-height)', flex: 1 }}>
        {children}
      </main>
      <Footer />
    </>
  );
}
