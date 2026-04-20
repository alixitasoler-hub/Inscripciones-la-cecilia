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
  Edit2
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
          
          <div className="card" style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'var(--primary)', color: 'white' }}>
            <h4 style={{ color: 'white', fontSize: '0.875rem' }}>Ayuda</h4>
            <p style={{ fontSize: '0.8125rem', opacity: 0.8, marginTop: '0.5rem' }}>Si tiene problemas con el sistema, contacte al soporte técnico.</p>
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
  const [filterStatus, setFilterStatus] = useState('');
  
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
      const matchStatus = filterStatus ? f.estado === filterStatus : true;
      return matchSearch && matchLevel && matchStatus;
    });
  }, [fichas, search, filterLevel, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: fichas.length,
      pendientes: fichas.filter(f => f.estado === 'pendiente').length,
      programadas: fichas.filter(f => f.estado === 'entrevista_programada').length,
      finalizadas: fichas.filter(f => f.estado === 'finalizado').length
    };
  }, [fichas]);

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

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Total Solicitudes</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--accent)' }}>
          <span className="stat-label">Pendientes</span>
          <span className="stat-value">{stats.pendientes}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--info)' }}>
          <span className="stat-label">Entrevistas</span>
          <span className="stat-value">{stats.programadas}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <span className="stat-label">Finalizadas</span>
          <span className="stat-value">{stats.finalizadas}</span>
        </div>
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
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredFichas.map(f => (
                <tr key={f.id}>
                  <td>{new Date(f.fecha_solicitud).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 600 }}>{f.apellido}, {f.nombre}</td>
                  <td>{f.nivel_ingreso} <br/> <small style={{color:'var(--text-muted)'}}>{f.grado_anio}</small></td>
                  <td><span className={`badge badge-${f.estado}`}>{f.estado.replace('_', ' ')}</span></td>
                  <td>
                    <button className="btn btn-ghost" onClick={() => navigate(`/admin/ficha/${f.id}`)}>
                      Ver Detalles <ChevronRight size={16} />
                    </button>
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
    </div>
  );
};

