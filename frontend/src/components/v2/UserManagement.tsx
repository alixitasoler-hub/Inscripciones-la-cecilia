import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Shield, 
  Key, 
  Trash2, 
  Edit3
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://sistema-inscripciones.alixitasoler.workers.dev/api';

interface UserManagementProps {
  token: string;
  onAuthError: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ token, onAuthError }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState<any | null>(null);
  const [formData, setFormData] = useState({ usuario: '', password: '', nombre: '', rol: 'admin' });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/usuarios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        onAuthError();
        return;
      }
      if (!res.ok) throw new Error('Backend failed');
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      console.error('Error fetching users, cargando datos de prueba:', e);
      setUsers([
        { id: 1, nombre: 'Directora', usuario: 'admin', rol: 'superadmin', activo: true },
        { id: 2, nombre: 'Recepción Principal', usuario: 'recepcion', rol: 'recepcion', activo: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.usuario || (!editMode && !formData.password)) return alert('Usuario y contraseña obligatorios');
    
    setSaving(true);
    const url = editMode ? `${API_URL}/admin/usuarios/${editMode.id}` : `${API_URL}/admin/usuarios`;
    const method = editMode ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.status === 401) {
        onAuthError();
        return;
      }
      if (res.ok) {
        setFormData({ usuario: '', password: '', nombre: '', rol: 'admin' });
        setEditMode(null);
        fetchUsers();
      } else {
        const err = await res.json() as any;
        alert(err.error);
      }
    } catch (e) {
      alert('Error al procesar solicitud');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (u: any) => {
    try {
      const res = await fetch(`${API_URL}/admin/usuarios/${u.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ activo: !u.activo })
      });
      if (res.status === 401) {
        onAuthError();
        return;
      }
      fetchUsers();
    } catch (e) { alert('Error'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este usuario permanentemente?')) return;
    try {
      const res = await fetch(`${API_URL}/admin/usuarios/${id}`, { 
        method: 'DELETE', 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.status === 401) {
        onAuthError();
        return;
      }
      fetchUsers();
    } catch (e) { alert('Error'); }
  };

  return (
    <div className="users-v2-container animate-in">
      <style>{`
        .users-v2-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .users-layout {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 2rem;
        }

        .user-form-card {
          background: white;
          padding: 1.25rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-md);
          height: fit-content;
          position: sticky;
          top: 1rem;
        }

        .user-list-card {
          background: white;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }

        .user-row {
          display: grid;
          grid-template-columns: 32px 1fr 100px 80px auto;
          align-items: center;
          gap: 1rem;
          padding: 0.6rem 1rem;
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.2s;
        }

        .user-row:last-child { border-bottom: none; }
        .user-row:hover { background: #f8fafc; }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--primary-soft);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.8rem;
        }

        .status-pill {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          text-transform: uppercase;
          cursor: pointer;
          border: none;
        }

        .status-active { background: #f0fdf4; color: #15803d; }
        .status-inactive { background: #fef2f2; color: #b91c1c; }

        .role-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          background: #f1f5f9;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }
      `}</style>

      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Gestión de Equipo</h1>
        <p style={{ color: 'var(--text-muted)' }}>Administre los accesos y niveles de permiso del personal escolar.</p>
      </div>

      <div className="users-layout">
        <aside>
          <div className="user-form-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.5rem', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: '10px' }}>
                <UserPlus size={20} />
              </div>
              <h3 style={{ margin: 0 }}>{editMode ? 'Editar Usuario' : 'Nuevo Integrante'}</h3>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre Completo</label>
                <input 
                  className="form-input" 
                  value={formData.nombre} 
                  onChange={e => setFormData({...formData, nombre: e.target.value})} 
                  placeholder="Ej: Ana Clara Pérez" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Usuario de Acceso</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>@</span>
                  <input 
                    className="form-input" 
                    style={{ paddingLeft: '2rem' }}
                    value={formData.usuario} 
                    onChange={e => setFormData({...formData, usuario: e.target.value})} 
                    placeholder="usuario" 
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña {editMode && '(dejar en blanco si no cambia)'}</label>
                <div style={{ position: 'relative' }}>
                  <Key size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="password"
                    className="form-input" 
                    style={{ paddingLeft: '2.25rem' }}
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Rol y Permisos</label>
                <select className="form-select" value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value})}>
                  <option value="admin">Administrador (Gestión)</option>
                  <option value="superadmin">Superadmin (Todo el sistema)</option>
                  <option value="recepcion">Recepción (Solo lectura)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? 'Procesando...' : (editMode ? 'Guardar Cambios' : 'Crear Usuario')}
                </button>
                {editMode && (
                  <button type="button" className="btn btn-outline" onClick={() => { setEditMode(null); setFormData({ usuario: '', password: '', nombre: '', rol: 'admin' }); }}>
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </aside>

        <main>
          <div className="user-list-card">
            <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Lista de Usuarios</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{users.length} usuarios registrados</span>
            </div>

            <div className="user-list">
              {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando equipo...</div>
              ) : (
                users.map(u => (
                  <div key={u.id} className="user-row" style={{ opacity: u.activo ? 1 : 0.6 }}>
                    <div className="user-avatar">{u.nombre?.[0] || u.usuario?.[0]}</div>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--secondary)' }}>{u.nombre}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{u.usuario}</div>
                    </div>
                    <div>
                      <span className="role-badge">
                        <Shield size={12} /> {u.rol}
                      </span>
                    </div>
                    <div>
                      <button 
                        onClick={() => handleToggleStatus(u)}
                        className={`status-pill ${u.activo ? 'status-active' : 'status-inactive'}`}
                      >
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="action-btn" onClick={() => {
                        setEditMode(u);
                        setFormData({ usuario: u.usuario, password: '', nombre: u.nombre || '', rol: u.rol });
                      }}>
                        <Edit3 size={16} />
                      </button>
                      <button className="action-btn" style={{ color: 'var(--error)' }} onClick={() => handleDelete(u.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserManagement;
