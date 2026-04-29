import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Search, 
  Download, 
  ChevronRight, 
  Mail,
  Clock,
  Printer,
  MessageCircle,
  Edit3,
  Save,
  X,
  Trash2,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api';

const AdminPanel = () => {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [isAuth, setIsAuth] = useState(Boolean(localStorage.getItem('adminToken')));
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');

  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${passwordInput}` }
      });
      if (res.ok) {
        setToken(passwordInput);
        localStorage.setItem('adminToken', passwordInput);
        setIsAuth(true);
        setError('');
      } else {
        setError('Contraseña incorrecta');
      }
    } catch (err) { setError('Error de conexión'); }
  };

  const logout = () => {
    localStorage.removeItem('adminToken'); setToken(''); setIsAuth(false);
  };

  if (!isAuth) {
    return (
      <div className="card animate-in" style={{ maxWidth: '400px', margin: '4rem auto', padding: '2.5rem', textAlign: 'center' }}>
        <div style={{ background: 'var(--accent-soft)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <Users size={30} color="var(--accent)" />
        </div>
        <h2>Acceso Administrativo</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Ingrese la contraseña maestra para continuar.</p>
        {error && <p className="form-error" style={{ background: '#FEE2E2', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginTop: '1rem' }}>{error}</p>}
        <form onSubmit={handleLogin} style={{marginTop: '2rem'}}>
          <div className="form-group">
            <input 
              type="password" 
              className="form-input" 
              placeholder="Contraseña" 
              value={passwordInput} 
              onChange={(e) => setPasswordInput(e.target.value)} 
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Ingresar al Panel</button>
        </form>
      </div>
    );
  }

  const showSidebar = !location.pathname.includes('/ficha/');

  return (
    <div className={`admin-layout animate-in ${!showSidebar ? 'full-width' : ''}`} style={!showSidebar ? { gridTemplateColumns: '1fr' } : {}}>
      {showSidebar && (
        <aside className="sidebar no-print">
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Módulos</h3>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link to="/admin" className={`btn ${location.pathname === '/admin' ? 'btn-primary' : 'btn-ghost'}`} style={{justifyContent: 'flex-start'}}>
                <Users size={18} /> Bandeja de Entrada
              </Link>
              <Link to="/admin/agenda" className={`btn ${location.pathname === '/admin/agenda' ? 'btn-primary' : 'btn-ghost'}`} style={{justifyContent: 'flex-start'}}>
                <Calendar size={18} /> Agenda de Entrevistas
              </Link>
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '1rem 0' }}></div>
              <button onClick={logout} className="btn btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--error)' }}>
                <Clock size={18} /> Cerrar Sesión
              </button>
            </nav>
          </div>
        </aside>
      )}

      <main>
        <Routes>
          <Route path="/" element={<BandejaEntrada token={token} />} />
          <Route path="/agenda" element={<Agenda token={token} />} />
          <Route path="/ficha/:id" element={<DetalleFicha token={token} />} />
        </Routes>
      </main>
    </div>
  );
};

// --- COMPONENTES ADMIN ---

const BandejaEntrada = ({ token }: { token: string }) => {
  const [fichas, setFichas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterStatus, setFilterStatus] = useState('activos');
  const [confirmStateChange, setConfirmStateChange] = useState<{id: number, newState: string} | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/admin/fichas`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setFichas(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const filteredFichas = useMemo(() => {
    return fichas.filter(f => {
      const matchSearch = (f.apellido + ' ' + f.nombre + ' ' + f.dni_nro).toLowerCase().includes(search.toLowerCase());
      const matchLevel = filterLevel ? f.nivel_ingreso === filterLevel : true;
      const matchStatus = filterStatus ? (
        filterStatus === 'activos' 
          ? !['finalizado', 'cancelado'].includes(f.estado) 
          : f.estado === filterStatus
      ) : true;
      return matchSearch && matchLevel && matchStatus;
    });
  }, [fichas, search, filterLevel, filterStatus]);

  const exportToCSV = () => {
    if (filteredFichas.length === 0) return;
    
    const headers = ["ID", "Fecha_Solicitud", "Apellido", "Nombre", "DNI", "Nivel", "Grado", "Estado", "Decision_Final"];
    const rows = filteredFichas.map(f => [
      f.id,
      new Date(f.fecha_solicitud).toLocaleDateString(),
      f.apellido,
      f.nombre,
      f.dni_nro,
      f.nivel_ingreso,
      f.grado_anio,
      f.estado,
      f.decision_final || '-'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inscripciones_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-in">
      <div className="flex justify-between items-center mb-4">
        <h1>Bandeja de Entrada</h1>
        <button onClick={exportToCSV} className="btn btn-outline" disabled={filteredFichas.length === 0}>
          <Download size={18} /> Exportar CSV
        </button>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Buscar por nombre, apellido o DNI..." 
              style={{ paddingLeft: '2.75rem' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="form-select" style={{ width: 'auto', minWidth: '180px' }} value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
            <option value="">Todos los Niveles</option>
            <option value="Nivel Inicial">Nivel Inicial</option>
            <option value="EPO (Primaria)">EPO (Primaria)</option>
            <option value="ESO (Secundaria)">ESO (Secundaria)</option>
          </select>
          <select className="form-select" style={{ width: 'auto', minWidth: '180px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Todos los Estados</option>
            <option value="activos">Solo Activos (Pendientes)</option>
            <option value="pendiente">Pendiente</option>
            <option value="contactado">Contactado</option>
            <option value="entrevista_programada">Entrevista</option>
            <option value="finalizado">Finalizado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      <div className="admin-table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Cargando solicitudes...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Alumno</th>
                <th>Nivel / Año</th>
                <th>Estado / Resolución</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredFichas.map(f => (
                <tr key={f.id}>
                  <td>{new Date(f.fecha_solicitud).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 600 }}>{f.apellido}, {f.nombre}</td>
                  <td>{f.nivel_ingreso} <br/> <small style={{color:'var(--text-muted)'}}>{f.grado_anio}</small></td>
                  <td>
                    <select 
                      className={`form-select badge badge-${f.estado}`} 
                      style={{ padding: '0.25rem 1.5rem 0.25rem 0.5rem', appearance: 'auto', border: '1px solid transparent', cursor: 'pointer', outline: 'none' }} 
                      value={f.estado} 
                      onChange={e => setConfirmStateChange({ id: f.id, newState: e.target.value })}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="contactado">Contactado</option>
                      <option value="entrevista_programada">Entrevista</option>
                      <option value="finalizado">Finalizado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                    {f.decision_final && (
                      <div style={{fontSize: '0.75rem', fontWeight: 700, marginTop: '0.25rem'}}>
                        {f.decision_final === 'ingresa' ? '✅ Ingresa' : (f.decision_final === 'no_ingresa' ? '❌ No ingresa' : '⏳ Espera')}
                        {f.motivo_finalizacion && <span style={{fontWeight: 400, color: 'var(--text-muted)'}}> ({f.motivo_finalizacion})</span>}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost" style={{ padding: '0.5rem', color: '#25D366' }} title="WhatsApp" onClick={() => window.open(`https://wa.me/${(f.contacto_entrevista_dato||'').replace(/\D/g,'')}?text=Hola ${f.contacto_entrevista_nombre}, nos comunicamos de La Cecilia...`, '_blank')}>
                        <MessageCircle size={18} />
                      </button>
                      <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }} onClick={() => navigate(`/admin/ficha/${f.id}`)}>
                        Ver <ChevronRight size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredFichas.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No se encontraron solicitudes que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {confirmStateChange && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card animate-in" style={{ padding: '2.5rem', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
            <AlertCircle size={48} color="var(--warning)" style={{ margin: '0 auto 1.5rem' }} />
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>¿Cambiar Estado?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Estás a punto de cambiar el estado de la ficha a <strong style={{color: 'var(--primary)'}}>{confirmStateChange.newState.replace('_', ' ').toUpperCase()}</strong>.
            </p>
            <div className="flex justify-center gap-4">
              <button className="btn btn-outline" onClick={() => setConfirmStateChange(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={async () => {
                setLoading(true);
                try {
                  await fetch(`${API_URL}/admin/fichas/${confirmStateChange.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ estado: confirmStateChange.newState })
                  });
                  const res = await fetch(`${API_URL}/admin/fichas`, { headers: { 'Authorization': `Bearer ${token}` } });
                  const data = await res.json();
                  setFichas(data);
                } catch (e) {
                  alert('Error al cambiar estado');
                } finally {
                  setConfirmStateChange(null);
                  setLoading(false);
                }
              }}>Sí, cambiar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Agenda = ({ token }: { token: string }) => {
  const [entrevistas, setEntrevistas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'proximas' | 'realizadas' | 'canceladas'>('proximas');
  const [expandedReschedule, setExpandedReschedule] = useState<number | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [saving, setSaving] = useState(false);

  const cargar = () => {
    setLoading(true);
    fetch(`${API_URL}/admin/agenda`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { setEntrevistas(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, [token]);

  const handleCambiarEstado = async (id: number, estado: string) => {
    const msg = estado === 'cancelada' ? '¿Cancelar esta entrevista?' : '¿Marcar como realizada?';
    if (!confirm(msg)) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/admin/entrevistas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ estado })
      });
      cargar();
    } catch { alert('Error al actualizar'); }
    finally { setSaving(false); }
  };

  const handleReprogramar = async (id: number) => {
    if (!rescheduleDate) return alert('Seleccione una nueva fecha y hora');
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/entrevistas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ fecha_hora: rescheduleDate })
      });
      if (!res.ok) { const err = await res.json() as any; throw new Error(err.error || 'Error al reprogramar'); }
      setExpandedReschedule(null);
      setRescheduleDate('');
      cargar();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const getWALink = (e: any) => {
    if (e.contacto_entrevista_medio !== 'WhatsApp' || !e.contacto_entrevista_dato) return null;
    const fecha = new Date(e.fecha_hora).toLocaleDateString('es-AR');
    const hora = new Date(e.fecha_hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const alumno = `${e.alumno_nombre} ${e.alumno_apellido}`;
    const texto = `¡Hola!%0AHemos recibido la solicitud de inscripción de ${alumno}. Les proponemos realizar la entrevista el día ${fecha} a las ${hora}.%0ALes pedimos confirmar disponibilidad. En caso de no poder, avísennos con anticipación.%0AMuchas gracias.`;
    return `https://wa.me/${e.contacto_entrevista_dato.replace(/\D/g, '')}?text=${texto}`;
  };

  const proximas = entrevistas.filter(e => e.estado === 'programada' || e.estado === 'movida');
  const realizadas = entrevistas.filter(e => e.estado === 'realizada');
  const canceladas = entrevistas.filter(e => e.estado === 'cancelada');

  const TABS = [
    { key: 'proximas' as const, label: 'Próximas', count: proximas.length },
    { key: 'realizadas' as const, label: 'Realizadas', count: realizadas.length },
    { key: 'canceladas' as const, label: 'Canceladas', count: canceladas.length },
  ];

  const groupByDay = (list: any[]) => {
    const groups: { [day: string]: any[] } = {};
    for (const e of list) {
      const day = new Date(e.fecha_hora).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      if (!groups[day]) groups[day] = [];
      groups[day].push(e);
    }
    return groups;
  };

  const estadoBorder: Record<string, string> = {
    programada: 'var(--accent)',
    movida: '#f59e0b',
    realizada: '#10b981',
    cancelada: 'var(--error)',
  };

  const currentList = activeTab === 'proximas' ? proximas : activeTab === 'realizadas' ? realizadas : canceladas;
  const grupos = groupByDay(currentList);

  return (
    <div className="animate-in">
      <div className="flex justify-between items-center mb-6">
        <h1>Agenda de Entrevistas</h1>
        <button className="btn btn-outline" onClick={cargar} disabled={loading || saving}>
          <Clock size={16} /> Actualizar
        </button>
      </div>

      {/* Tabs de estado */}
      <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '0.35rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', width: 'fit-content' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`btn ${activeTab === tab.key ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.875rem', padding: '0.4rem 1rem' }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{ marginLeft: '0.4rem', background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : 'var(--accent-soft)', color: activeTab === tab.key ? 'white' : 'var(--accent)', borderRadius: '999px', padding: '0 0.45rem', fontSize: '0.75rem', fontWeight: 800 }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>Cargando agenda...</div>
      ) : currentList.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No hay entrevistas en esta categoría.
        </div>
      ) : (
        Object.entries(grupos).map(([dia, items]) => (
          <div key={dia} style={{ marginBottom: '2rem' }}>
            <div style={{ fontWeight: 800, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.75rem', paddingBottom: '0.4rem', borderBottom: '2px solid var(--border-color)' }}>
              📅 {dia}
            </div>
            {items.map((e: any) => {
              const isExpanded = expandedReschedule === e.id;
              const waLink = getWALink(e);
              return (
                <div key={e.id} style={{ marginBottom: '0.75rem' }}>
                  <div className="card" style={{ padding: '1.25rem', borderLeft: `4px solid ${estadoBorder[e.estado] || 'var(--border-color)'}`, opacity: e.estado === 'cancelada' ? 0.65 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                        <div style={{ background: 'var(--accent-soft)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center', minWidth: '72px' }}>
                          <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                            {new Date(e.fecha_hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700 }}>hs</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)' }}>{e.alumno_apellido}, {e.alumno_nombre}</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>DNI: {e.alumno_dni}</div>
                          {e.contacto_entrevista_nombre && (
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                              Contacto: {e.contacto_entrevista_nombre} · {e.contacto_entrevista_medio}
                            </div>
                          )}
                          {e.respuesta && (
                            <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: '#d1fae5', color: '#065f46', borderRadius: 'var(--radius-sm)', fontWeight: 600, display: 'inline-block' }}>
                              Resp. familia: {e.respuesta}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {waLink && (
                          <a href={waLink} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ color: '#25D366', padding: '0.5rem 0.75rem' }} title="Enviar WhatsApp">
                            <MessageCircle size={18} />
                          </a>
                        )}
                        {e.estado !== 'cancelada' && e.estado !== 'realizada' && (
                          <>
                            <button
                              className="btn btn-ghost"
                              style={{ color: '#10b981', fontSize: '0.8125rem' }}
                              onClick={() => handleCambiarEstado(e.id, 'realizada')}
                              disabled={saving}
                              title="Marcar como realizada"
                            >
                              <Save size={16} /> Realizada
                            </button>
                            <button
                              className={`btn ${isExpanded ? 'btn-primary' : 'btn-outline'}`}
                              style={{ fontSize: '0.8125rem' }}
                              onClick={() => {
                                setExpandedReschedule(isExpanded ? null : e.id);
                                setRescheduleDate(e.fecha_hora?.slice(0, 16) || '');
                              }}
                            >
                              <Calendar size={16} /> Reprogramar
                            </button>
                            <button
                              className="btn btn-ghost"
                              style={{ color: 'var(--error)', fontSize: '0.8125rem' }}
                              onClick={() => handleCambiarEstado(e.id, 'cancelada')}
                              disabled={saving}
                            >
                              <X size={16} /> Cancelar
                            </button>
                          </>
                        )}
                        <Link to={`/admin/ficha/${e.ficha_id}`} className="btn btn-outline" style={{ fontSize: '0.8125rem' }}>
                          Ver ficha <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                  {/* Panel inline de reprogramación */}
                  {isExpanded && (
                    <div className="animate-in" style={{ background: '#eff6ff', border: '1px solid var(--accent)', borderTop: 'none', borderRadius: '0 0 var(--radius-md) var(--radius-md)', padding: '1.25rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--accent)' }}>
                        📅 Nueva fecha y hora para la entrevista
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          type="datetime-local"
                          className="form-input"
                          style={{ maxWidth: '260px' }}
                          value={rescheduleDate}
                          min={new Date().toISOString().slice(0, 16)}
                          onChange={ev => setRescheduleDate(ev.target.value)}
                        />
                        <button className="btn btn-primary" onClick={() => handleReprogramar(e.id)} disabled={saving || !rescheduleDate}>
                          {saving ? 'Guardando...' : 'Confirmar cambio'}
                        </button>
                        <button className="btn btn-ghost" onClick={() => { setExpandedReschedule(null); setRescheduleDate(''); }}>
                          Cancelar
                        </button>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        ⚠ Se validará que no haya otra entrevista dentro de la franja de 1 hora.
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}


const DetalleFicha = ({ token }: { token: string }) => {
  const [data, setData] = useState<any>(null);
  const [agendaDate, setAgendaDate] = useState('');
  const [agendaNotes, setAgendaNotes] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempFicha, setTempFicha] = useState<any>(null);
  const [entrevistas, setEntrevistas] = useState<any[]>([]);
  const [editingFechas, setEditingFechas] = useState<{[id: number]: string}>({});
  
  const location = useLocation();
  const id = location.pathname.split('/').pop();
  const navigate = useNavigate();

  const load = () => {
    fetch(`${API_URL}/admin/fichas/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json()).then(res => {
        setData(res);
        setTempFicha(res.ficha);
        setEntrevistas(res.entrevistas || []);
      });
  }

  useEffect(() => { load(); }, [id, token]);

  const updateFicha = async (updates: any) => {
    setSavingStatus(true);
    try {
      await fetch(`${API_URL}/admin/fichas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updates)
      });
      load();
    } catch (e) {
      alert('Error al actualizar');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleAgendar = async () => {
    if (!agendaDate) return alert('Seleccione fecha y hora');
    
    // Validar superposición de 1 hora en el frontend
    const newTime = new Date(agendaDate).getTime();
    const overlap = entrevistas.some((e: any) => {
      if (e.estado === 'cancelada') return false;
      const et = new Date(e.fecha_hora).getTime();
      return Math.abs(newTime - et) < 3600000; // 60 minutos
    });

    if (overlap) {
      return alert('Error: No se pueden programar entrevistas con menos de 1 hora de diferencia entre ellas.');
    }

    setSavingStatus(true);
    try {
      const res = await fetch(`${API_URL}/admin/entrevistas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ficha_id: id, fecha_hora: agendaDate, notas: agendaNotes })
      });
      if (!res.ok) {
        const err = await res.json() as any;
        throw new Error(err.error || 'Error al programar');
      }
      
      // Abrir WhatsApp con el nuevo template después de agendar
      if (isWhatsApp) {
        const template = getWATemplate({ fecha_hora: agendaDate });
        window.open(`https://wa.me/${contactData.replace(/\D/g,'')}?text=${template}`, '_blank');
      }

      setAgendaDate('');
      setAgendaNotes('');
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingStatus(false);
    }
  }

  const handleUpdateEntrevista = async (entrevistaId: number, updates: any) => {
    setSavingStatus(true);
    try {
      const res = await fetch(`${API_URL}/admin/entrevistas/${entrevistaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Error al actualizar entrevista');
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingStatus(false);
    }
  };


  const handleDeleteFicha = async () => {
    if (!confirm('🚨 ATENCIÓN: ¿Está seguro de que desea eliminar permanentemente esta ficha? Esta acción NO se puede deshacer.')) return;
    setSavingStatus(true);
    try {
      const res = await fetch(`${API_URL}/admin/fichas/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al eliminar');
      navigate('/admin');
    } catch (e) {
      alert('Error al eliminar la ficha');
      setSavingStatus(false);
    }
  };

  const handleSaveEdit = async () => {
    setSavingStatus(true);
    try {
      await fetch(`${API_URL}/admin/fichas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(tempFicha)
      });
      setIsEditing(false);
      load();
    } catch (e) {
      alert('Error al guardar cambios');
    } finally {
      setSavingStatus(false);
    }
  };

  const handlePrint = () => { window.print(); };

  if (!data) return <div style={{ padding: '4rem', textAlign: 'center' }}>Cargando detalles de la ficha...</div>;

  const contactData = data.ficha.contacto_entrevista_dato || '';
  const isWhatsApp = data.ficha.contacto_entrevista_medio === 'WhatsApp';
  const isEmail = data.ficha.contacto_entrevista_medio === 'Email';

  const getWATemplate = (entrevista?: any) => {
    const alumno = `${data.ficha.nombre} ${data.ficha.apellido}`;
    if (entrevista) {
      const fecha = new Date(entrevista.fecha_hora).toLocaleDateString('es-AR');
      const hora = new Date(entrevista.fecha_hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      return `¡Hola!%0AHemos recibido la solicitud de inscripción de ${alumno}. Les proponemos realizar la entrevista el día ${fecha} a las ${hora}.%0ALes pedimos, por favor, que confirmen la disponibilidad para ese horario. En caso de no poder asistir, agradeceremos que nos avisen con anticipación por este mismo medio.%0AMuchas gracias.`;
    }
    return `Hola ${data.ficha.contacto_entrevista_nombre}, nos comunicamos de la Escuela La Cecilia por su solicitud de ingreso de ${alumno}.`;
  };

  const waLink = isWhatsApp ? `https://wa.me/${contactData.replace(/\D/g,'')}?text=${getWATemplate()}` : null;
  const mailLink = isEmail ? `mailto:${contactData}?subject=Solicitud de Ingreso - Escuela La Cecilia&body=Hola ${data.ficha.contacto_entrevista_nombre}, ...` : null;

  return (
    <div className="animate-in">
      <style>{`
        @media print {
          @page { margin: 1cm; size: portrait; }
          .no-print { display: none !important; }
          body { background: white !important; font-size: 9.5pt !important; color: #1e293b !important; }
          .card { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
          
          .section-print { 
            margin-bottom: 1.5rem; 
            page-break-inside: avoid; 
            border: 1px solid #cbd5e1; 
            border-radius: 4px;
            overflow: hidden;
          }
          
          .section-title-print { 
            background: #1C3F60 !important; 
            color: white !important; 
            padding: 0.5rem 1rem; 
            font-weight: 800; 
            text-transform: uppercase; 
            font-size: 10pt;
            letter-spacing: 0.05em;
            -webkit-print-color-adjust: exact;
          }
          
          .grid-print { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 0.5rem 1rem; 
            padding: 1rem; 
          }
          
          .full-print { grid-column: 1 / -1; }
          
          .print-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 2rem;
            border-bottom: 2px solid #1C3F60;
            padding-bottom: 1rem;
          }
          
          .header-text { text-align: right; }
          
          h1 { font-size: 18pt; margin: 0; color: #1C3F60 !important; font-weight: 800; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 0; }
          th, td { border: 1px solid #e2e8f0; padding: 0.5rem; text-align: left; }
          th { background: #f8fafc !important; font-weight: 700; color: #64748b; font-size: 8pt; text-transform: uppercase; -webkit-print-color-adjust: exact; }
          
          .badge-print {
            padding: 0.2rem 0.5rem;
            border: 1px solid #1C3F60;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 8pt;
          }

          .signature-box {
            margin-top: 3rem;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2cm;
            page-break-inside: avoid;
          }

          .signature-line {
            border-top: 1px solid black;
            margin-top: 1.5cm;
            padding-top: 0.2cm;
            text-align: center;
            font-size: 8pt;
          }

          .agreement-text-print {
            font-size: 8.5pt;
            line-height: 1.4;
            text-align: justify;
            margin-top: 1rem;
          }

          .agreement-text-print h4 {
            font-size: 10pt;
            margin-bottom: 0.5rem;
            text-align: center;
            color: #1C3F60;
          }

          .agreement-text-print h5 {
            font-size: 9pt;
            margin-top: 0.75rem;
            margin-bottom: 0.25rem;
            font-weight: 800;
          }
        }
      `}</style>

      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', background: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', position: 'sticky', top: 'var(--header-height)', zIndex: 10, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={() => navigate('/admin')}>
             <ArrowLeft size={18} /> Volver
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={18} /> Generar PDF / Imprimir
          </button>
          <button className={`btn ${isEditing ? 'btn-accent' : 'btn-outline'}`} onClick={() => setIsEditing(!isEditing)}>
            <Edit3 size={18} /> {isEditing ? 'Cancelar Edición' : 'Editar Ficha'}
          </button>
          {isEditing && (
            <button className="btn btn-primary" onClick={handleSaveEdit} style={{ background: '#059669' }}>
              <Save size={18} /> Guardar Cambios
            </button>
          )}
          <button className="btn btn-ghost" onClick={handleDeleteFicha} style={{ color: 'var(--error)' }}>
            <Trash2 size={18} /> Eliminar Ficha
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          {waLink && <a href={waLink} target="_blank" rel="noreferrer" className="btn btn-accent" style={{ background: '#25D366' }}><MessageCircle size={18} /> WhatsApp</a>}
          {mailLink && <a href={mailLink} className="btn btn-accent" style={{ background: '#3B82F6' }}><Mail size={18} /> Correo</a>}
        </div>
      </div>

      <div id="print-area">
        <header className="print-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src="/logo.jpg" alt="Logo La Cecilia" style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
            <div>
              <h1 style={{ lineHeight: 1 }}>Ficha de Inscripción</h1>
              <p style={{ fontWeight: 700, color: '#64748b', fontSize: '9pt', marginTop: '0.25rem' }}>LA CECILIA - Escuela de la Nueva Cultura</p>
            </div>
          </div>
          <div className="header-text">
            <div className="badge-print">CICLO LECTIVO {data.ficha.ciclo_lectivo}</div>
            <p style={{ marginTop: '0.5rem', fontSize: '8pt', color: '#64748b' }}>Ficha N°: {data.ficha.id.toString().padStart(6, '0')} <br/> Emisión: {new Date().toLocaleDateString()}</p>
          </div>
        </header>

        {/* RESUMEN ADMINISTRATIVO - SOLO VISIBLE EN PANTALLA */}
        <div className="no-print card" style={{ background: 'white', border: '1px solid #e2e8f0', marginBottom: '2.5rem', padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <h4 style={{fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem'}}>Gestión de Solicitud</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label className="form-label">Estado</label>
              <select className="form-select" value={data.ficha.estado} disabled={savingStatus} onChange={e => updateFicha({ estado: e.target.value })}>
                <option value="pendiente">Pendiente</option>
                <option value="contactado">Contactado</option>
                <option value="entrevista_programada">Entrevista Programada</option>
                <option value="finalizado">Finalizado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="form-label">Resolución</label>
              <select 
                className="form-select" 
                value={data.ficha.decision_final || ''} 
                disabled={savingStatus}
                onChange={e => updateFicha({ decision_final: e.target.value })}
              >
                <option value="">Pendiente</option>
                <option value="ingresa">✔️ INGRESARÁ</option>
                <option value="no_ingresa">❌ NO INGRESARÁ</option>
                <option value="espera">⏳ LISTA DE ESPERA</option>
              </select>
            </div>
            {(data.ficha.estado === 'finalizado' || data.ficha.decision_final === 'no_ingresa') && (
              <div className="animate-in">
                <label className="form-label">Motivo de Decisión / Cierre</label>
                <select 
                  className="form-select" 
                  value={data.ficha.motivo_finalizacion || ''} 
                  disabled={savingStatus}
                  onChange={e => updateFicha({ motivo_finalizacion: e.target.value })}
                >
                  <option value="">Seleccionar motivo...</option>
                  <option value="Desistieron">Desistieron</option>
                  <option value="Rechazamos">Rechazamos</option>
                  <option value="No contestan">No contestan</option>
                  <option value="Falta documentación">Falta documentación</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            )}
            <div>
              <label className="form-label">DNI Alumno</label>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)' }}>{data.ficha.dni_nro}</div>
            </div>
          </div>
        </div>

        {/* ALUMNO */}
        <section className={`section-print animate-in ${data.ficha.modificado_admin ? 'admin-modified' : ''}`}>
          <style>{`
             .admin-modified span, .admin-modified p strong + span, .admin-modified td, .admin-modified .data-value { 
               font-style: italic !important; 
             }
          `}</style>
          <h3 className="section-title-print">I. Datos del Alumno</h3>
          <div className="grid-print">
            <div className="full-print">
              <strong>Nombre Completo:</strong> 
              {isEditing ? (
                <div className="flex gap-2" style={{marginTop: '0.5rem'}}>
                  <input className="form-input" placeholder="Apellido" value={tempFicha.apellido} onChange={e => setTempFicha({...tempFicha, apellido: e.target.value})} />
                  <input className="form-input" placeholder="Nombre" value={tempFicha.nombre} onChange={e => setTempFicha({...tempFicha, nombre: e.target.value})} />
                </div>
              ) : (
                <span className="data-value" style={{fontSize: '11pt', fontWeight: 700}}>{data.ficha.apellido}, {data.ficha.nombre}</span>
              )}
            </div>
            
            <div>
              <strong>Documento:</strong> 
              {isEditing ? (
                <input className="form-input" value={tempFicha.dni_nro} onChange={e => setTempFicha({...tempFicha, dni_nro: e.target.value})} />
              ) : (
                <span className="data-value">{data.ficha.dni_tipo} {data.ficha.dni_nro}</span>
              )}
            </div>
            
            <div>
              <strong>Fecha de Nacimiento:</strong> 
              {isEditing ? (
                <input type="date" className="form-input" value={tempFicha.fecha_nac} onChange={e => setTempFicha({...tempFicha, fecha_nac: e.target.value})} />
              ) : (
                <span className="data-value">{data.ficha.fecha_nac || '-'}</span>
              )}
            </div>

            <div className="full-print">
              <strong>Domicilio:</strong> 
              {isEditing ? (
                <input className="form-input" value={tempFicha.direccion} onChange={e => setTempFicha({...tempFicha, direccion: e.target.value})} />
              ) : (
                <span className="data-value">{data.ficha.direccion}, {data.ficha.localidad} ({data.ficha.cp || '-'}) - {data.ficha.provincia}</span>
              )}
            </div>
            
            <div>
              <strong>Nivel a Ingresar:</strong> {data.ficha.nivel_ingreso}
            </div>
            <div>
              <strong>Grado/Año:</strong> {data.ficha.grado_anio} {data.ficha.repitente ? '(Repitente)' : ''}
            </div>

            {data.ficha.modificado_admin === 1 && (
              <div className="full-print no-print" style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 700, fontStyle: 'italic', marginTop: '0.5rem' }}>
                * Esta ficha contiene datos modificados por la administración.
              </div>
            )}
          </div>
        </section>

        {/* NOTAS INTERNAS */}
        <section className="section-print animate-in no-break" style={{ marginTop: '2.5rem' }}>
          <h3 className="section-title-print" style={{ background: 'var(--primary) !important' }}>III. Notas Administrativas (Uso Interno)</h3>
          <div className="card" style={{ border: 'none', padding: '1rem', background: '#FEF9C3', borderRadius: '0 0 4px 4px' }}>
            <textarea 
              className="form-textarea" 
              style={{ background: 'transparent', border: 'none', resize: 'vertical', minHeight: '150px', fontSize: '0.9375rem', padding: 0 }} 
              placeholder="Escribe aquí las minutas de entrevistas, comentarios o seguimientos internos... (Se guarda automáticamente al hacer clic fuera)"
              value={data.ficha.observaciones_generales || ''}
              onChange={e => setData({...data, ficha: {...data.ficha, observaciones_generales: e.target.value}})}
              onBlur={e => updateFicha({ observaciones_generales: e.target.value })}
            />
          </div>
        </section>

        {/* ESCOLARIDAD */}
        <section className="section-print animate-in" style={{ marginTop: '2.5rem' }}>
          <h3 className="section-title-print">IV. Antecedentes Escolares</h3>
          <div>
            <table className="admin-table" style={{ border: 'none' }}>
              <thead><tr><th>Grado / Nivel</th><th>Institución / Escuela</th><th>Año(s)</th></tr></thead>
              <tbody>
                {data.escolaridad.length > 0 ? data.escolaridad.map((e: any, i: number) => (
                  <tr key={i}>
                    <td style={{fontWeight: 700}}>{e.nivel}</td>
                    <td>{e.escuela}</td>
                    <td>{e.anio_cursado}</td>
                  </tr>
                )) : <tr><td colSpan={3} style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>No se registra escolaridad previa.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        {/* PADRES */}
        <section className="section-print animate-in">
          <h3 className="section-title-print">III. Responsables / Tutores</h3>
          {data.padres.map((p: any, i: number) => (
            <div key={i} style={{ borderBottom: i < data.padres.length - 1 ? '1px solid #cbd5e1' : 'none', padding: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem' }}>
                <p className="full-print"><strong>{p.rol || 'Responsable'}:</strong> <span style={{fontWeight: 700}}>{p.apellido}, {p.nombre}</span> (DNI: {p.dni_nro})</p>
                <p><strong>Estado Civil:</strong> {p.estado_civil || '-'}</p>
                <p><strong>Celular:</strong> {p.celular}</p>
                <p className="full-print"><strong>Domicilio:</strong> {p.domicilio_datos}</p>
                <p className="full-print"><strong>Email:</strong> {p.email || '-'}</p>
                <p className="full-print"><strong>Ocupación:</strong> {p.profesion_ocupacion} {p.empresa_laboral ? `en ${p.empresa_laboral}` : ''}</p>
              </div>
            </div>
          ))}
        </section>

        {/* SALUD */}
        <section className={`section-print animate-in ${data.ficha.modificado_admin ? 'admin-modified' : ''}`}>
          <h3 className="section-title-print">IV. Salud y Actividades</h3>
          <div className="grid-print">
            <div className="full-print">
              <strong>Salud:</strong> 
              {isEditing ? (
                <textarea className="form-textarea" value={tempFicha.salud_detalles} onChange={e => setTempFicha({...tempFicha, salud_detalles: e.target.value})} />
              ) : (
                <span className="data-value">{data.ficha.salud_detalles || '-'}</span>
              )}
            </div>
            <div>
              <strong>Obra Social:</strong> 
              {isEditing ? (
                <input className="form-input" value={tempFicha.obra_social} onChange={e => setTempFicha({...tempFicha, obra_social: e.target.value})} />
              ) : (
                <span className="data-value">{data.ficha.obra_social || 'No posee'}</span>
              )}
            </div>
            <div>
              <strong>Discapacidad:</strong> 
              <span className="data-value">{data.ficha.tiene_cud ? 'SI (Posee CUD)' : 'NO'}</span>
            </div>
            <p className="full-print"><strong>Otras Actividades:</strong> <span className="data-value">{data.ficha.otras_actividades || '-'}</span></p>
          </div>
        </section>

        {/* GRUPO FAMILIAR */}
        <section className="section-print animate-in">
          <h3 className="section-title-print">V. Situación Familiar</h3>
          <div style={{ padding: '1rem' }}>
             {data.hermanos.length > 0 && (
               <div style={{ marginBottom: '1rem' }}>
                 <p style={{ fontWeight: 700, fontSize: '8pt', marginBottom: '0.5rem', textTransform: 'uppercase', color: '#64748b' }}>Composición Familiar / Convivientes:</p>
                 <table style={{ width: '100%' }}>
                    <thead><tr><th>Vínculo</th><th>Nombre</th><th>Fecha Nac.</th><th>Escuela (Hermanos)</th></tr></thead>
                    <tbody>
                      {data.hermanos.map((h: any, i: number) => (
                        <tr key={i}>
                          <td>{h.vinculo === 'Otro' ? h.vinculo_otro : h.vinculo}</td>
                          <td>{h.nombre_apellido}</td>
                          <td>{h.fecha_nac || '-'}</td>
                          <td>{h.estudios_escuela || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
             )}
             
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginTop: '1rem' }}>
               <div>
                 <p style={{ fontWeight: 700, fontSize: '8pt', textTransform: 'uppercase', color: '#64748b', marginBottom: '0.25rem' }}>Situación Socioeconómica:</p>
                 {isEditing ? (
                    <select className="form-select" value={tempFicha.situacion_socioeconomica} onChange={e => setTempFicha({...tempFicha, situacion_socioeconomica: e.target.value})}>
                      <option value="">Seleccionar...</option>
                      <option value="Muy buena">Muy buena</option>
                      <option value="Buena">Buena</option>
                      <option value="Regular">Regular</option>
                      <option value="Mala">Mala</option>
                    </select>
                  ) : (
                    <div className="data-value" style={{ padding: '0.5rem', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '4px', fontWeight: 700, color: 'var(--primary)' }}>
                      {data.ficha.situacion_socioeconomica || 'No especificada'}
                    </div>
                  )}
               </div>
               <div>
                 <p style={{ fontWeight: 700, fontSize: '8pt', textTransform: 'uppercase', color: '#64748b', marginBottom: '0.25rem' }}>Observaciones / Otros Datos:</p>
                 {isEditing ? (
                    <textarea className="form-textarea" value={tempFicha.otros_datos} onChange={e => setTempFicha({...tempFicha, otros_datos: e.target.value})} rows={2} />
                  ) : (
                    <div className="data-value" style={{ padding: '0.5rem', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '4px', minHeight: '40px' }}>
                      {data.ficha.otros_datos || 'No se declaran otros datos.'}
                    </div>
                  )}
               </div>
             </div>
          </div>
        </section>

        {/* ACUERDO - SOLO PRINT */}
        <section className="section-print agreement-text-print" style={{ border: 'none', display: 'none' }} id="agreement-section">
          <style>{`
            @media print {
              #agreement-section { display: block !important; page-break-before: always; }
            }
          `}</style>
          <h4>ACUERDO DE ADMISIÓN Y PERMANENCIA</h4>
          
          <p>Las familias, alumnos y alumnas pueden informarse sobre la filosofía y los fundamentos de la Escuela, así como conocer las condiciones generales que se expresan en documentos tales como “Propósitos de la Escuela”, “Principios de la Escuela”, “Manual de Bienvenida” y “Manual de Procedimientos”, de modo que exista una elección consciente al momento de solicitar la inscripción, contando siempre con la posibilidad de efectuar las consultas que consideren necesarias.</p>
          <p>No se considera que exista un alumno o alumna fuera y otro u otra dentro de la Escuela, por lo cual se espera una conducta coherente del alumnado con los principios de la misma, en cualquier ámbito en que se encuentren.</p>
          <p>La Escuela tiene la intención de crear las condiciones para que los niños, niñas y jóvenes que asisten a ella puedan desarrollarse en libertad, lo cual requiere comprender la trama del condicionamiento genético, cultural y psicológico que determina nuestras acciones. No hay libertad mientras los pensamientos, emociones y acciones están dictados por las modas, las presiones sociales, las ideologías, los dogmas de cualquier tipo, nuestras huellas psicológicas, todo lo cual constituye nuestro “yo”. La libertad -entendida como libertad de la actividad egocéntrica- nos permite ser personas atentas y reflexivas, lo que posibilita una amistosa convivencia, un armonioso desarrollo en sociedad y una vida libre de conflicto interno. Es en estos principios que se basa el núcleo de nuestros propósitos educativos y al cual se remiten las siguientes condiciones que los alumnos, alumnas y familias deben comprender y aceptar para su ingreso y permanencia en la escuela.</p>

          <h5>ADMISIÓN</h5>
          <p>La Escuela “La Cecilia” es un proyecto que propone una educación en libertad. En tal sentido, el ingreso implica conocer y acordar con sus principios. Será necesario para la admisión que potenciales ingresantes y sus familias muestren interés en los fundamentos de la Escuela y acepten estas condiciones. Siendo un proyecto educativo que requiere un marco de aceptación y coherencia en la vida familiar, se pretende que todos los hermanos o hermanas en edad escolar asistan a esta escuela, salvo circunstancias particulares que se analizarán en cada caso.</p>

          <h5>BUEN TRATO</h5>
          <p>No se permitirá ningún tipo de trato violento, físico ni verbal, como burlas, discriminación, bullying, etc. tanto dentro como fuera de la Escuela. Estas conductas serán informadas y conversadas con las familias y se exigirán seguimientos en cada caso.</p>

          <h5>EXPECTATIVAS ACADÉMICAS</h5>
          <p>Las familias, alumnos y alumnas deben comprender y aceptar que no resulta lógico ni posible que todos lleguen a los mismos resultados en sus aprendizajes académicos, ya que ello dependerá de sus intereses y capacidades. El propósito educativo de la Escuela es colaborar para que cada alumno o alumna pueda conocerse a sí mismo, conocer sus intereses y capacidades y desarrollarlos de la mejor manera, para poder hacer de ellos un medio de vida dentro de un proyecto vital con sentido social. Para los propósitos enunciados se les brindarán las opciones académicas correspondientes y el apoyo necesario. Los alumnos y alumnas podrán elegir las actividades que realizan y proponer otras que no se estén realizando. En todos los casos la tutoría de la Escuela, junto a educadores, hará un seguimiento de cada alumno o alumna, para lo cual se llevará un registro detallado de las actividades.</p>

          <h5>MODO DE VIDA - ALIMENTACIÓN</h5>
          <p>La Escuela propone un modo de vida que contribuya a la salud física y psicológica. Se propone una dieta vegetariana y natural que excluye las carnes de todo tipo y sus derivados, bebidas alcohólicas, gaseosas y golosinas, así como otros alimentos con exceso de dulces o de sal. Tanto en el predio de la Escuela como durante salidas, reuniones, actividades escolares o cualquier otra actividad donde participen grupalmente los alumnos y alumnas se respetará la alimentación vegetariana y los hábitos propuestos. El cumplimiento de esta dieta no es de exigencia en el hogar, pero se solicita a las familias que colaboren para que sus hijos o hijas adopten conscientemente una forma de vida que contribuya a cuidar su salud. En el mismo sentido, no se deben ingresar a la escuela alimentos que no respondan a las pautas de cuidado de la salud que se recomiendan.</p>

          <h5>CIGARRILLO, ALCOHOL, DROGAS</h5>
          <p>Se consideran dañinos para la salud el tabaco, alcohol u otras drogas, por lo cual alumnos y alumnas deben comprometerse a no consumirlos en ningún momento, dentro o fuera de la escuela. Se solicita a las familias que colaboren para que sus hijos o hijas no se conviertan en consumidores de estos elementos perjudiciales para la salud y generadores de tantos trastornos sociales.</p>

          <h5>ACCESORIOS</h5>
          <p>Hay jóvenes que suelen utilizar accesorios (algunos tipos de piercings, muñequeras, cadenas, expansores, etc.) que implican un riesgo para la seguridad y salud propia y de sus compañeros o compañeras, pero además son representativos de condicionamientos sobre los que la Escuela está fuertemente interesada en trabajar. Por lo tanto, los alumnos y alumnas convendrán no usar accesorios que no sean consensuados con la escuela y la familia, dentro ni fuera de ella. No obstante, se podrán revisar estas restricciones en todo momento a través de los mecanismos orgánicos colectivos disponibles, tales como las Asambleas.</p>

          <h5>BOLICHES, VIDA NOCTURNA</h5>
          <p>Los alumnos y alumnas de la Escuela se comprometerán a no asistir a pubs, boliches o lugares similares, ya que no son ambientes convenientes para adolescentes, ni son acordes a la forma de vida propuesta.</p>

          <h5>HORARIO Y ASISTENCIA</h5>
          <p>La Escuela considera imprescindible que alumnos y alumnas participen con regularidad y puntualidad a las actividades de la vida escolar. Se evitarán las inasistencias reiteradas y las reincorporaciones que deban gestionarse -con motivo de alcanzar la cantidad de faltas permitidas por el reglamento- se autorizarán solamente en caso de que estén debidamente justificadas por enfermedad u otras circunstancias graves que las ameriten.</p>

          <h5>SANCIONES</h5>
          <p>No se utiliza un sistema de premios ni castigos, por lo cual tampoco hay sanciones para regular los comportamientos y la vida de la Escuela. Esto requiere que alumnos y alumnas sepan auto-gestionar su conducta dentro de los canales existentes y respetando los propósitos y fundamentos expuestos. Dado que la firma de los presentes compromisos determina la posibilidad del ingreso, la falta de cumplimiento de estos acuerdos significará que el alumno o la alumna deberá dejar la Escuela de inmediato, en cualquier momento del año o no acceder a la reinscripción para el año siguiente.</p>

          <h5>CUMPLIMIENTO COMPROMISO ECONÓMICO</h5>
          <p>Las familias se comprometen a abonar en tiempo y forma las cuotas. De existir algún inconveniente para el pago de las mismas, esto se comunicará inmediatamente a la Escuela, a fin de encontrar alguna alternativa para hacer frente a la situación. Si existiese una deuda de dos cuotas vencidas y no se acordase una forma de cumplimiento, la familia se compromete a pedir el pase y dejar la escuela en el momento en que se le solicite. Las cuotas pagadas fuera de término conllevarán un recargo. No se reinscribirán alumnos ni alumnas que mantengan deuda con la Escuela al comienzo del ciclo lectivo.</p>

          <h5>CUOTAS</h5>
          <p>Se abonan 12 cuotas al año, 2 de las cuales corresponden a matrícula (que deben estar pagas antes del finalizar el año previo al ciclo lectivo en que se inscribe el alumno) y luego 10 cuotas consecutivas, de marzo a diciembre del ciclo en que se inscribe. Las cuotas se ajustan periódicamente en forma proporcional a los aumentos en los salarios docentes y sus valores pueden consultarse en la página de la Escuela.</p>

          <div className="signature-box">
             <div>
                <div className="signature-line">Firma Adulto Responsable</div>
                <div style={{fontSize: '7pt', marginTop: '0.2cm'}}>Aclaración: ___________________________</div>
                <div style={{fontSize: '7pt', marginTop: '0.2cm'}}>Vínculo: ______________________________</div>
             </div>
             <div>
                <div className="signature-line">Firma Adulto Responsable</div>
                <div style={{fontSize: '7pt', marginTop: '0.2cm'}}>Aclaración: ___________________________</div>
                <div style={{fontSize: '7pt', marginTop: '0.2cm'}}>Vínculo: ______________________________</div>
             </div>
             <div style={{ gridColumn: '1 / -1', maxWidth: '50%', margin: '0 auto' }}>
                <div className="signature-line">Firma del Alumno/a</div>
                <div style={{fontSize: '7pt', marginTop: '0.2cm', textAlign: 'center'}}>Aclaración: ___________________________</div>
             </div>
          </div>
        </section>

        <footer style={{ marginTop: '2rem', textAlign: 'center', fontSize: '8pt', color: '#94a3b8' }}>
          Este documento es una solicitud formal de admisión y no garantiza el ingreso definitivo a la institución.
        </footer>
      </div>

      {/* GESTIÓN DE CITA - NO SE IMPRIME */}
      <section className="no-print animate-in" style={{ marginTop: '4rem', paddingBottom: '5rem' }}>
        <div className="card" style={{ background: '#f8fafc', border: '2px dashed var(--accent)', padding: '2.5rem' }}>
          <div className="flex items-center gap-3 mb-6">
            <Calendar color="var(--accent)" size={28} />
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Agenda de Entrevista</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
            <div>
              <div className="form-group">
                <label className="form-label">Fecha y Hora de la Cita</label>
                <input 
                  type="datetime-local" 
                  className="form-input" 
                  value={agendaDate} 
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={e => setAgendaDate(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Observaciones para la entrevista</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Ej: La familia debe traer original de CUD..." 
                  value={agendaNotes} 
                  rows={3}
                  onChange={e => setAgendaNotes(e.target.value)}
                ></textarea>
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAgendar} disabled={savingStatus}>
                {savingStatus ? 'Guardando...' : 'Programar y Notificar'}
              </button>
            </div>
            
            <div>
              <h4 style={{ fontSize: '0.875rem', marginBottom: '1.5rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>Historial de Entrevistas</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {data.entrevistas.length > 0 ? data.entrevistas.map((ev: any, i: number) => {
                  const estadoColor: Record<string, string> = { programada: 'var(--accent)', realizada: '#10b981', cancelada: 'var(--error)', movida: '#f59e0b' };
                  const editFecha = editingFechas[ev.id] ?? ev.fecha_hora?.slice(0, 16) ?? '';
                  const fechaCambio = editFecha !== (ev.fecha_hora?.slice(0, 16) ?? '');
                  return (
                    <div key={i} style={{ padding: '1rem', background: 'white', borderRadius: 'var(--radius-md)', border: `1px solid ${estadoColor[ev.estado] || 'var(--border-color)'}`, boxShadow: 'var(--shadow-sm)', opacity: ev.estado === 'cancelada' ? 0.65 : 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: ev.estado === 'cancelada' ? 'var(--text-muted)' : 'var(--primary)', marginBottom: '0.25rem' }}>
                            {new Date(ev.fecha_hora).toLocaleString('es-AR')}
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', padding: '0.15rem 0.5rem', borderRadius: '999px', background: `${estadoColor[ev.estado]}22`, color: estadoColor[ev.estado] || 'var(--text-muted)' }}>
                            {ev.estado}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {isWhatsApp && ev.estado !== 'cancelada' && (
                            <a href={`https://wa.me/${contactData.replace(/\D/g,'')}?text=${getWATemplate(ev)}`} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ padding: '4px', color: '#25D366' }} title="Re-enviar WhatsApp">
                              <MessageCircle size={16} />
                            </a>
                          )}
                          {ev.estado !== 'cancelada' && (
                            <select
                              className="form-select"
                              style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', width: 'auto' }}
                              value={ev.estado}
                              onChange={async (e) => {
                                if (e.target.value === 'cancelada' && !confirm('¿Cancelar esta entrevista?')) return;
                                await handleUpdateEntrevista(ev.id, { estado: e.target.value });
                              }}
                            >
                              <option value="programada">Programada</option>
                              <option value="realizada">Realizada</option>
                              <option value="cancelada">Cancelada</option>
                            </select>
                          )}
                        </div>
                      </div>

                      {ev.estado !== 'cancelada' && (
                        <div style={{ marginTop: '0.75rem' }}>
                          {/* Editar fecha/hora */}
                          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Fecha y Hora</label>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <input
                                type="datetime-local"
                                className="form-input"
                                style={{ fontSize: '0.8125rem', padding: '0.4rem', flex: 1 }}
                                value={editFecha}
                                onChange={(e) => setEditingFechas(prev => ({ ...prev, [ev.id]: e.target.value }))}
                              />
                              {fechaCambio && (
                                <button
                                  className="btn btn-primary"
                                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', whiteSpace: 'nowrap' }}
                                  disabled={savingStatus}
                                  onClick={async () => {
                                    await handleUpdateEntrevista(ev.id, { fecha_hora: editFecha });
                                    setEditingFechas(prev => { const n = { ...prev }; delete n[ev.id]; return n; });
                                  }}
                                >
                                  <Save size={14} /> Guardar
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Notas Admin</label>
                            <textarea
                              className="form-textarea"
                              style={{ fontSize: '0.8125rem', padding: '0.4rem' }}
                              defaultValue={ev.notas}
                              onBlur={(e) => handleUpdateEntrevista(ev.id, { notas: e.target.value })}
                              placeholder="Notas de la entrevista..."
                            />
                          </div>
                          <div className="form-group">
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Respuesta de la Familia</label>
                            <input
                              type="text"
                              className="form-input"
                              style={{ fontSize: '0.8125rem', padding: '0.4rem' }}
                              defaultValue={ev.respuesta}
                              onBlur={(e) => handleUpdateEntrevista(ev.id, { respuesta: e.target.value })}
                              placeholder="Ej: Confirmaron asistencia, piden cambiar..."
                            />
                          </div>
                        </div>
                      )}
                      {ev.estado === 'cancelada' && ev.notas && <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.5rem' }}>Nota: {ev.notas}</div>}
                    </div>
                  );
                }) : <div style={{ textAlign: 'center', padding: '2rem', background: 'white', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}>Aún no hay citas registradas.</div>}
              </div>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminPanel;