const Agenda = ({ token }: { token: string }) => {
  const [entrevistas, setEntrevistas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(`${API_URL}/admin/agenda`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setEntrevistas(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  return (
    <div className="animate-in">
      <div className="flex justify-between items-center mb-6">
        <h1>Agenda de Entrevistas</h1>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>Cargando agenda...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {entrevistas.length > 0 ? entrevistas.map(e => (
            <div key={e.id} className="card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ background: 'var(--accent-soft)', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center', minWidth: '90px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
                    {new Date(e.fecha_hora).toLocaleDateString(undefined, { month: 'short' })}
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', lineHeight: 1 }}>
                    {new Date(e.fecha_hora).getDate()}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{new Date(e.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}hs</div>
                  <div style={{ color: 'var(--primary)', fontWeight: 500 }}>{e.alumno_apellido}, {e.alumno_nombre}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>DNI: {e.alumno_dni}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                 <Link to={`/admin/ficha/${e.ficha_id}`} className="btn btn-outline" style={{ fontSize: '0.8125rem' }}>
                  <Edit2 size={16} /> Ver Ficha / Notas
                </Link>
                {/* Botón WhatsApp rápido */}
                <a 
                  href={`https://wa.me/?text=Hola, nos comunicamos de la Escuela La Cecilia por su solicitud de ingreso...`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn btn-ghost" 
                  style={{ color: '#25D366' }}
                >
                  <MessageCircle size={20} />
                </a>
              </div>
            </div>
          )) : (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No hay entrevistas programadas próximamente.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const DetalleFicha = ({ token }: { token: string }) => {
  const [data, setData] = useState<any>(null);
  const [agendaDate, setAgendaDate] = useState('');
  const [agendaNotes, setAgendaNotes] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  
  const location = useLocation();
  const id = location.pathname.split('/').pop();
  const navigate = useNavigate();

  const load = () => {
    fetch(`${API_URL}/admin/fichas/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json()).then(setData);
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
    setSavingStatus(true);
    try {
      await fetch(`${API_URL}/admin/entrevistas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ficha_id: id, fecha_hora: agendaDate, notas: agendaNotes })
      });
      setAgendaDate('');
      setAgendaNotes('');
      load();
    } catch (e) {
      alert('Error al programar');
    } finally {
      setSavingStatus(false);
    }
  }

  const handlePrint = () => { window.print(); };

  if (!data) return <div style={{ padding: '4rem', textAlign: 'center' }}>Cargando detalles de la ficha...</div>;

  const contactData = data.ficha.contacto_entrevista_dato || '';
  const isWhatsApp = data.ficha.contacto_entrevista_medio === 'WhatsApp';
  const isEmail = data.ficha.contacto_entrevista_medio === 'Email';

  const waLink = isWhatsApp ? `https://wa.me/${contactData.replace(/\D/g,'')}?text=Hola ${data.ficha.contacto_entrevista_nombre}, nos comunicamos de la Escuela La Cecilia por su solicitud de ingreso de ${data.ficha.nombre} ${data.ficha.apellido}.` : null;
  const mailLink = isEmail ? `mailto:${contactData}?subject=Solicitud de Ingreso - Escuela La Cecilia&body=Hola ${data.ficha.contacto_entrevista_nombre}, ...` : null;

  return (
    <div className="animate-in">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; font-size: 10pt !important; color: black !important; }
          .card { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
          .section-print { margin-bottom: 2rem; page-break-inside: avoid; border: 1.5px solid #1C3F60; }
          .section-title-print { background: #1C3F60 !important; color: white !important; padding: 0.5rem 1rem; font-weight: bold; text-transform: uppercase; }
          .grid-print { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; padding: 1.25rem; }
          .full-print { grid-column: 1 / -1; }
          h1 { font-size: 18pt; margin-bottom: 0.5rem; color: #1C3F60 !important; }
          table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
          th, td { border: 1px solid #1C3F60; padding: 0.5rem; text-align: left; }
          th { background: #F3F4F6 !important; }
        }
      `}</style>

      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', background: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', position: 'sticky', top: 'var(--header-height)', zIndex: 10 }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={() => navigate('/admin')}>
            <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> Volver
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={18} /> Imprimir / PDF
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {waLink && <a href={waLink} target="_blank" rel="noreferrer" className="btn btn-accent" style={{ background: '#25D366' }}><MessageCircle size={18} /> Contactar WhatsApp</a>}
          {mailLink && <a href={mailLink} className="btn btn-accent" style={{ background: '#3B82F6' }}><Mail size={18} /> Enviar Email</a>}
        </div>
      </div>

      <div id="print-area">
        <header style={{textAlign: 'center', marginBottom: '3rem'}}>
          <h1 style={{textTransform: 'uppercase', letterSpacing: '0.05em'}}>Ficha de Inscripción</h1>
          <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>LA CECILIA - Escuela de la Nueva Cultura</p>
          <div style={{ marginTop: '1rem', display: 'inline-block', padding: '0.5rem 1.5rem', background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>
            CICLO LECTIVO: {data.ficha.ciclo_lectivo}
          </div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Fecha de Emisión: {new Date().toLocaleDateString()}</p>
        </header>

        {/* RESUMEN ADMINISTRATIVO - SOLO VISIBLE EN PANTALLA O ARRIBA EN PRINT */}
        <div className="no-print card" style={{ background: 'var(--bg-main)', border: '1px solid var(--primary)', marginBottom: '2.5rem', padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label className="form-label">Estado de la Solicitud</label>
              <select 
                className="form-select" 
                value={data.ficha.estado} 
                disabled={savingStatus}
                onChange={e => updateFicha({ estado: e.target.value })}
              >
                <option value="pendiente">Pendiente</option>
                <option value="contactado">Contactado</option>
                <option value="entrevista_programada">Entrevista Programada</option>
                <option value="finalizado">Finalizado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="form-label">Decisión Final</label>
              <select 
                className="form-select" 
                value={data.ficha.decision_final || ''} 
                disabled={savingStatus}
                style={{ borderColor: data.ficha.decision_final === 'ingresa' ? 'var(--success)' : (data.ficha.decision_final === 'no_ingresa' ? 'var(--error)' : 'var(--border-color)') }}
                onChange={e => updateFicha({ decision_final: e.target.value })}
              >
                <option value="">Pendiente de Decisión</option>
                <option value="ingresa">✔️ INGRESARÁ</option>
                <option value="no_ingresa">❌ NO INGRESARÁ</option>
                <option value="espera">⏳ LISTA DE ESPERA</option>
              </select>
            </div>
            <div>
              <label className="form-label">DNI Alumno</label>
              <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{data.ficha.dni_nro}</div>
            </div>
          </div>
        </div>

        {/* ALUMNO */}
        <section className="section-print animate-in" style={{marginBottom: '2.5rem'}}>
          <h3 className="section-title-print">I. Datos del Alumno</h3>
          <div className="grid-print">
            <p className="full-print"><strong>Nombre Completo:</strong> {data.ficha.apellido}, {data.ficha.nombre}</p>
            <p><strong>Documento:</strong> {data.ficha.dni_tipo} {data.ficha.dni_nro}</p>
            <p><strong>Sexo:</strong> {data.ficha.sexo}</p>
            <p><strong>Fecha de Nacimiento:</strong> {data.ficha.fecha_nac}</p>
            <p><strong>Lugar de Nacimiento:</strong> {data.ficha.lugar_nac}</p>
            <p className="full-print"><strong>Dirección:</strong> {data.ficha.direccion}, {data.ficha.localidad} ({data.ficha.cp}) - {data.ficha.provincia}</p>
            <p><strong>Nivel a Ingresar:</strong> {data.ficha.nivel_ingreso}</p>
            <p><strong>Grado/Año:</strong> {data.ficha.grado_anio} {data.ficha.repitente ? '(Repitente)' : ''}</p>
            <p className="full-print"><strong>Observaciones de Nivel:</strong> {data.ficha.observaciones_level || '-'}</p>
            
            <div className="full-print" style={{marginTop: '0.75rem', padding: '1rem', background: '#F8FAFC', border: '1px dashed var(--primary)' }}>
                <p style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8125rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Información de Contacto para Entrevista</p>
                <p><strong>Responsable:</strong> {data.ficha.contacto_entrevista_nombre} | <strong>Medio:</strong> {data.ficha.contacto_entrevista_medio} | <strong>Dato:</strong> {data.ficha.contacto_entrevista_dato}</p>
            </div>
          </div>
        </section>

        {/* ESCOLARIDAD */}
        <section className="section-print animate-in" style={{marginBottom: '2.5rem'}}>
          <h3 className="section-title-print">II. Escolaridad Previa</h3>
          <div style={{ padding: '1rem' }}>
            <table className="admin-table">
              <thead><tr><th>Nivel</th><th>Escuela / Institución</th><th>Año</th><th>Observaciones</th></tr></thead>
              <tbody>
                {data.escolaridad.map((e: any, i: number) => (
                  <tr key={i}><td>{e.nivel}</td><td>{e.escuela}</td><td>{e.anio_cursado}</td><td>{e.observaciones}</td></tr>
                ))}
                {data.escolaridad.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center' }}>No registra escolaridad previa.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        {/* PADRES */}
        <section className="section-print animate-in" style={{marginBottom: '2.5rem'}}>
          <h3 className="section-title-print">III. Padres / Tutores Responsables</h3>
          {data.padres.map((p: any, i: number) => (
            <div key={i} style={{ borderBottom: i < data.padres.length - 1 ? '1px solid #1C3F60' : 'none', padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <p className="full-print"><strong>{p.rol || 'Responsable'}:</strong> {p.apellido}, {p.nombre} (DNI: {p.dni_nro})</p>
                <p><strong>Estado Civil:</strong> {p.estado_civil}</p>
                <p><strong>Nacimiento:</strong> {p.fecha_nac} ({p.lugar_nac_datos})</p>
                <p className="full-print"><strong>Domicilio:</strong> {p.domicilio_datos}</p>
                <p><strong>Celular:</strong> {p.celular}</p>
                <p><strong>Email:</strong> {p.email}</p>
                <p className="full-print"><strong>Labor:</strong> {p.profesion_ocupacion} en {p.empresa_laboral || 'N/A'}</p>
              </div>
            </div>
          ))}
        </section>

        {/* SALUD Y OTROS */}
        <section className="section-print animate-in" style={{marginBottom: '2.5rem'}}>
          <h3 className="section-title-print">IV. Otros Antecedentes</h3>
          <div className="grid-print">
            <p className="full-print"><strong>Detalles de Salud:</strong> {data.ficha.salud_detalles || '-'}</p>
            <p><strong>Obra Social:</strong> {data.ficha.obra_social || 'No posee'}</p>
            <p><strong>Discapacidad:</strong> {data.ficha.discapacidad || 'No'} {data.ficha.tiene_cud ? '(Posee CUD)' : ''}</p>
            <p className="full-print"><strong>Problemáticas de Aprendizaje:</strong> {data.ficha.problemas_aprendizaje || '-'}</p>
            <p className="full-print"><strong>Motivo de Elección:</strong> {data.ficha.motivo_eleccion || '-'}</p>
          </div>
        </section>

        {/* FAMILIA */}
        <section className="section-print animate-in" style={{marginBottom: '2.5rem'}}>
          <h3 className="section-title-print">V. Grupo Familiar</h3>
          <div style={{ padding: '1.25rem' }}>
             <p style={{ marginBottom: '1rem' }}><strong>Situación Socioeconómica:</strong> {data.ficha.situacion_socioeconomica}</p>
             
             {data.hermanos.length > 0 && (
               <div style={{ marginBottom: '1.5rem' }}>
                 <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Hermanos:</p>
                 <table style={{ width: '100%', fontSize: '0.875rem' }}>
                    <thead><tr><th>Nombre</th><th>DNI</th><th>F. Nacimiento</th><th>Escuela</th></tr></thead>
                    <tbody>
                      {data.hermanos.map((h: any, i: number) => (
                        <tr key={i}><td>{h.nombre_apellido}</td><td>{h.dni_nro}</td><td>{h.fecha_nac}</td><td>{h.estudios_escuela}</td></tr>
                      ))}
                    </tbody>
                 </table>
               </div>
             )}
             
             <p><strong>Otros datos de interés:</strong></p>
             <div style={{ padding: '0.750rem', border: '1px solid #1C3F60', marginTop: '0.5rem', minHeight: '80px', fontSize: '0.875rem' }}>
               {data.ficha.otros_datos || 'No se declaran otros datos.'}
             </div>
          </div>
        </section>

        {/* GESTIÓN DE ENTREVISTA - NO SE IMPRIME */}
        <section className="no-print card animate-in" style={{ background: 'var(--accent-soft)', border: '1.5px dashed var(--accent)', padding: '2rem', marginTop: '3rem' }}>
          <div className="flex items-center gap-2 mb-4">
            <Calendar color="var(--accent)" />
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Gestión Administrativa de Entrevista</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <div className="form-group">
                <label className="form-label">Programar Nueva Cita</label>
                <input 
                  type="datetime-local" 
                  className="form-input" 
                  value={agendaDate} 
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={e => setAgendaDate(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Notas rápidas para la agenda</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Recordatorio: La familia traerá papeles..." 
                  value={agendaNotes} 
                  rows={2}
                  onChange={e => setAgendaNotes(e.target.value)}
                ></textarea>
              </div>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%' }} 
                onClick={handleAgendar}
                disabled={savingStatus}
              >
                {savingStatus ? 'Guardando...' : 'Programar y Guardar Cita'}
              </button>
            </div>
            
            <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '2rem' }}>
              <h4 style={{ fontSize: '0.875rem', marginBottom: '1rem', textTransform: 'uppercase' }}>Historial de Eventos</h4>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {data.entrevistas.length > 0 ? data.entrevistas.map((ev: any, i: number) => (
                  <div key={i} style={{ padding: '0.75rem', background: 'white', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem', fontSize: '0.8125rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700 }}>{new Date(ev.fecha_hora).toLocaleString()}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{ev.notas}</div>
                  </div>
                )) : <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Aún no hay entrevistas programadas.</p>}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminPanel;
