import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  BarChart3
} from 'lucide-react';
import KanbanBoard from './KanbanBoard';
import SplitAgenda from './SplitAgenda';
import MetricsDashboard from './MetricsDashboard';
import UserManagement from './UserManagement';

interface AdminPanelV2Props {
  token: string;
  onAuthError: () => void;
  user: any;
}

const AdminPanelV2: React.FC<AdminPanelV2Props> = ({ token, onAuthError, user }) => {

  return (
    <div className="v2-layout animate-in">
      <style>{`
        .v2-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          min-height: calc(100vh - var(--header-height) - 4rem);
          gap: 0;
          background: white;
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border-color);
        }

        .v2-sidebar {
          background: #f8fafc;
          border-right: 1px solid var(--border-color);
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .v2-sidebar-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .v2-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex-grow: 1;
        }

        .v2-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          color: var(--text-muted);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }

        .v2-nav-item:hover {
          background: white;
          color: var(--primary);
          box-shadow: var(--shadow-sm);
        }

        .v2-nav-item.active {
          background: white;
          color: var(--primary);
          box-shadow: var(--shadow-md);
          border-left: 4px solid var(--accent);
        }

        .v2-nav-group {
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.1em;
          padding: 0.5rem 1rem;
          margin-top: 0.5rem;
        }

        .v2-user-profile {
          margin-top: auto;
          padding: 1.25rem;
          background: white;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .v2-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 0.8rem;
        }

        .v2-user-info {
          overflow: hidden;
        }

        .v2-user-name {
          font-weight: 700;
          font-size: 0.8rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .v2-user-role {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-transform: capitalize;
        }

        .v2-content {
          padding: 2.5rem;
          overflow-y: auto;
          max-height: calc(100vh - var(--header-height) - 4rem);
          background: #ffffff;
        }

        .v2-badge-beta {
          background: linear-gradient(45deg, var(--accent), #f59e0b);
          color: white;
          font-size: 0.65rem;
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
          font-weight: 800;
          text-transform: uppercase;
        }
      `}</style>

      <aside className="v2-sidebar">
        <div className="v2-sidebar-header">
          <div style={{ background: 'var(--primary)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>C</div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>La Cecilia <span className="v2-badge-beta">Panel Pro</span></div>
        </div>

        <nav className="v2-nav">
          <div className="v2-nav-group">Gestión de Admisión</div>
          <NavLink to="/admin" end className={({ isActive }) => `v2-nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} /> Bandeja de Solicitudes
          </NavLink>
          <NavLink to="/admin/agenda" className={({ isActive }) => `v2-nav-item ${isActive ? 'active' : ''}`}>
            <CalendarDays size={20} /> Agenda Dividida
          </NavLink>
          
          <div className="v2-nav-group" style={{ marginTop: '1.5rem' }}>Administración</div>
          <NavLink to="/admin/metricas" className={({ isActive }) => `v2-nav-item ${isActive ? 'active' : ''}`}>
            <BarChart3 size={20} /> Métricas e Historial
          </NavLink>
          <NavLink to="/admin/usuarios" className={({ isActive }) => `v2-nav-item ${isActive ? 'active' : ''}`}>
            <Users size={20} /> Gestión de Equipo
          </NavLink>
        </nav>

        <div className="v2-user-profile">
          <div className="v2-avatar">{user?.nombre?.charAt(0) || 'U'}</div>
          <div className="v2-user-info" style={{ flex: 1 }}>
            <div className="v2-user-name">{user?.nombre}</div>
            <div className="v2-user-role">{user?.rol}</div>
          </div>
          <button 
            className="btn btn-ghost" 
            onClick={onAuthError} 
            title="Cerrar Sesión"
            style={{ padding: '0.5rem', color: 'var(--error)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </aside>

      <main className="v2-content">
        <Routes>
          <Route path="/" element={<KanbanBoard token={token} onAuthError={onAuthError} />} />
          <Route path="/agenda" element={<SplitAgenda token={token} onAuthError={onAuthError} />} />
          <Route path="/metricas" element={<MetricsDashboard token={token} onAuthError={onAuthError} />} />
          <Route path="/usuarios" element={<UserManagement token={token} onAuthError={onAuthError} />} />
          <Route path="/config" element={<div><h1 style={{marginBottom: '1rem'}}>Configuración</h1><p style={{color:'var(--text-muted)'}}>Ajustes globales del sistema de inscripciones.</p></div>} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminPanelV2;
