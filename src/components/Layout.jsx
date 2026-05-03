import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <Navbar />
      <main className="animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
