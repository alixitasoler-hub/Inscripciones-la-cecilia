import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  Printer,
  MessageCircle,
  Edit3,
  Save,
  Plus,
  X,
  Trash2,
  ArrowLeft
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://sistema-inscripciones.alixitasoler.workers.dev/api';

const AdminPanel = () => {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('adminUser') || 'null'));
  const [isAuth, setIsAuth] = useState(Boolean(localStorage.getItem('adminToken')));
  const [loginForm, setLoginForm] = useState({ usuario: '', password: '' });
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json() as any;
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        setIsAuth(true);
        setError('');
      } else {
        setError(data.error || 'Credenciales incorrectas');
      }
    } catch (err) { setError('Error de conexión'); }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setToken(''); setUser(null); setIsAuth(false);
  };

  useEffect(() => {
    if (token) {
      try {
        const payload = token.split('.')[0];
        const decoded = atob(payload);
        const parts = decoded.split(':');
        if (parts.length >= 3) {
          const expires = parseInt(parts[2]);
          if (expires < Date.now()) {
            logout();
          }
        }
      } catch (e) {
        logout();
      }
    }
  }, [token]);

  if (!isAuth) {
    return (
      <div className="card animate-in" style={{ maxWidth: '400px', margin: '4rem auto', padding: '2.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <img src="/logo.jpg" alt="Logo Escuela La Cecilia" style={{ width: '120px', height: 'auto', borderRadius: '50%', border: '3px solid var(--accent)', padding: '4px' }} />
        </div>
        <h2>Acceso Administrativo</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Ingrese sus credenciales para continuar.</p>
        {error && <p className="form-error" style={{ background: '#FEE2E2', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginTop: '1rem' }}>{error}</p>}
        <form onSubmit={handleLogin} style={{marginTop: '2rem'}}>
          <div className="form-group">
            <input 
              type="text" 
              className="form-input" 
              placeholder="Usuario" 
              value={loginForm.usuario} 
              onChange={(e) => setLoginForm({...loginForm, usuario: e.target.value})} 
              autoFocus
              style={{marginBottom: '1rem'}}
            />
            <input 
              type="password" 
              className="form-input" 
              placeholder="Contraseña" 
              value={loginForm.password} 
              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Ingresar al Panel</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-layout animate-in full-width">
      <main>
        <React.Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>}>
          <Routes>
            <Route path="/ficha/:id" element={<DetalleFicha token={token} onAuthError={logout} />} />
            <Route path="/*" element={<AdminPanelV2 token={token} onAuthError={logout} user={user} />} />
          </Routes>
        </React.Suspense>
      </main>
    </div>
  );
};

// Lazy imports
const AdminPanelV2 = React.lazy(() => import('./v2/AdminPanelV2'));

// --- COMPONENTES AUXILIARES ---

const EditField = ({ 
  label, 
  name, 
  isEditing, 
  ficha, 
  updateFicha, 
  type = 'text', 
  full = false, 
  options = null 
}: { 
  label: string, 
  name: string, 
  isEditing: boolean, 
  ficha: any, 
  updateFicha: (n: string, v: any) => void,
  type?: string, 
  full?: boolean, 
  options?: {v:any, l:string}[] | null 
}) => {
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
    respuesta: entrevista.respuesta || '',
    decision_final: entrevista.decision_final || ''
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
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
              <label className="form-label">Rta. Familia</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.respuesta} 
                placeholder="Ej: Confirmado"
                onChange={e => setFormData({...formData, respuesta: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{color:'var(--primary)', fontWeight:800}}>Resultado Admisión</label>
              <select 
                className="form-select" 
                value={formData.decision_final} 
                onChange={e => setFormData({...formData, decision_final: e.target.value, estado: e.target.value === 'ingresa' ? 'realizada' : formData.estado})}
                style={{borderColor: formData.decision_final ? 'var(--primary)' : ''}}
              >
                <option value="">Sin definir...</option>
                <option value="ingresa">✅ INGRESA</option>
                <option value="no_ingresa">❌ NO INGRESA</option>
                <option value="espera">⏳ LISTA ESPERA</option>
              </select>
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

const DetalleFicha = ({ token, onAuthError }: { token: string, onAuthError: () => void }) => {
  const [data, setData] = useState<any>(null);
  const [agendaDate, setAgendaDate] = useState('');
  const [agendaNotes, setAgendaNotes] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempData, setTempData] = useState<any>(null);
  const [entrevistas, setEntrevistas] = useState<any[]>([]);
  const [selectedEntrevista, setSelectedEntrevista] = useState<any | null>(null);
  
  const id = useLocation().pathname.split('/').pop();
  const navigate = useNavigate();

  const ORDEN_ESCOLARIDAD = [
    'Sala de 3 años', 'Sala de 4 años', 'Sala de 5 años',
    '1° grado', '2° grado', '3° grado', '4° grado', '5° grado', '6° grado', '7° grado',
    '1° año', '2° año', '3° año', '4° año', '5° año'
  ];

  const load = () => {
    fetch(`${API_URL}/admin/fichas/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => {
        if (res.status === 401) { onAuthError(); throw new Error('No autorizado'); }
        return res.json();
      })
      .then(res => {
        if (res.error) throw new Error(res.error);
        setData(res);
        const fullEscolaridad = ORDEN_ESCOLARIDAD.map(nivel => {
          const existing = res.escolaridad?.find((e: any) => e.nivel === nivel);
          return existing || { nivel, escuela: '', anio_cursado: '', observaciones: '' };
        });
        setTempData({ ...res, escolaridad: fullEscolaridad });
        setEntrevistas(res.entrevistas || []);
      })
      .catch(e => {
        console.error('Error loading ficha:', e);
        if (e.message !== 'No autorizado') alert('Error al cargar la ficha');
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

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isEditing && JSON.stringify(tempData) !== JSON.stringify(data)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEditing, tempData, data]);

  if (!data || !tempData) return <div style={{ padding: '4rem', textAlign: 'center' }}>Cargando detalles...</div>;

  const { ficha, escolaridad, padres } = isEditing ? tempData : data;
  const isWhatsApp = ficha.contacto_entrevista_medio === 'WhatsApp';
  const proximas = entrevistas.filter((e: any) => e.estado === 'programada' || e.estado === 'movida');
  const proxima = proximas.length > 0 ? proximas[0] : null;
  
  let fechaStr = "[fecha]";
  let horaStr = "[hora]";
  
  if (proxima) {
    const dt = new Date(proxima.fecha_hora);
    fechaStr = dt.toLocaleDateString('es-AR');
    horaStr = dt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' hs';
  }

  const alumno = `${ficha.nombre} ${ficha.apellido}`;
  const mensajeWA = `¡Hola!\nHemos recibido la solicitud de inscripción de ${alumno}. Te proponemos realizar la entrevista el día ${fechaStr} a las ${horaStr}.\nTe pedimos confirmar la disponibilidad para ese horario. \nEn caso de no poder asistir, agradeceremos que nos avises con anticipación por este mismo medio.\nMuchas gracias.`;

  const waLink = isWhatsApp ? `https://wa.me/${ficha.contacto_entrevista_dato?.replace(/\D/g,'')}?text=${encodeURIComponent(mensajeWA)}` : null;

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
            <EditField label="Estado" name="estado" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} options={[{v:'pendiente', l:'PENDIENTE'}, {v:'leida', l:'LEÍDA'}, {v:'contactado', l:'CONTACTADO'}, {v:'entrevistado', l:'ENTREVISTADO'}, {v:'admitido', l:'ADMITIDO'}, {v:'finalizado', l:'FINALIZADO'}, {v:'cancelado', l:'CANCELADO'}]} />
            <p style={{ fontSize: '0.8rem' }}>Solicitud: {new Date(ficha.fecha_solicitud || ficha.created_at).toLocaleDateString('es-AR')}</p>
          </div>
        </header>

        <section className="section-print">
          <h3 className="section-title-print">Datos del Alumno</h3>
          <div className="grid-print">
            <EditField label="Apellido" name="apellido" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} full />
            <EditField label="Nombre" name="nombre" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} full />
            <EditField label="DNI Tipo" name="dni_tipo" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} options={[{v:'DNI', l:'DNI'}, {v:'Pasaporte', l:'Pasaporte'}, {v:'Cédula', l:'Cédula'}]} />
            <EditField label="DNI Número" name="dni_nro" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} />
            <EditField label="Nivel" name="nivel_ingreso" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} options={[{v:'Nivel Inicial', l:'Nivel Inicial'}, {v:'EPO (Primaria)', l:'EPO (Primaria)'}, {v:'ESO (Secundaria)', l:'ESO (Secundaria)'}]} />
            <EditField label="Grado/Año" name="grado_anio" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} />
            <EditField label="Repitente" name="repitente" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} options={[{v:1, l:'SÍ'}, {v:0, l:'NO'}]} />
            <EditField label="Nacimiento" name="fecha_nac" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} type="date" />
            <EditField label="Lugar Nac." name="lugar_nac" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} />
            <EditField label="Sexo" name="sexo" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} options={[{v:'Femenino', l:'Femenino'}, {v:'Masculino', l:'Masculino'}, {v:'No binario', l:'No binario'}]} />
            <EditField label="Dirección" name="direccion" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} full />
            <EditField label="Localidad" name="localidad" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} />
            <EditField label="Provincia" name="provincia" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} />
            <EditField label="País" name="pais" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} />
            <EditField label="CP" name="cp" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} />
            <EditField label="Teléfono" name="telefono_alumno" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} />
            <EditField label="Email" name="email_alumno" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} />
          </div>
        </section>

        <section className="section-print" style={{ border: '2px solid var(--accent)', background: 'var(--accent-soft)' }}>
          <h3 className="section-title-print" style={{ background: 'var(--accent) !important' }}>Contacto para Entrevista</h3>
          <div className="grid-print">
            <EditField label="Nombre de Contacto" name="contacto_entrevista_nombre" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} full />
            <EditField label="Medio de Contacto" name="contacto_entrevista_medio" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} options={[{v:'WhatsApp', l:'WhatsApp'}, {v:'Teléfono', l:'Teléfono'}, {v:'Email', l:'Email'}]} />
            <EditField label="Dato de Contacto" name="contacto_entrevista_dato" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} />
          </div>
        </section>

        <section className="section-print">
          <h3 className="section-title-print">Salud y CUD</h3>
          <div className="grid-print">
            <EditField label="Detalles de Salud" name="salud_detalles" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} type="textarea" full />
            <EditField label="Embarazo/Parto" name="embarazo_parto" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} type="textarea" full />
            <EditField label="Obra Social" name="obra_social" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} />
            <EditField label="¿Tiene Discapacidad?" name="posee_discapacidad" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} options={[{v:1, l:'SÍ'}, {v:0, l:'NO'}]} />
            {ficha?.posee_discapacidad && (
              <>
                <EditField label="Especif. Discapacidad" name="discapacidad" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} full />
                <EditField label="¿Tiene CUD?" name="tiene_cud" isEditing={isEditing} ficha={ficha} updateFicha={updateFicha} options={[{v:1, l:'SÍ'}, {v:0, l:'NO'}]} />
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
                  <td>{isEditing ? <input value={e.escuela || ''} onChange={v => updateArrayItem('escolaridad', i, 'escuela', v.target.value)} /> : (e.escuela || '-')}</td>
                  <td>{isEditing ? <input value={e.anio_cursado || ''} onChange={v => updateArrayItem('escolaridad', i, 'anio_cursado', v.target.value)} /> : (e.anio_cursado || '-')}</td>
                  <td>{isEditing ? <input value={e.observaciones || ''} onChange={v => updateArrayItem('escolaridad', i, 'observaciones', v.target.value)} /> : (e.observaciones || '-')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="section-print">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1C3F60', color: 'white', padding: '0.4rem 1rem' }}>
            <h3 style={{ margin: 0, textTransform: 'uppercase', fontSize: '9pt', fontWeight: 800 }}>Responsables y Tutores</h3>
            {isEditing && (
              <button className="btn btn-ghost no-print" style={{ color: 'white', padding: '0.2rem' }} onClick={() => addArrayItem('padres', { rol: '', apellido: '', nombre: '', dni_nro: '', celular: '', email: '' })}>
                <Plus size={16} /> Agregar
              </button>
            )}
          </div>
          {padres.map((p: any, i: number) => (
            <div key={i} style={{ borderTop: i > 0 ? '1px solid #e2e8f0' : 'none', padding: '1rem' }}>
              <div className="grid-print">
                <div className="full-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{p.rol?.toUpperCase() || 'RESPONSABLE'}</span>
                  {isEditing && <button className="btn btn-ghost no-print" style={{ color: 'var(--error)' }} onClick={() => removeArrayItem('padres', i)}><Trash2 size={16} /></button>}
                </div>
                {isEditing ? (
                  <>
                    <div className="form-group"><label className="form-label">Rol</label><input value={p.rol || ''} onChange={v => updateArrayItem('padres', i, 'rol', v.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Apellido</label><input value={p.apellido || ''} onChange={v => updateArrayItem('padres', i, 'apellido', v.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Nombre</label><input value={p.nombre || ''} onChange={v => updateArrayItem('padres', i, 'nombre', v.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Celular</label><input value={p.celular || ''} onChange={v => updateArrayItem('padres', i, 'celular', v.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Email</label><input value={p.email || ''} onChange={v => updateArrayItem('padres', i, 'email', v.target.value)} /></div>
                  </>
                ) : (
                  <>
                    <div><strong>Nombre:</strong> {p.apellido}, {p.nombre}</div>
                    <div><strong>DNI:</strong> {p.dni_nro}</div>
                    <div><strong>Contacto:</strong> {p.celular} / {p.telefono_casa}</div>
                    <div><strong>Email:</strong> {p.email}</div>
                  </>
                )}
              </div>
            </div>
          ))}
        </section>

        <section className="section-print" style={{ pageBreakBefore: 'always' }}>
          <h2 style={{ textAlign: 'center', color: '#1C3F60', marginBottom: '2rem', fontSize: '14pt', fontWeight: 800, textTransform: 'uppercase' }}>Acuerdo de Admisión y Permanencia</h2>
          <div style={{ padding: '0.5rem', fontSize: '8.5pt', lineHeight: '1.4', textAlign: 'justify' }}>
             <p style={{ marginBottom: '1rem' }}>
              Las familias, alumnos y alumnas pueden informarse sobre la filosofía y los fundamentos de la Escuela, así como conocer las condiciones generales que se expresan en documentos tales como “Propósitos de la Escuela”, “Principios de la Escuela”, “Manual de Bienvenida” y “Manual de Procedimientos”, de modo que exista una elección consciente al momento de solicitar la inscripción...
            </p>
            <div style={{ marginTop: '3rem' }}>
              <p style={{ marginBottom: '3rem', fontWeight: 800 }}>NOTIFICACIÓN Y ACUERDO DEL ALUMNO Y LOS PADRES</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>
                <div>
                  <div style={{ width: '100%', borderTop: '1px solid #1e293b', marginBottom: '0.5rem' }}></div>
                  <div style={{ fontWeight: 800, fontSize: '9pt' }}>ALUMNO (firma y aclaración):</div>
                </div>
                <div>
                  <div style={{ width: '100%', borderTop: '1px solid #1e293b', marginBottom: '0.5rem' }}></div>
                  <div style={{ fontWeight: 800, fontSize: '9pt' }}>PADRES (firma y aclaración):</div>
                </div>
              </div>
            </div>
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
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="btn btn-primary" style={{ padding: '0.5rem' }} onClick={() => setSelectedEntrevista(ev)} title="Gestionar"><Edit3 size={18} /></button>
                    <button className="btn btn-ghost" style={{ color: 'var(--error)', padding: '0.5rem' }} onClick={() => handleDeleteEntrevista(ev.id)}><Trash2 size={18} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {selectedEntrevista && (
        <GestionarEntrevistaModal entrevista={{...selectedEntrevista, contacto_entrevista_nombre: ficha.contacto_entrevista_nombre, contacto_entrevista_medio: ficha.contacto_entrevista_medio, contacto_entrevista_dato: ficha.contacto_entrevista_dato}} token={token} onClose={() => setSelectedEntrevista(null)} onUpdate={load} />
      )}
    </div>
  );
}

export default AdminPanel;
