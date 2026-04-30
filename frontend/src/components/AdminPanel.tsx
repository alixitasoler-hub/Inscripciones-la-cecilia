import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  Plus,
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
          <div className="card sidebar-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)' }}>Módulos</h3>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <NavLink 
                to="/admin" 
                end
                className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-ghost'}`} 
                style={{justifyContent: 'flex-start'}}
              >
                <Users size={18} /> Bandeja de Entrada
              </NavLink>
              <NavLink 
                to="/admin/agenda" 
                className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-ghost'}`} 
                style={{justifyContent: 'flex-start'}}
              >
                <Calendar size={18} /> Agenda de Entrevistas
              </NavLink>
              
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '1rem 0' }}></div>
              
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

// --- COMPONENTE: MODAL DE GESTIÓN DE ENTREVISTA ---

const GestionarEntrevistaModal = ({ 
  entrevista, 
  token, 
  onClose, 
  onUpdate 
}: { 
  entrevista: any; 
  token: string; 
  onClose: () => void; 
  onUpdate: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fecha_hora: entrevista.fecha_hora?.replace(' ', 'T').slice(0, 16) || '',
    estado: entrevista.estado,
    notas: entrevista.notas || '',
    respuesta: entrevista.respuesta || ''
  });

  const handleSave = async () => {
    if (!formData.fecha_hora) return alert('La fecha y hora son obligatorias');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/entrevistas/${entrevista.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const err = await res.json() as any;
        throw new Error(err.error || 'Error al guardar');
      }
      onUpdate();
      onClose();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const getWALink = () => {
    if (!entrevista.contacto_entrevista_dato) return null;
    const fecha = new Date(formData.fecha_hora).toLocaleDateString('es-AR');
    const hora = new Date(formData.fecha_hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const alumno = `${entrevista.alumno_nombre || entrevista.nombre || ''} ${entrevista.alumno_apellido || entrevista.apellido || ''}`;
    
    let texto = '';
    if (formData.estado === 'cancelada') {
      texto = `¡Hola!%0ANos comunicamos de la Escuela La Cecilia. Lamentamos informar que la entrevista para ${alumno} ha sido cancelada. Nos pondremos en contacto nuevamente a la brevedad.`;
    } else {
      texto = `¡Hola!%0AHemos actualizado la cita para ${alumno}. La nueva fecha es el día ${fecha} a las ${hora}.%0ALes pedimos confirmar disponibilidad. Muchas gracias.`;
    }
    
    return `https://wa.me/${entrevista.contacto_entrevista_dato.replace(/\D/g, '')}?text=${texto}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0 }}>Gestionar Entrevista</h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {entrevista.alumno_apellido || entrevista.apellido}, {entrevista.alumno_nombre || entrevista.nombre}
            </p>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '0.5rem' }}><X size={20} /></button>
        </div>
        
        <div className="modal-body">
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Estado de la Cita</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['programada', 'realizada', 'cancelada', 'movida'].map(s => (
                <button 
                  key={s} 
                  className={`action-chip ${formData.estado === s ? 'action-chip-active' : ''}`}
                  onClick={() => setFormData({...formData, estado: s})}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Fecha y Hora</label>
              <input 
                type="datetime-local" 
                className="form-input" 
                value={formData.fecha_hora} 
                onChange={e => setFormData({...formData, fecha_hora: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Respuesta Familia</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.respuesta} 
                onChange={e => setFormData({...formData, respuesta: e.target.value})}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notas Administrativas</label>
            <textarea 
              className="form-textarea" 
              rows={3} 
              value={formData.notas}
              onChange={e => setFormData({...formData, notas: e.target.value})}
            />
          </div>

          {entrevista.contacto_entrevista_dato && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--accent-soft)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.875rem' }}>{entrevista.contacto_entrevista_medio}: {entrevista.contacto_entrevista_dato}</div>
              <a href={getWALink() || '#'} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ background: '#25D366' }}>
                <MessageCircle size={18} /> WhatsApp
              </a>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
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
                <th>Contacto para Entrevista</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredFichas.map(f => (
                <tr key={f.id}>
                  <td>{new Date(f.fecha_solicitud).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 600 }}>{f.apellido}, {f.nombre} <br/> <small style={{color:'var(--text-muted)', fontWeight:400}}>DNI: {f.dni_nro}</small></td>
                  <td>{f.nivel_ingreso} <br/> <small style={{color:'var(--text-muted)'}}>{f.grado_anio}</small></td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{f.contacto_entrevista_nombre || '-'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.contacto_entrevista_medio}: {f.contacto_entrevista_dato || '-'}</div>
                  </td>
                  <td>
                    <select 
                      className={`form-select badge badge-${f.estado}`} 
                      style={{ padding: '0.25rem 1.5rem 0.25rem 0.5rem', appearance: 'auto', border: '1px solid transparent', cursor: 'pointer', outline: 'none', width: '130px' }} 
                      value={f.estado} 
                      onChange={e => setConfirmStateChange({ id: f.id, newState: e.target.value })}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="contactado">Contactado</option>
                      <option value="entrevista_programada">Entrevista</option>
                      <option value="finalizado">Finalizado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost" style={{ padding: '0.5rem', color: '#25D366' }} title="WhatsApp" onClick={() => window.open(`https://wa.me/${(f.contacto_entrevista_dato||'').replace(/\D/g,'')}?text=Hola ${f.contacto_entrevista_nombre}, nos comunicamos de La Cecilia...`, '_blank')}>
                        <MessageCircle size={18} />
                      </button>
                      <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }} onClick={() => navigate(`/admin/ficha/${f.id}`)}>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredFichas.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No se encontraron solicitudes.
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

const DetalleFicha = ({ token }: { token: string }) => {
  const [data, setData] = useState<any>(null);
  const [agendaDate, setAgendaDate] = useState('');
  const [agendaNotes, setAgendaNotes] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempData, setTempData] = useState<any>(null);
  const [entrevistas, setEntrevistas] = useState<any[]>([]);
  const [selectedEntrevista, setSelectedEntrevista] = useState<any | null>(null);
  
  const location = useLocation();
  const id = location.pathname.split('/').pop();
  const navigate = useNavigate();

  const ORDEN_ESCOLARIDAD = [
    'Sala de 3 años', 'Sala de 4 años', 'Sala de 5 años',
    '1° grado', '2° grado', '3° grado', '4° grado', '5° grado', '6° grado', '7° grado',
    '1° año', '2° año', '3° año', '4° año', '5° año'
  ];

  const load = () => {
    fetch(`${API_URL}/admin/fichas/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json()).then(res => {
        setData(res);
        // Aseguramos que escolaridad tenga los 15 niveles
        const fullEscolaridad = ORDEN_ESCOLARIDAD.map(nivel => {
          const existing = res.escolaridad.find((e: any) => e.nivel === nivel);
          return existing || { nivel, escuela: '', anio_cursado: '', observaciones: '' };
        });
        setTempData({ ...res, escolaridad: fullEscolaridad });
        setEntrevistas(res.entrevistas || []);
      });
  }

  useEffect(() => { load(); }, [id, token]);

  const handleAgendar = async () => {
    if (!agendaDate) return alert('Seleccione fecha y hora');
    const newTime = new Date(agendaDate).getTime();
    const overlap = entrevistas.some((e: any) => {
      if (e.estado === 'cancelada') return false;
      const et = new Date(e.fecha_hora).getTime();
      return Math.abs(newTime - et) < 3600000;
    });
    if (overlap) return alert('Error: Existe otra entrevista en esa franja horaria (1 hora).');

    setSavingStatus(true);
    try {
      const res = await fetch(`${API_URL}/admin/entrevistas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ficha_id: id, fecha_hora: agendaDate, notas: agendaNotes })
      });
      if (!res.ok) throw new Error('Error al programar');
      setAgendaDate(''); setAgendaNotes(''); load();
    } catch (e: any) { alert(e.message); }
    finally { setSavingStatus(false); }
  }

  const handleDeleteEntrevista = async (eid: number) => {
    if (!confirm('¿Eliminar esta entrevista?')) return;
    setSavingStatus(true);
    try {
      await fetch(`${API_URL}/admin/entrevistas/${eid}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      load();
    } catch (e) { alert('Error'); }
    finally { setSavingStatus(false); }
  };

  const handleDeleteFicha = async () => {
    if (!confirm('🚨 ¿ELIMINAR PERMANENTEMENTE ESTA FICHA?')) return;
    setSavingStatus(true);
    try {
      await fetch(`${API_URL}/admin/fichas/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      navigate('/admin');
    } catch (e) { alert('Error'); setSavingStatus(false); }
  };

  const handleSaveEdit = async () => {
    setSavingStatus(true);
    try {
      const res = await fetch(`${API_URL}/admin/fichas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(tempData)
      });
      if (!res.ok) {
        const err = await res.json() as any;
        throw new Error(err.error || 'Error al guardar');
      }
      setIsEditing(false); load();
    } catch (e: any) { alert(e.message); }
    finally { setSavingStatus(false); }
  };

  const updateFicha = (name: string, val: any) => {
    setTempData((prev: any) => ({ ...prev, ficha: { ...prev.ficha, [name]: val } }));
  };

  const updateArrayItem = (key: string, index: number, field: string, value: any) => {
    setTempData((prev: any) => {
      const newList = [...prev[key]];
      newList[index] = { ...newList[index], [field]: value };
      return { ...prev, [key]: newList };
    });
  };

  const addArrayItem = (key: string, empty: any) => {
    setTempData((prev: any) => ({ ...prev, [key]: [...prev[key], empty] }));
  };

  const removeArrayItem = (key: string, index: number) => {
    setTempData((prev: any) => {
      const newList = [...prev[key]];
      newList.splice(index, 1);
      return { ...prev, [key]: newList };
    });
  };

  if (!data || !tempData) return <div style={{ padding: '4rem', textAlign: 'center' }}>Cargando detalles...</div>;

  const { ficha, escolaridad, padres, hermanos, convivientes } = isEditing ? tempData : data;
  const isWhatsApp = ficha.contacto_entrevista_medio === 'WhatsApp';
  const waLink = isWhatsApp ? `https://wa.me/${ficha.contacto_entrevista_dato?.replace(/\D/g,'')}?text=Hola ${ficha.contacto_entrevista_nombre}, nos comunicamos de la Escuela La Cecilia...` : null;

  const EditField = ({ label, name, type = 'text', full = false, options = null }: { label: string, name: string, type?: string, full?: boolean, options?: {v:any, l:string}[] | null }) => {
    const val = ficha[name];
    if (!isEditing) {
      let displayVal = val;
      if (type === 'date' && val) displayVal = val;
      if (options) displayVal = options.find(o => o.v == val)?.l || val;
      if (name === 'posee_discapacidad' || name === 'tiene_cud' || name === 'repitente') displayVal = val ? 'SÍ' : 'NO';
      
      return (
        <div className={full ? 'full-print' : ''}>
          <strong>{label}:</strong> {displayVal || '-'}
        </div>
      );
    }

    return (
      <div className={full ? 'full-print' : ''} style={{ marginBottom: '0.5rem' }}>
        <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '0.1rem' }}>{label}</label>
        {options ? (
          <select name={name} value={val || ''} onChange={e => updateFicha(name, e.target.value)} className="form-select" style={{ padding: '0.25rem' }}>
            <option value="">Seleccionar...</option>
            {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        ) : type === 'textarea' ? (
          <textarea name={name} value={val || ''} onChange={e => updateFicha(name, e.target.value)} className="form-textarea" style={{ padding: '0.25rem', minHeight: '60px' }} />
        ) : (
          <input type={type} name={name} value={val || ''} onChange={e => updateFicha(name, e.target.value)} className="form-input" style={{ padding: '0.25rem' }} />
        )}
      </div>
    );
  };

  return (
    <div className="animate-in">
      <style>{`
        @media print {
          @page { margin: 1cm; size: portrait; }
          .no-print { display: none !important; }
          body { background: white !important; font-size: 9pt !important; color: #1e293b !important; }
          .card { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
          .section-print { margin-bottom: 1.25rem; page-break-inside: avoid; border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; }
          .section-title-print { background: #1C3F60 !important; color: white !important; padding: 0.4rem 1rem; font-weight: 800; text-transform: uppercase; font-size: 9pt; letter-spacing: 0.05em; -webkit-print-color-adjust: exact; border-bottom: 1px solid #cbd5e1; }
          .grid-print { display: grid; grid-template-columns: 1fr 1fr; gap: 0.25rem 1rem; padding: 0.75rem 1rem; }
          .full-print { grid-column: 1 / -1; }
          .print-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; border-bottom: 2px solid #1C3F60; padding-bottom: 0.75rem; }
          h1 { font-size: 16pt; margin: 0; color: #1C3F60 !important; font-weight: 800; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #e2e8f0; padding: 0.4rem; text-align: left; }
          th { background: #f8fafc !important; font-weight: 700; color: #64748b; font-size: 7pt; text-transform: uppercase; -webkit-print-color-adjust: exact; }
          td { font-size: 8.5pt; }
        }
        .admin-edit-table input, .admin-edit-table select { width: 100%; border: 1px solid #e2e8f0; padding: 0.25rem; border-radius: 4px; }
      `}</style>

      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', background: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', position: 'sticky', top: 'var(--header-height)', zIndex: 10, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={() => navigate('/admin')}><ArrowLeft size={18} /> Volver</button>
          <button className="btn btn-primary" onClick={() => window.print()}><Printer size={18} /> Imprimir</button>
          <button className={`btn ${isEditing ? 'btn-accent' : 'btn-outline'}`} onClick={() => setIsEditing(!isEditing)}><Edit3 size={18} /> {isEditing ? 'Cancelar' : 'Editar'}</button>
          {isEditing && <button className="btn btn-primary" onClick={handleSaveEdit} disabled={savingStatus} style={{ background: '#059669' }}><Save size={18} /> {savingStatus ? 'Guardando...' : 'Guardar'}</button>}
          <button className="btn btn-ghost" onClick={handleDeleteFicha} style={{ color: 'var(--error)' }}><Trash2 size={18} /> Eliminar</button>
        </div>
        {waLink && <a href={waLink} target="_blank" rel="noreferrer" className="btn btn-accent" style={{ background: '#25D366' }}><MessageCircle size={18} /> WhatsApp</a>}
      </div>

      <div id="print-area">
        <header className="print-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src="/logo.jpg" alt="Logo" style={{ width: '50px' }} />
            <div>
              <h1 style={{ color: 'var(--primary)' }}>Ficha de Inscripción #{ficha.id}</h1>
              <p style={{ fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Escuela La Cecilia · Ciclo {ficha.ciclo_lectivo}</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <EditField label="Estado" name="estado" options={[{v:'pendiente', l:'PENDIENTE'}, {v:'contactado', l:'CONTACTADO'}, {v:'entrevista_programada', l:'ENTREVISTA'}, {v:'finalizado', l:'FINALIZADO'}, {v:'cancelado', l:'CANCELADO'}]} />
            <p style={{ fontSize: '0.8rem' }}>Solicitud: {new Date(ficha.fecha_solicitud).toLocaleDateString('es-AR')}</p>
          </div>
        </header>

        <section className="section-print">
          <h3 className="section-title-print">Datos del Alumno</h3>
          <div className="grid-print">
            <EditField label="Apellido" name="apellido" full />
            <EditField label="Nombre" name="nombre" full />
            <EditField label="DNI Tipo" name="dni_tipo" options={[{v:'DNI', l:'DNI'}, {v:'Pasaporte', l:'Pasaporte'}, {v:'Cédula', l:'Cédula'}]} />
            <EditField label="DNI Número" name="dni_nro" />
            <EditField label="Nivel" name="nivel_ingreso" options={[{v:'Nivel Inicial', l:'Nivel Inicial'}, {v:'EPO (Primaria)', l:'EPO (Primaria)'}, {v:'ESO (Secundaria)', l:'ESO (Secundaria)'}]} />
            <EditField label="Grado/Año" name="grado_anio" />
            <EditField label="Repitente" name="repitente" options={[{v:1, l:'SÍ'}, {v:0, l:'NO'}]} />
            <EditField label="Nacimiento" name="fecha_nac" type="date" />
            <EditField label="Lugar Nac." name="lugar_nac" />
            <EditField label="Sexo" name="sexo" options={[{v:'Femenino', l:'Femenino'}, {v:'Masculino', l:'Masculino'}, {v:'No binario', l:'No binario'}]} />
            <EditField label="Dirección" name="direccion" full />
            <EditField label="Localidad" name="localidad" />
            <EditField label="Provincia" name="provincia" />
            <EditField label="País" name="pais" />
            <EditField label="CP" name="cp" />
            <EditField label="Teléfono" name="telefono_alumno" />
            <EditField label="Email" name="email_alumno" />
          </div>
        </section>

        <section className="section-print" style={{ border: '2px solid var(--accent)', background: 'var(--accent-soft)' }}>
          <h3 className="section-title-print" style={{ background: 'var(--accent) !important' }}>Contacto para Entrevista (Coordinación)</h3>
          <div className="grid-print">
            <EditField label="Nombre de Contacto" name="contacto_entrevista_nombre" full />
            <EditField label="Medio de Contacto" name="contacto_entrevista_medio" options={[{v:'WhatsApp', l:'WhatsApp'}, {v:'Teléfono', l:'Teléfono'}, {v:'Email', l:'Email'}]} />
            <EditField label="Dato de Contacto" name="contacto_entrevista_dato" />
          </div>
        </section>

        <section className="section-print">
          <h3 className="section-title-print">Salud y CUD</h3>
          <div className="grid-print">
            <EditField label="Detalles de Salud" name="salud_detalles" type="textarea" full />
            <EditField label="Embarazo/Parto" name="embarazo_parto" type="textarea" full />
            <EditField label="Obra Social" name="obra_social" />
            <EditField label="¿Tiene Discapacidad?" name="posee_discapacidad" options={[{v:1, l:'SÍ'}, {v:0, l:'NO'}]} />
            {(isEditing ? ficha?.posee_discapacidad : data.ficha.posee_discapacidad) && (
              <>
                <EditField label="Especif. Discapacidad" name="discapacidad" full />
                <EditField label="¿Tiene CUD?" name="tiene_cud" options={[{v:1, l:'SÍ'}, {v:0, l:'NO'}]} />
              </>
            )}
          </div>
        </section>

        <section className="section-print">
          <h3 className="section-title-print">Escolaridad Previa</h3>
          <table className="admin-edit-table">
            <thead>
              <tr><th>Nivel/Grado</th><th>Institución</th><th>Año</th><th>Observaciones</th></tr>
            </thead>
            <tbody>
              {escolaridad.map((e: any, i: number) => (
                <tr key={i}>
                  <td><strong>{e.nivel}</strong></td>
                  <td>
                    {isEditing ? (
                      <input value={e.escuela || ''} onChange={v => updateArrayItem('escolaridad', i, 'escuela', v.target.value)} />
                    ) : (e.escuela || '-')}
                  </td>
                  <td>
                    {isEditing ? (
                      <input value={e.anio_cursado || ''} onChange={v => updateArrayItem('escolaridad', i, 'anio_cursado', v.target.value)} />
                    ) : (e.anio_cursado || '-')}
                  </td>
                  <td>
                    {isEditing ? (
                      <input value={e.observaciones || ''} onChange={v => updateArrayItem('escolaridad', i, 'observaciones', v.target.value)} />
                    ) : (e.observaciones || '-')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="section-print">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1C3F60', color: 'white', padding: '0.4rem 1rem' }}>
            <h3 style={{ margin: 0, textTransform: 'uppercase', fontSize: '9pt', fontWeight: 800 }}>Responsables y Tutores</h3>
            {isEditing && (
              <button className="btn btn-ghost no-print" style={{ color: 'white', padding: '0.2rem' }} onClick={() => addArrayItem('padres', { rol: '', apellido: '', nombre: '', dni_nro: '', direccion: '', localidad: '', provincia: 'Santa Fe', pais: 'Argentina', cp: '', telefono_casa: '', celular: '', email: '', profesion_ocupacion: '', empresa_laboral: '' })}>
                <Plus size={16} /> Agregar
              </button>
            )}
          </div>
          {padres.map((p: any, i: number) => (
            <div key={i} style={{ borderTop: i > 0 ? '1px solid #e2e8f0' : 'none', padding: '1rem' }}>
              <div className="grid-print">
                <div className="full-print" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {isEditing ? (
                    <select value={p.rol || ''} onChange={v => updateArrayItem('padres', i, 'rol', v.target.value)} style={{ fontWeight: 800, color: 'var(--primary)', border: 'none', background: 'transparent' }}>
                      <option value="">Vínculo...</option>
                      <option value="Madre">Madre</option>
                      <option value="Padre">Padre</option>
                      <option value="Tutor/a">Tutor/a</option>
                      <option value="Otro">Otro</option>
                    </select>
                  ) : <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{p.rol?.toUpperCase()}</span>}
                  {isEditing && <button className="btn btn-ghost no-print" style={{ color: 'var(--error)' }} onClick={() => removeArrayItem('padres', i)}><Trash2 size={16} /></button>}
                </div>
                {/* Campos de Responsable */}
                {isEditing ? (
                  <>
                    <div className="form-group"><label className="form-label">Apellido</label><input value={p.apellido || ''} onChange={v => updateArrayItem('padres', i, 'apellido', v.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Nombre</label><input value={p.nombre || ''} onChange={v => updateArrayItem('padres', i, 'nombre', v.target.value)} /></div>
                    <div className="form-group"><label className="form-label">DNI</label><input value={p.dni_nro || ''} onChange={v => updateArrayItem('padres', i, 'dni_nro', v.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Celular</label><input value={p.celular || ''} onChange={v => updateArrayItem('padres', i, 'celular', v.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Tel. Casa</label><input value={p.telefono_casa || ''} onChange={v => updateArrayItem('padres', i, 'telefono_casa', v.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Email</label><input value={p.email || ''} onChange={v => updateArrayItem('padres', i, 'email', v.target.value)} /></div>
                    <div className="form-group full-print"><label className="form-label">Dirección</label><input value={p.direccion || ''} onChange={v => updateArrayItem('padres', i, 'direccion', v.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Localidad</label><input value={p.localidad || ''} onChange={v => updateArrayItem('padres', i, 'localidad', v.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Ocupación</label><input value={p.profesion_ocupacion || ''} onChange={v => updateArrayItem('padres', i, 'profesion_ocupacion', v.target.value)} /></div>
                  </>
                ) : (
                  <>
                    <div><strong>Nombre:</strong> {p.apellido}, {p.nombre}</div>
                    <div><strong>DNI:</strong> {p.dni_nro}</div>
                    <div><strong>Contacto:</strong> {p.celular} / {p.telefono_casa}</div>
                    <div><strong>Email:</strong> {p.email}</div>
                    <div className="full-print"><strong>Domicilio:</strong> {p.direccion}, {p.localidad}</div>
                    <div><strong>Ocupación:</strong> {p.profesion_ocupacion}</div>
                  </>
                )}
              </div>
            </div>
          ))}
        </section>

        <section className="section-print">
          <h3 className="section-title-print">Antecedentes y Motivación</h3>
          <div className="grid-print">
            <EditField label="Motivo Elección" name="motivo_eleccion" type="textarea" full />
            <EditField label="Socioeconómico" name="situacion_socioeconomica" options={[{v:'Muy buena', l:'Muy buena'}, {v:'Buena', l:'Buena'}, {v:'Regular', l:'Regular'}, {v:'Mala', l:'Mala'}]} />
            <EditField label="Otros Datos" name="otros_datos" type="textarea" full />
            <EditField label="Prob. Aprendizaje" name="problemas_aprendizaje" type="textarea" full />
            <EditField label="Otras Actividades" name="otras_actividades" type="textarea" full />
          </div>
        </section>

        <section className="section-print">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1C3F60', color: 'white', padding: '0.4rem 1rem' }}>
            <h3 style={{ margin: 0, textTransform: 'uppercase', fontSize: '9pt', fontWeight: 800 }}>Grupo Familiar y Otros Convivientes</h3>
            {isEditing && (
              <button className="btn btn-ghost no-print" style={{ color: 'white', padding: '0.2rem' }} onClick={() => addArrayItem('hermanos', { vinculo: '', nombre_apellido: '', dni_nro: '', fecha_nac: '', estudios_escuela: '' })}>
                <Plus size={16} /> Agregar
              </button>
            )}
          </div>
          <table className="admin-edit-table">
            <thead>
              <tr><th>Vínculo</th><th>Nombre</th><th>DNI / Edad</th><th>Escuela / Ocupación</th><th className="no-print"></th></tr>
            </thead>
            <tbody>
              {hermanos.map((h: any, i: number) => (
                <tr key={i}>
                  <td>{isEditing ? <input value={h.vinculo || ''} onChange={v => updateArrayItem('hermanos', i, 'vinculo', v.target.value)} /> : h.vinculo}</td>
                  <td>{isEditing ? <input value={h.nombre_apellido || ''} onChange={v => updateArrayItem('hermanos', i, 'nombre_apellido', v.target.value)} /> : h.nombre_apellido}</td>
                  <td>{isEditing ? <input value={h.dni_nro || h.fecha_nac || ''} onChange={v => updateArrayItem('hermanos', i, 'dni_nro', v.target.value)} /> : (h.dni_nro || h.fecha_nac)}</td>
                  <td>{isEditing ? <input value={h.estudios_escuela || ''} onChange={v => updateArrayItem('hermanos', i, 'estudios_escuela', v.target.value)} /> : h.estudios_escuela}</td>
                  <td className="no-print">{isEditing && <button className="btn btn-ghost" style={{ color: 'var(--error)' }} onClick={() => removeArrayItem('hermanos', i)}><Trash2 size={16} /></button>}</td>
                </tr>
              ))}
              {convivientes.map((c: any, i: number) => (
                <tr key={`c-${i}`}>
                  <td>{isEditing ? <input value={c.vinculo || ''} onChange={v => updateArrayItem('convivientes', i, 'vinculo', v.target.value)} /> : c.vinculo}</td>
                  <td>{isEditing ? <input value={c.nombre_apellido || ''} onChange={v => updateArrayItem('convivientes', i, 'nombre_apellido', v.target.value)} /> : c.nombre_apellido}</td>
                  <td>{isEditing ? <input value={c.edad || ''} onChange={v => updateArrayItem('convivientes', i, 'edad', v.target.value)} /> : `${c.edad} años`}</td>
                  <td>{isEditing ? <input value={c.observaciones || ''} onChange={v => updateArrayItem('convivientes', i, 'observaciones', v.target.value)} /> : c.observaciones}</td>
                  <td className="no-print">{isEditing && <button className="btn btn-ghost" style={{ color: 'var(--error)' }} onClick={() => removeArrayItem('convivientes', i)}><Trash2 size={16} /></button>}</td>
                </tr>
              ))}
              {hermanos.length === 0 && convivientes.length === 0 && <tr><td colSpan={5} style={{textAlign:'center'}}>No se registraron otros familiares.</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="section-print no-print" style={{ background: '#FEF9C3', marginBottom: '4rem' }}>
          <h3 className="section-title-print">Notas Administrativas (Privado)</h3>
          <div style={{ padding: '1rem' }}>
            <textarea className="form-textarea" style={{ background: 'transparent', border: 'none', minHeight: '100px' }} value={ficha.observaciones_generales || ''} onChange={e => updateFicha('observaciones_generales', e.target.value)} />
          </div>
        </section>
      </div>

      <section className="no-print" style={{ marginTop: '2rem' }}>
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ margin: 0 }}><Calendar size={24} /> Próximas Entrevistas</h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nueva Cita</label>
                <input type="datetime-local" className="form-input" value={agendaDate} onChange={e => setAgendaDate(e.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={handleAgendar} disabled={savingStatus}>Programar</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {entrevistas.map((ev: any) => (
              <div key={ev.id} className="card" style={{ padding: '1.25rem', borderLeft: `6px solid var(--${ev.estado === 'realizada' ? 'success' : (ev.estado === 'cancelada' ? 'error' : 'accent')})` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{new Date(ev.fecha_hora).toLocaleString('es-AR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'})}hs</div>
                    <div className={`badge badge-${ev.estado}`} style={{ marginTop: '0.4rem' }}>{ev.estado}</div>
                    
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Contacto para cita:</div>
                      <div style={{ fontWeight: 700 }}>{ficha.contacto_entrevista_nombre}</div>
                      <div style={{ fontSize: '0.85rem' }}>{ficha.contacto_entrevista_medio}: {ficha.contacto_entrevista_dato}</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="btn btn-primary" style={{ padding: '0.5rem' }} onClick={() => setSelectedEntrevista(ev)} title="Gestionar"><Edit3 size={18} /></button>
                    <button className="btn btn-ghost" style={{ color: 'var(--error)', padding: '0.5rem' }} onClick={() => handleDeleteEntrevista(ev.id)}><Trash2 size={18} /></button>
                  </div>
                </div>
              </div>
            ))}
            {entrevistas.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', gridColumn: '1/-1' }}>Sin entrevistas programadas.</div>}
          </div>
        </div>
      </section>

      {selectedEntrevista && (
        <GestionarEntrevistaModal entrevista={{...selectedEntrevista, contacto_entrevista_nombre: ficha.contacto_entrevista_nombre, contacto_entrevista_medio: ficha.contacto_entrevista_medio, contacto_entrevista_dato: ficha.contacto_entrevista_dato}} token={token} onClose={() => setSelectedEntrevista(null)} onUpdate={load} />
      )}
    </div>
  );
}

const Agenda = ({ token }: { token: string }) => {
  const [entrevistas, setEntrevistas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'proximas' | 'realizadas' | 'canceladas'>('proximas');
  const [selectedEntrevista, setSelectedEntrevista] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const cargar = () => {
    setLoading(true);
    fetch(`${API_URL}/admin/agenda`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { setEntrevistas(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, [token]);

  const handleBorrarEntrevista = async (id: number) => {
    if (!confirm('¿Eliminar entrevista?')) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/admin/entrevistas/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      cargar();
    } catch (e: any) { alert('Error'); }
    finally { setSaving(false); }
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

  const estadoColor: Record<string, string> = {
    programada: 'var(--accent)',
    movida: 'var(--warning)',
    realizada: 'var(--success)',
    cancelada: 'var(--error)',
  };

  const currentList = activeTab === 'proximas' ? proximas : (activeTab === 'realizadas' ? realizadas : canceladas);
  const grupos = groupByDay(currentList);

  return (
    <div className="animate-in">
      <div className="flex justify-between items-center mb-6">
        <h1>Agenda de Entrevistas</h1>
        <button className="btn btn-outline" onClick={cargar} disabled={loading}><Clock size={16} /> Actualizar</button>
      </div>

      <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '2rem', background: '#f8fafc', padding: '0.35rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', width: 'fit-content' }}>
        {TABS.map(tab => (
          <button key={tab.key} className={`btn ${activeTab === tab.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab(tab.key)}>
            {tab.label} {tab.count > 0 && <span style={{ marginLeft: '0.4rem', background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : 'var(--accent-soft)', color: activeTab === tab.key ? 'white' : 'var(--accent)', borderRadius: '999px', padding: '0 0.45rem', fontSize: '0.75rem', fontWeight: 800 }}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando agenda...</div>
      ) : currentList.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No hay entrevistas en esta categoría.</div>
      ) : (
        Object.entries(grupos).map(([dia, items]) => (
          <div key={dia} style={{ marginBottom: '2.5rem' }}>
            <div className="timeline-day">{dia}</div>
            {items.map((e: any) => (
              <div key={e.id} className="card agenda-card" style={{ padding: '1.25rem', marginBottom: '1rem', borderLeft: `6px solid ${estadoColor[e.estado]}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ background: 'var(--bg)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{new Date(e.fecha_hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '0.2rem' }}>HS</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{e.alumno_apellido}, {e.alumno_nombre}</div>
                      <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--accent)' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Contacto para Cita:</div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{e.contacto_entrevista_nombre || 'Sin nombre'}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{e.contacto_entrevista_medio}: {e.contacto_entrevista_dato || '-'}</div>
                      </div>
                      {e.respuesta && <div style={{ fontSize: '0.8125rem', color: 'var(--success)', fontWeight: 700, marginTop: '0.5rem' }}>💬 Familia: {e.respuesta}</div>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-primary" onClick={() => setSelectedEntrevista(e)}>Gestionar</button>
                    <button className="btn btn-ghost" style={{ color: 'var(--error)', padding: '0.5rem' }} onClick={() => handleBorrarEntrevista(e.id)} disabled={saving}><Trash2 size={18} /></button>
                    <Link to={`/admin/ficha/${e.ficha_id}`} className="btn btn-outline" style={{ padding: '0.5rem' }}><ChevronRight size={18} /></Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      {selectedEntrevista && (
        <GestionarEntrevistaModal entrevista={selectedEntrevista} token={token} onClose={() => setSelectedEntrevista(null)} onUpdate={cargar} />
      )}
    </div>
  );
}

export default AdminPanel;
