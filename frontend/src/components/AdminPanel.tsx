import React, { useState, useEffect } from 'react';
import AdminPanelV2 from './v2/AdminPanelV2';

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);

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
    const fakeToken = "token-secreto-123";
    const fakeUser = { nombre: "Admin", rol: "superadmin" };
    localStorage.setItem('admin_token', fakeToken);
    localStorage.setItem('admin_user', JSON.stringify(fakeUser));
    setToken(fakeToken);
    setUser(fakeUser);
    setIsAuthenticated(true);
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <form onSubmit={handleLogin} className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Acceso Administrativo</h2>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition">Entrar</button>
        </form>
      </div>
    );
  }

  // FIX: Agregamos children={null} para cumplir con AdminPanelV2Props
  return <AdminPanelV2 token={token} onAuthError={handleLogout} user={user} children={null} />;
};

export default AdminPanel;
