import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminPanelV2 from './v2/AdminPanelV2';
import KanbanBoard from './v2/KanbanBoard';
import SplitAgenda from './v2/SplitAgenda';
import MetricsDashboard from './v2/MetricsDashboard';
import UserManagement from './v2/UserManagement';
import FichaDetalle from './v2/FichaDetalle';

const API_URL = import.meta.env.VITE_API_URL || 'https://sistema-inscripciones.alixitasoler.workers.dev/api';

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    const storedUser = localStorage.getItem('admin_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password })
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        setError(data.error || 'Credenciales incorrectas o error en el servidor');
      }
    } catch (err) {
      console.error("Login error:", err);
      setError('Error al conectar con el servidor (backend).');
    } finally {
      setLoading(false);
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
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ingresa tus credenciales para continuar</p>
          </div>
          
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Usuario</label>
            <input 
              type="text" 
              className={`form-input ${error ? 'input-error' : ''}`}
              placeholder="Ej: admin" 
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Contraseña</label>
            <input 
              type="password" 
              className={`form-input ${error ? 'input-error' : ''}`}
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <div className="form-error" style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{error}</div>}
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={loading}>
            {loading ? 'Verificando...' : 'Ingresar al Panel'}
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
          <Route path="ficha/:id" element={<FichaDetalle token={token} onAuthError={handleLogout} />} />
          <Route path="agenda" element={<SplitAgenda token={token} onAuthError={handleLogout} />} />
          <Route path="metricas" element={<MetricsDashboard token={token} onAuthError={handleLogout} />} />
          <Route path="usuarios" element={<UserManagement token={token} onAuthError={handleLogout} />} />
        </Routes>
      </React.Suspense>
    </AdminPanelV2>
  );
};

export default AdminPanel;
