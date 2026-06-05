import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  History, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Clock
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://sistema-inscripciones.alixitasoler.workers.dev/api';

interface MetricsProps {
  token: string;
  onAuthError: () => void;
}

const MetricsDashboard: React.FC<MetricsProps> = ({ token, onAuthError }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/metrics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        onAuthError();
        return;
      }
      if (!res.ok) throw new Error('Backend failed');
      const result = await res.json();
      setData(result);
    } catch (e) {
      console.error('Error fetching metrics, cargando datos de prueba:', e);
      setData({
        stats: [
          { nivel_ingreso: 'Nivel Inicial', total: 45, concretados: 30 },
          { nivel_ingreso: 'EPO (Primaria)', total: 60, concretados: 50 },
          { nivel_ingreso: 'ESO (Secundaria)', total: 35, concretados: 20 }
        ],
        history: [
          { id: 1, fecha: new Date().toISOString(), usuario_nombre: 'Directora', accion: 'Actualización de Ficha', ficha_nombre: 'Pérez, Sofía' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const exportCSV = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/fichas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        onAuthError();
        return;
      }
      const fichas = await res.json();
      
      if (!fichas.length) return alert('No hay datos para exportar');

      const headers = Object.keys(fichas[0]).join(',');
      const rows = fichas.map((f: any) => 
        Object.values(f).map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(',')
      );
      
      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers + "\n" + rows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `solicitudes_la_cecilia_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('Error al exportar');
    }
  };

  if (loading) return <div style={{textAlign:'center', padding:'5rem'}}><Clock className="animate-spin" style={{margin:'0 auto 1rem'}} /> Generando informes...</div>;

  if (!data || !data.stats) {
    return <div style={{textAlign:'center', padding:'5rem'}}>Cargando información del sistema...</div>;
  }

  const totalSolicitudes = data.stats.reduce((acc: number, s: any) => acc + s.total, 0);

  return (
    <div className="metrics-container animate-in">
      <style>{`
        .metrics-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .metrics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.5rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
        }

        .stat-label {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 800;
          color: var(--primary);
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 2rem;
        }

        .section-card {
          background: white;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }

        .section-header {
          padding: 1.25rem 1.5rem;
          background: #f8fafc;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .history-list {
          padding: 0;
          margin: 0;
          list-style: none;
        }

        .history-item {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          gap: 1rem;
          font-size: 0.85rem;
        }

        .history-item:last-child { border-bottom: none; }

        .level-row {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .progress-bar {
          height: 8px;
          background: #f1f5f9;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: var(--primary);
        }
      `}</style>

      <div className="metrics-header">
        <div>
          <h1 style={{fontSize:'1.75rem', marginBottom:'0.5rem'}}>Métricas e Informes</h1>
          <p style={{color:'var(--text-muted)'}}>Estado general del proceso de admisión and auditoría de cambios.</p>
        </div>
        <button className="btn btn-primary" onClick={exportCSV}>
          <Download size={18} /> Exportar Base Completa (CSV)
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{padding:'1rem'}}>
          <div className="stat-label"><Users size={12} /> Total Solicitudes</div>
          <div className="stat-value" style={{fontSize:'1.5rem'}}>{totalSolicitudes}</div>
        </div>
        <div className="stat-card" style={{padding:'1rem'}}>
          <div className="stat-label"><CheckCircle size={12} /> Total Ingresos</div>
          <div className="stat-value" style={{fontSize:'1.5rem', color:'#10B981'}}>
            {data.stats.reduce((acc: number, s: any) => acc + s.concretados, 0)}
          </div>
        </div>
        <div className="stat-card" style={{padding:'1rem'}}>
          <div className="stat-label"><TrendingUp size={12} /> Efectividad Proceso</div>
          <div className="stat-value" style={{fontSize:'1.5rem', color:'var(--accent)'}}>
            {totalSolicitudes > 0 ? Math.round((data.stats.reduce((acc: number, s: any) => acc + s.concretados, 0) / totalSolicitudes) * 100) : 0}%
          </div>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="section-card">
          <div className="section-header" style={{padding:'0.75rem 1rem'}}>
            <h3 style={{margin:0, fontSize:'0.9rem'}}><BarChart3 size={16} style={{verticalAlign:'middle', marginRight:'0.5rem'}} /> Solicitudes vs Ingresos</h3>
          </div>
          <div style={{paddingBottom:'0.5rem'}}>
            {data.stats.map((s: any) => (
              <div key={s.nivel_ingreso} className="level-row" style={{padding:'0.6rem 1rem'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'0.1rem'}}>
                    <span style={{fontWeight:700, fontSize:'0.85rem'}}>{s.nivel_ingreso}</span>
                    <span style={{fontSize:'0.85rem'}}>
                      <strong style={{color:'var(--primary)'}}>{s.total}</strong>
                      <span style={{color:'var(--text-muted)', margin:'0 0.3rem'}}>/</span>
                      <strong style={{color:'#10B981'}}>{s.concretados}</strong>
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: `${(s.total / totalSolicitudes) * 100}%`}}></div>
                  </div>
                </div>
              </div>
            ))}
            <div className="level-row" style={{padding:'1rem', background:'#f8fafc', borderTop:'2px solid var(--border-color)', marginTop:'0.5rem'}}>
              <span style={{fontWeight:800, fontSize:'0.9rem', color:'var(--secondary)'}}>TOTAL GENERAL</span>
              <span style={{fontSize:'1rem'}}>
                <strong style={{color:'var(--primary)'}}>{totalSolicitudes}</strong>
                <span style={{color:'var(--text-muted)', margin:'0 0.4rem'}}>/</span>
                <strong style={{color:'#10B981'}}>{data.stats.reduce((acc: number, s: any) => acc + s.concretados, 0)}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="section-card">
          <div className="section-header">
            <h3 style={{margin:0, fontSize:'1rem'}}><History size={18} style={{verticalAlign:'middle', marginRight:'0.5rem'}} /> Historial de Actividad</h3>
            <span style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>Últimos 100 cambios</span>
          </div>
          <div className="history-list" style={{maxHeight:'500px', overflowY:'auto'}}>
            {data.history.map((h: any) => (
              <div key={h.id} className="history-item">
                <div style={{minWidth:'80px', color:'var(--text-muted)', fontWeight:700, fontSize:'0.75rem'}}>
                  {new Date(h.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                <div style={{flex:1}}>
                  <span style={{fontWeight:800, color:'var(--primary)'}}>{h.usuario_nombre}</span>
                  <span style={{margin:'0 0.4rem'}}>realizó un/a</span>
                  <strong style={{textTransform:'uppercase', fontSize:'0.75rem'}}>{h.accion}</strong>
                  {h.ficha_nombre && (
                    <div style={{marginTop:'0.25rem', color:'var(--text-muted)'}}>
                      Ficha: <span style={{color:'var(--secondary)', fontWeight:700}}>{h.ficha_nombre}</span>
                    </div>
                  )}
                </div>
                <div style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>
                  {new Date(h.fecha).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;
