import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminPanelV2 from './v2/AdminPanelV2';
import KanbanBoard from './v2/KanbanBoard';
import SplitAgenda from './v2/SplitAgenda';
import MetricsDashboard from './v2/MetricsDashboard';
import UserManagement from './v2/UserManagement';

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    const storedUser = localStorage.getItem('admin_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      const fakeToken = "token-secreto-123";
      const fakeUser = { nombre: "Directora", rol: "admin" };
      localStorage.setItem('admin_token', fakeToken);
      localStorage.setItem('admin_user', JSON.stringify(fakeUser));
      setToken(fakeToken);
      setUser(fakeUser);
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Contraseña incorrecta');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setIsAuthenticated(false);
    setToken('');
    setUser(null);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-main)' }}>
        <form onSubmit={handleLogin} className="card" style={{ width: '100%', maxWidth: '400px', margin: '1rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ background: 'var(--primary)', width: '60px', height: '60px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: '2rem' }}>C</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Acceso Administrativo</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ingresa tu clave para continuar</p>
          </div>
          
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Contraseña de acceso</label>
            <input 
              type="password" 
              className={`form-input ${error ? 'input-error' : ''}`}
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <div className="form-error">{error}</div>}
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
            Ingresar al Panel
          </button>
        </form>
      </div>
    );
  }

  return (
    <AdminPanelV2 token={token} onAuthError={handleLogout} user={user}>
      <React.Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>}>
        <Routes>
          <Route path="/" element={<KanbanBoard token={token} onAuthError={handleLogout} />} />
          <Route path="/agenda" element={<SplitAgenda token={token} onAuthError={handleLogout} />} />
          <Route path="/metricas" element={<MetricsDashboard token={token} onAuthError={handleLogout} />} />
          <Route path="/usuarios" element={<UserManagement token={token} onAuthError={handleLogout} />} />
        </Routes>
      </React.Suspense>
    </AdminPanelV2>
  );
};

export default AdminPanel;
