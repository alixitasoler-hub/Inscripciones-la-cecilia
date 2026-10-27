import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Edit3, Save, X, User, Users, BookOpen, Heart, Home, Calendar, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://sistema-inscripciones.alixitasoler.workers.dev/api';

interface FichaDetalleProps {
  token: string;
  onAuthError: () => void;
}

interface InputEditProps {
  campo: string;
  label: string;
  fichaEdit: any;
  setFichaEdit: React.Dispatch<React.SetStateAction<any>>;
}

const InputEdit: React.FC<InputEditProps> = ({ campo, label, fichaEdit, setFichaEdit }) => (
  <div style={{ marginBottom: '1rem' }}>
    <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{label}</div>
    <input
      type="text"
      className="form-input"
      style={{ fontSize: '0.9rem', padding: '0.4rem 0.75rem', width: '100%' }}
      value={fichaEdit[campo] ?? ''}
      onChange={e => setFichaEdit({ ...fichaEdit, [campo]: e.target.value })}
    />
  </div>
);

const RescheduleForm = ({ ev, token, onUpdate }: { ev: any; token: string; onUpdate: () => void }) => {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(new Date(ev.fecha_hora).toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date(ev.fecha_hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }));
  const [notas, setNotas] = useState(ev.notas || '');
  const [estado, setEstado] = useState(ev.estado || 'programada');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/entrevistas/${ev.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          fecha_hora: `${date}T${time}:00`,
          notas,
          estado
        })
      });
      if (!res.ok) throw new Error('Error al reprogramar');
      alert('Entrevista actualizada con éxito');
      setEditing(false);
      onUpdate();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Seguro que deseas eliminar permanentemente esta entrevista?')) return;
    try {
      const res = await fetch(`${API_URL}/admin/entrevistas/${ev.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al eliminar');
      alert('Entrevista eliminada');
      onUpdate();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCancelDirect = async () => {
    if (!confirm('¿Seguro que deseas cancelar esta entrevista?')) return;
    try {
      const res = await fetch(`${API_URL}/admin/entrevistas/${ev.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ estado: 'cancelada' })
      });
      if (!res.ok) throw new Error('Error al cancelar');
      alert('Entrevista cancelada');
      onUpdate();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (editing) {
    return (
      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Fecha</label>
            <input type="date" className="form-input" style={{ fontSize: '0.85rem', padding: '0.3rem' }} value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Hora</label>
            <input type="time" className="form-input" style={{ fontSize: '0.85rem', padding: '0.3rem' }} value={time} onChange={e => setTime(e.target.value)} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Notas</label>
          <input type="text" className="form-input" style={{ fontSize: '0.85rem', padding: '0.3rem' }} value={notas} onChange={e => setNotas(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Estado</label>
          <select className="form-input" style={{ fontSize: '0.85rem', padding: '0.3rem' }} value={estado} onChange={e => setEstado(e.target.value)}>
            <option value="programada">Programada</option>
            <option value="realizada">Realizada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button className="btn btn-ghost" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={() => setEditing(false)}>
            Cancelar
          </button>
          <button className="btn btn-ghost" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: 'var(--error)', marginLeft: 'auto' }} onClick={handleDelete}>
            Eliminar
          </button>
        </div>
      </div>
    );
  }

  const dateObj = new Date(ev.fecha_hora);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: ev.estado === 'cancelada' ? 'var(--error)' : 'var(--accent)', textTransform: 'uppercase' }}>
          {ev.estado || 'programada'}
        </div>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
          {dateObj.toLocaleDateString('es-AR')} a las {dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
        </div>
        {ev.notas && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Nota: {ev.notas}</div>}
      </div>
      <div className="no-print" style={{ display: 'flex', gap: '0.5rem' }}>
        {ev.estado !== 'cancelada' && (
          <button 
            className="btn btn-outline" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: 'var(--error)', borderColor: 'var(--error)' }} 
            onClick={handleCancelDirect}
          >
            Cancelar Turno
          </button>
        )}
        <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={() => setEditing(true)}>
          Reprogramar
        </button>
      </div>
    </div>
  );
};

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: '#64748B' },
  contactado: { label: 'Contactado', color: '#F59E0B' },
  entrevista_programada: { label: 'Entrevista Programada', color: '#3B82F6' },
  entrevistado_pendiente: { label: 'Entrevistado / Pendiente de Ingreso', color: '#8B5CF6' },
  finalizado: { label: 'Admitido', color: '#10B981' },
  cancelado: { label: 'Cancelado / Baja', color: '#EF4444' },
};

const Campo = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div style={{ marginBottom: '1rem' }} className="campo-item">
    <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>
      {label}
    </div>
    <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 500 }}>
      {value || <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>No informado</span>}
    </div>
  </div>
);

const Seccion = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div style={{ marginBottom: '2rem' }} className="ficha-seccion">
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '2px solid var(--border-color)' }} className="seccion-title">
      <div style={{ background: 'var(--primary-soft)', color: 'var(--primary)', padding: '0.4rem', borderRadius: '8px', display: 'flex' }} className="no-print">
        {icon}
      </div>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--secondary)' }}>{title}</h3>
    </div>
    {children}
  </div>
);

const Grid = ({ cols = 3, children }: { cols?: number; children: React.ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: cols === 2 ? '0 2rem' : '0 1.5rem' }} className={`ficha-grid ficha-grid-${cols}`}>
    {children}
  </div>
);

const FichaDetalle: React.FC<FichaDetalleProps> = ({ token, onAuthError }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editando, setEditando] = useState(false);
  const [fichaEdit, setFichaEdit] = useState<any>({});
  const [guardando, setGuardando] = useState(false);

  const fetchFicha = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/fichas/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        onAuthError();
        return;
      }
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      setData(json);
      setFichaEdit(json.ficha || {});
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFicha(); }, [id, token]);

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const res = await fetch(`${API_URL}/admin/fichas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(fichaEdit)
      });
      if (res.status === 401) {
        onAuthError();
        return;
      }
      if (!res.ok) throw new Error('Error al guardar');
      await fetchFicha();
      setEditando(false);
    } catch (e: any) {
      alert('Error al guardar: ' + e.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleDeleteFicha = async () => {
    if (!confirm(`¿Seguro que deseas eliminar permanentemente la solicitud de ${ficha.nombre} ${ficha.apellido}? Esta acción no se puede deshacer y borrará todos los datos relacionados.`)) return;
    try {
      const res = await fetch(`${API_URL}/admin/fichas/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        onAuthError();
        return;
      }
      if (!res.ok) throw new Error('Error al eliminar la ficha');
      alert('Solicitud eliminada con éxito');
      navigate('/admin');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handlePrint = () => window.print();

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--primary)' }}>
      Cargando ficha completa...
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--error)' }}>
      <div style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Error al cargar la ficha</div>
      <div style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{error}</div>
      <button className="btn btn-outline" onClick={() => navigate('/admin')}>Volver</button>
    </div>
  );

  if (!data) return null;

  const { ficha, escolaridad = [], padres = [], hermanos = [], convivientes = [], entrevistas = [] } = data;
  const estado = ESTADO_LABELS[ficha.estado] || { label: ficha.estado, color: '#64748B' };

  const validParents = padres.filter((p: any) => p.nombre || p.apellido || p.dni_nro);
  const hasSecondParent = validParents.length > 1;

  // Lógica defensiva para verificar posesión de discapacidad declarada
  const tieneDiscapacidad = ficha.discapacidad && ficha.discapacidad !== 'No posee' && ficha.discapacidad !== 'No';

  return (
    <>
      {/* Estilos de impresión y visibilidad */}
      <style>{`
        /* Ocultar el acuerdo en pantalla por defecto sin removerlo del árbol de renderizado */
        .acuerdo-admision {
          position: absolute;
          left: -9999px;
          top: -9999px;
          width: 1px;
          height: 1px;
          overflow: hidden;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm !important;
          }

          /* Desactivar animaciones y transformaciones para evitar capas cortadas o superposiciones */
          *, *::before, *::after {
            animation: none !important;
            transition: none !important;
            transform: none !important;
            box-shadow: none !important;
          }

          /* Asegurar visibilidad y expansión total sin overflow:hidden */
          html, body, #root, .v2-layout, .v2-content, .ficha-detalle-container, .main-content {
            overflow: visible !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            background: white !important;
            color: black !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            font-size: 8.5pt !important;
            line-height: 1.3 !important;
          }

          /* Ocultar elementos de navegación y UI administrativa */
          .no-print, 
          [class*="no-print"], 
          button, 
          .btn, 
          .v2-sidebar, 
          .v2-user-profile { 
            display: none !important; 
            visibility: hidden !important; 
            height: 0 !important; 
            padding: 0 !important; 
            margin: 0 !important; 
            opacity: 0 !important; 
          }

          /* Encabezado de la Ficha en papel */
          .ficha-header-card {
            background: #f8fafc !important;
            color: #0f172a !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 6px !important;
            padding: 0.6rem 0.85rem !important;
            margin-bottom: 0.85rem !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .ficha-header-card img {
            height: 44px !important;
            width: 44px !important;
            border: 1px solid #cbd5e1 !important;
          }
          .ficha-header-card h1 {
            font-size: 1.25rem !important;
            color: #0f172a !important;
            margin: 0 !important;
          }

          /* Contenedor del cuerpo */
          .ficha-body-card {
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            background: transparent !important;
          }

          /* Secciones y títulos */
          .ficha-seccion {
            margin-bottom: 0.85rem !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .seccion-title {
            margin-bottom: 0.45rem !important;
            padding-bottom: 0.35rem !important;
            border-bottom: 1.5px solid #cbd5e1 !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .seccion-title h3 {
            font-size: 9.5pt !important;
            color: #0f172a !important;
          }

          /* Tarjeta individual de adulto */
          .padre-card {
            background: #fafafa !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 6px !important;
            padding: 0.75rem 1rem !important;
            margin-bottom: 0.65rem !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Grids en impresión */
          .ficha-grid-3 {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 0.3rem 0.75rem !important;
          }
          .ficha-grid-2 {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.3rem 0.75rem !important;
          }
          .campo-item {
            margin-bottom: 0.35rem !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .campo-item > div:first-child {
            font-size: 6.2pt !important;
            color: #64748b !important;
            margin-bottom: 0.1rem !important;
          }
          .campo-item > div:last-child {
            font-size: 8.5pt !important;
            color: #000 !important;
          }

          /* Tablas */
          table, tr, td, th {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          table {
            font-size: 7.8pt !important;
          }
          th, td {
            padding: 0.3rem 0.5rem !important;
          }

          /* Control de viudas y huérfanas */
          p, li, tr, table {
            orphans: 3 !important;
            widows: 3 !important;
          }
          h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          /* Acuerdo de Admisión (Hoja dedicada limpia) */
          .acuerdo-admision {
            position: static !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            display: block !important;
            page-break-before: always !important;
            break-before: page !important;
            font-size: 7pt !important;
            line-height: 1.25 !important;
            color: #000 !important;
            padding-top: 0 !important;
            margin-top: 0 !important;
            border-top: none !important;
          }
          .acuerdo-admision h2 {
            font-size: 9.5pt !important;
            font-weight: 800 !important;
            margin-bottom: 0.35rem !important;
            color: #000 !important;
            text-align: center !important;
          }
          .acuerdo-admision h4 {
            font-size: 7.2pt !important;
            font-weight: 800 !important;
            margin-top: 0.25rem !important;
            margin-bottom: 0.05rem !important;
            color: #000 !important;
          }
          .acuerdo-admision p {
            margin-bottom: 0.16rem !important;
            text-align: justify !important;
          }
          
          .evitar-quiebre {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          .firmas-block {
            margin-top: 1.5rem !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .firmas-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1.5rem 2rem !important;
          }
          .firma-box {
            text-align: center !important;
            padding-top: 2.25rem !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .firma-linea {
            border-top: 1px solid #000 !important;
            width: 80% !important;
            margin: 0 auto 0.25rem !important;
          }
        }
      `}</style>

      <div className="ficha-detalle-container animate-in">
        {/* Barra superior */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/admin')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={18} /> Volver
          </button>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {editando ? (
              <>
                <button className="btn btn-ghost" onClick={() => { setEditando(false); setFichaEdit(ficha); }}>
                  <X size={16} /> Cancelar
                </button>
                <button className="btn btn-primary" onClick={handleGuardar} disabled={guardando}>
                  <Save size={16} /> {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-ghost" style={{ color: 'var(--error)', borderColor: 'var(--error)' }} onClick={handleDeleteFicha}>
                  <Trash2 size={16} /> Eliminar Solicitud
                </button>
                <button className="btn btn-outline" onClick={handlePrint}>
                  <Printer size={16} /> Imprimir
                </button>
                <button className="btn btn-primary" onClick={() => setEditando(true)}>
                  <Edit3 size={16} /> Editar Ficha
                </button>
              </>
            )}
          </div>
        </div>

        {/* Encabezado de la ficha con Logo de la Escuela */}
        <div className="ficha-header-card" style={{ background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-lg)', padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <img src="/logo.png" alt="Escuela La Cecilia" style={{ height: '70px', width: '70px', objectFit: 'contain', borderRadius: '8px', border: '2px solid white', backgroundColor: 'white', padding: '2px' }} />
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.7, marginBottom: '0.5rem' }}>
                Ficha de Inscripción #{ficha.id}
              </div>
              <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 900 }}>
                {ficha.apellido}, {ficha.nombre}
              </h1>
              <div style={{ marginTop: '0.5rem', opacity: 0.85 }}>
                {ficha.dni_tipo || 'DNI'} {ficha.dni_nro} · {ficha.nivel_ingreso} — {ficha.grado_anio}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="no-print" style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '0.5rem 1rem', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.7 }}>Estado</div>
              <div style={{ fontWeight: 800 }}>{estado.label}</div>
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
              Solicitud: {new Date(ficha.fecha_solicitud || Date.now()).toLocaleDateString('es-AR')}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
              Ciclo {ficha.ciclo_lectivo}
            </div>
          </div>
        </div>

        {/* Cuerpo de la ficha */}
        <div className="ficha-body-card" style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', boxShadow: 'var(--shadow-sm)' }}>

          {/* Datos del Alumno */}
          <Seccion title="Datos del Alumno" icon={<User size={16} />}>
            {editando ? (
              <Grid cols={3}>
                <InputEdit campo="nombre" label="Nombre" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="apellido" label="Apellido" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="dni_tipo" label="Tipo DNI" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="dni_nro" label="Número Documento" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="sexo" label="Sexo" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="fecha_nac" label="Fecha de Nacimiento" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="lugar_nac" label="Lugar de Nacimiento" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="direccion" label="Dirección" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="localidad" label="Localidad" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="provincia" label="Provincia" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="pais" label="País" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="cp" label="Código Postal" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="otras_actividades" label="Intereses y Actividades Extracurriculares" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
              </Grid>
            ) : (
              <Grid cols={3}>
                <Campo label="Nombre" value={ficha.nombre} />
                <Campo label="Apellido" value={ficha.apellido} />
                <Campo label="Documento" value={`${ficha.dni_tipo || 'DNI'} ${ficha.dni_nro || ''}`} />
                <Campo label="Sexo" value={ficha.sexo} />
                <Campo label="Fecha de Nacimiento" value={ficha.fecha_nac} />
                <Campo label="Lugar de Nacimiento" value={ficha.lugar_nac} />
                <Campo label="Dirección" value={ficha.direccion} />
                <Campo label="Localidad" value={ficha.localidad} />
                <Campo label="Provincia" value={ficha.provincia} />
                <Campo label="País" value={ficha.pais} />
                <Campo label="Código Postal" value={ficha.cp} />
                <Campo label="Intereses / Actividades Extracurriculares" value={ficha.otras_actividades} />
                {ficha.telefono_alumno && <Campo label="Teléfono Alumno" value={ficha.telefono_alumno} />}
                {ficha.email_alumno && <Campo label="Email Alumno" value={ficha.email_alumno} />}
                {ficha.obra_social && <Campo label="Obra Social" value={ficha.obra_social} />}
              </Grid>
            )}
          </Seccion>

          {/* Información Escolar */}
          <Seccion title="Información Escolar" icon={<BookOpen size={16} />}>
            {editando ? (
              <Grid cols={3}>
                <InputEdit campo="nivel_ingreso" label="Nivel de Ingreso" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="grado_anio" label="Grado / Año" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="ciclo_lectivo" label="Ciclo Lectivo" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="repitente" label="Repitente (1: Sí / 0: No)" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="motivo_eleccion" label="¿Cómo conocieron la Escuela? / Elección" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
              </Grid>
            ) : (
              <Grid cols={3}>
                <Campo label="Nivel de Ingreso" value={ficha.nivel_ingreso} />
                <Campo label="Grado / Año" value={ficha.grado_anio} />
                <Campo label="Ciclo Lectivo" value={ficha.ciclo_lectivo} />
                <Campo label="Repitente" value={ficha.repitente ? 'Sí' : 'No'} />
                <Campo label="¿Cómo conocieron la Escuela? / Elección" value={ficha.motivo_eleccion} />
              </Grid>
            )}

            {escolaridad.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Historial Escolar Previo</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Nivel', 'Año Cursado', 'Escuela', 'Observaciones'].map(h => (
                        <th key={h} style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {escolaridad.map((e: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.5rem 1rem' }}>{e.nivel}</td>
                        <td style={{ padding: '0.5rem 1rem' }}>{e.anio_cursado}</td>
                        <td style={{ padding: '0.5rem 1rem' }}>{e.escuela}</td>
                        <td style={{ padding: '0.5rem 1rem', color: 'var(--text-muted)' }}>{e.observaciones || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Seccion>

          {/* Salud */}
          <Seccion title="Salud y Actividades Médicas" icon={<Heart size={16} />}>
            {editando ? (
              <Grid cols={2}>
                <InputEdit campo="salud_detalles" label="Información Médica Relevante" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="embarazo_parto" label="Embarazo / Parto (de la madre)" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="discapacidad" label="Discapacidad ('No posee' o detalle)" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="tiene_cud" label="Tiene CUD (1: Sí / 0: No)" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="tiene_problemas_aprendizaje" label="¿Problemas de aprendizaje? (1: Sí / 0: No)" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="problemas_aprendizaje" label="Especifique problemas de aprendizaje" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="tratamiento_profesional" label="¿Tratado por profesionales? (1: Sí / 0: No)" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="tratamiento_detalles" label="Especifique tratamiento" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
              </Grid>
            ) : (
              <Grid cols={2}>
                <Campo label="Información Médica Relevante" value={ficha.salud_detalles} />
                <Campo label="Embarazo / Parto (de la madre)" value={ficha.embarazo_parto} />
                <Campo 
                  label="¿Posee discapacidad?" 
                  value={tieneDiscapacidad ? 'Sí' : 'No'} 
                />
                {tieneDiscapacidad ? (
                  <>
                    <Campo label="Discapacidad Especificada" value={ficha.discapacidad} />
                    <Campo label="Posee CUD" value={ficha.tiene_cud ? 'Sí' : 'No'} />
                  </>
                ) : null}
                <Campo label="¿Tiene problemas de aprendizaje?" value={ficha.tiene_problemas_aprendizaje ? 'Sí' : 'No'} />
                {(!!ficha.tiene_problemas_aprendizaje || ficha.problemas_aprendizaje) ? (
                  <Campo label="Especifique problemas de aprendizaje" value={ficha.problemas_aprendizaje} />
                ) : null}
                <Campo label="¿Está siendo tratado por profesionales?" value={ficha.tratamiento_profesional ? 'Sí' : 'No'} />
                {(!!ficha.tratamiento_profesional || ficha.tratamiento_detalles) ? (
                  <Campo label="Especifique tratamiento" value={ficha.tratamiento_detalles} />
                ) : null}
              </Grid>
            )}
          </Seccion>

          {/* Padres / Tutores */}
          {validParents.length > 0 && (
            <Seccion title="Padres / Tutores / Responsables" icon={<Users size={16} />}>
              {validParents.map((p: any, i: number) => (
                <div key={i} className="padre-card" style={{ background: '#f8fafc', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '1rem', letterSpacing: '0.05em' }}>
                    {p.rol || `Adulto Responsable ${i + 1}`}
                  </div>
                  <Grid cols={3}>
                    <Campo label="Nombre y Apellido" value={`${p.apellido || ''}, ${p.nombre || ''}`.replace(/^,\s*|,\s*$/g, '')} />
                    <Campo label="DNI" value={p.dni_nro} />
                    <Campo label="Fecha de Nacimiento" value={p.fecha_nac} />
                    <Campo label="Estado Civil" value={p.estado_civil} />
                    <Campo label="Celular" value={p.celular} />
                    <Campo label="Email" value={p.email} />
                    <Campo label="Dirección" value={p.direccion} />
                    <Campo label="Localidad" value={p.localidad} />
                    <Campo label="Provincia" value={p.provincia} />
                    <Campo label="País" value={p.pais} />
                    <Campo label="Código Postal" value={p.cp} />
                    <Campo label="Profesión / Ocupación" value={p.profesion_ocupacion} />
                    <Campo label="Lugar de Trabajo" value={p.empresa_laboral} />
                    <Campo label="Ubicación del Trabajo" value={p.direccion_laboral} />
                    <Campo label="Teléfono Laboral" value={p.telefono_laboral} />
                    <Campo label="Horarios Laborales" value={p.horarios_laborales} />
                    {p.telefono_casa && <Campo label="Teléfono Fijo" value={p.telefono_casa} />}
                    {p.lugar_nac_datos && <Campo label="Lugar de Nacimiento" value={p.lugar_nac_datos} />}
                    {p.whatsapp_contacto ? <Campo label="WhatsApp de Contacto" value="Sí" /> : null}
                  </Grid>
                </div>
              ))}
            </Seccion>
          )}

          {/* Hermanos */}
          {hermanos.length > 0 && (
            <Seccion title="Composición Familiar (Hermanos / Convivientes)" icon={<Users size={16} />}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }} className="tabla-familia">
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Vínculo', 'Nombre y Apellido', 'Fecha Nac.', 'Institución / Escuela (Hermanos)'].map(h => (
                      <th key={h} style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hermanos.map((h: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem 1rem', fontWeight: 600 }}>{h.vinculo}</td>
                      <td style={{ padding: '0.5rem 1rem', fontWeight: 600 }}>{h.nombre_apellido}</td>
                      <td style={{ padding: '0.5rem 1rem' }}>{h.fecha_nac || '—'}</td>
                      <td style={{ padding: '0.5rem 1rem' }}>{h.estudios_escuela || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Seccion>
          )}

          {/* Convivientes (si existieran registros previos independientes) */}
          {convivientes.length > 0 && (
            <Seccion title="Grupo Conviviente Adicional" icon={<Home size={16} />}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Nombre y Apellido', 'Vínculo', 'Edad', 'Observaciones'].map(h => (
                      <th key={h} style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {convivientes.map((c: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem 1rem', fontWeight: 600 }}>{c.nombre_apellido}</td>
                      <td style={{ padding: '0.5rem 1rem' }}>{c.vinculo}</td>
                      <td style={{ padding: '0.5rem 1rem' }}>{c.edad}</td>
                      <td style={{ padding: '0.5rem 1rem', color: 'var(--text-muted)' }}>{c.observaciones || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Seccion>
          )}

          {/* Contacto para entrevista y observaciones */}
          <Seccion title="Información Administrativa y Contacto" icon={<User size={16} />}>
            {editando ? (
              <Grid cols={3}>
                <InputEdit campo="contacto_entrevista_nombre" label="Contacto Entrevista - Nombre" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="contacto_entrevista_medio" label="Contacto Entrevista - Medio" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="contacto_entrevista_dato" label="Contacto Entrevista - Dato / Destino" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="situacion_socioeconomica" label="Situación Socioeconómica" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
                <InputEdit campo="otros_datos" label="Observaciones Adicionales" fichaEdit={fichaEdit} setFichaEdit={setFichaEdit} />
              </Grid>
            ) : (
              <Grid cols={3}>
                <Campo label="Contacto Entrevista - Nombre" value={ficha.contacto_entrevista_nombre} />
                <Campo label="Contacto Entrevista - Medio" value={ficha.contacto_entrevista_medio} />
                <Campo label="Contacto Entrevista - Dato / Destino" value={ficha.contacto_entrevista_dato} />
                <Campo label="Situación Socioeconómica" value={ficha.situacion_socioeconomica} />
                <Campo label="Observaciones Adicionales" value={ficha.otros_datos} />
              </Grid>
            )}
            <div style={{ marginTop: '1rem' }} className={!ficha.observaciones_generales && !editando ? "no-print" : ""}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Observaciones Administrativas Internas</div>
              {editando ? (
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={fichaEdit.observaciones_generales ?? ''}
                  onChange={e => setFichaEdit({ ...fichaEdit, observaciones_generales: e.target.value })}
                  style={{ width: '100%' }}
                />
              ) : (
                <p style={{ fontSize: '0.9rem', lineHeight: '1.7', color: 'var(--text-main)', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', margin: 0 }}>
                  {ficha.observaciones_generales || <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>Sin observaciones internas</span>}
                </p>
              )}
            </div>
          </Seccion>

          {/* Turnos de Entrevista */}
          <div className="no-print">
            <Seccion title="Turnos de Entrevista" icon={<Calendar size={16} />}>
              {entrevistas.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {entrevistas.map((ev: any) => {
                    const isCancelada = ev.estado === 'cancelada';
                    return (
                      <div 
                        key={ev.id} 
                        style={{ 
                          background: '#f8fafc', 
                          borderRadius: '12px', 
                          padding: '1.25rem', 
                          border: '1px solid var(--border-color)',
                          opacity: isCancelada ? 0.6 : 1
                        }}
                      >
                        <RescheduleForm ev={ev} token={token} onUpdate={fetchFicha} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  No hay entrevistas programadas para este alumno.
                </div>
              )}
            </Seccion>
          </div>

          {/* Acuerdo de Admisión y Permanencia (Hoja dedicada en vista de impresión) */}
          <div className="acuerdo-admision">
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <h2>ACUERDO DE ADMISIÓN Y PERMANENCIA</h2>
            </div>
            <div>
              <p>Las familias, alumnos y alumnas pueden informarse sobre la filosofía y los fundamentos de la Escuela, así como conocer las condiciones generales que se expresan en documentos tales como “Propósitos de la Escuela”, “Principios de la Escuela”, “Manual de Bienvenida” y “Manual de Procedimientos”, de modo que exista una elección consciente al momento de solicitar la inscripción, contando siempre con la posibilidad de efectuar las consultas que consideren necesarias.</p>
              <p>No se considera que exista un alumno o alumna fuera y otro u otra dentro de la Escuela, por lo cual se espera una conducta coherente del alumnado con los principios de la misma, en cualquier ámbito en que se encuentren.</p>
              <p>La Escuela tiene la intención de crear las condiciones para que los niños, niñas y jóvenes que asisten a ella puedan desarrollarse en libertad, lo cual requiere comprender la trama del condicionamiento genético, cultural y psicológico que determina nuestras acciones. No hay libertad mientras los pensamientos, emociones y acciones están dictados por las modas, las presiones sociales, las ideologías, los dogmas de cualquier tipo, nuestras huellas psicológicas, todo lo cual constituye nuestro “yo”. La libertad -entendida como libertad de la actividad egocéntrica- nos permite ser personas atentas y reflexivas, lo que posibilita una amistosa convivencia, un armonioso desarrollo en sociedad y una vida libre de conflicto interno. Es en estos principios que se basa el núcleo de nuestros propósitos educativos y al cual se remiten las siguientes condiciones que los alumnos, alumnas y familias deben comprender y aceptar para su ingreso y permanencia en la escuela.</p>
              
              <h4>ADMISIÓN</h4>
              <p>La Escuela “La Cecilia” es un proyecto que propone una educación en libertad. En tal sentido, el ingreso implica conocer y acordar con sus principios. Será necesario para la admisión que potenciales ingresantes y sus familias muestren interés en los fundamentos de la Escuela y acepten estas condiciones. Siendo un proyecto educativo que requiere un marco de aceptación y coherencia en la vida familiar, se pretende que todos los hermanos o hermanas en edad escolar asistan a esta escuela, salvo circunstancias particulares que se analizarán en cada caso.</p>

              <h4>BUEN TRATO</h4>
              <p>No se permitirá ningún tipo de trato violento, físico ni verbal, como burlas, discriminación, bullying, etc. tanto dentro como fuera de la Escuela. Estas conductas serán informadas y conversadas con las familias y se exigirán seguimientos en cada caso.</p>

              <h4>EXPECTATIVAS ACADÉMICAS</h4>
              <p>Las familias, alumnos y alumnas deben comprender y aceptar que no resulta lógico ni posible que todos lleguen a los mismos resultados en sus aprendizajes académicos, ya que ello dependerá de sus intereses y capacidades. El propósito educativo de la Escuela es colaborar para que cada alumno o alumna pueda conocerse a sí mismo, conocer sus intereses y capacidades y desarrollarlos de la mejor manera, para poder hacer de ellos un medio de vida dentro de un proyecto vital con sentido social. Para los propósitos enunciados se les brindarán las opciones académicas correspondientes y el apoyo necesario. Los alumnos y alumnas podrán elegir las actividades que realizan y proponer otras que no se estén realizando. En todos los casos la tutoría de la Escuela, junto a educadores, hará un seguimiento de cada alumno o alumna, para lo cual se llevará un registro detallado de las actividades.</p>

              <h4>MODO DE VIDA - ALIMENTACIÓN</h4>
              <p>La Escuela propone un modo de vida que contribuya a la salud física y psicológica. Se propone una dieta vegetariana y natural que excluye las carnes de todo tipo y sus derivados, bebidas alcohólicas, gaseosas y golosinas, así como otros alimentos con exceso de dulces o de sal. Tanto en el predio de la Escuela como durante salidas, reuniones, actividades escolares o cualquier otra actividad donde participen grupalmente los alumnos y alumnas se respetará la alimentación vegetariana y los hábitos propuestos. El cumplimiento de esta dieta no es de exigencia en el hogar, pero se solicita a las familias que colaboren para que sus hijos o hijas adopten conscientemente una forma de vida que contribuya a cuidar su salud. En el mismo sentido, no se deben ingresar a la escuela alimentos que no respondan a las pautas de cuidado de la salud que se recomiendan.</p>

              <h4>CIGARRILLO, ALCOHOL, DROGAS</h4>
              <p>Se consideran dañinos para la salud el tabaco, alcohol u otras drogas, por lo cual alumnos y alumnas deben comprometerse a no consumirlos en ningún momento, dentro o fuera de la escuela. Se solicita a las familias que colaboren para que sus hijos o hijas no se conviertan en consumidores de estos elementos perjudiciales para la salud y generadores de tantos trastornos sociales.</p>

              <h4>ACCESORIOS</h4>
              <p>Hay jóvenes que suelen utilizar accesorios (algunos tipos de piercings, muñequeras, cadenas, expansores, etc.) que implican un riesgo para la seguridad y salud propia y de sus compañeros o compañeras, pero además son representativos de condicionamientos sobre los que la Escuela está fuertemente interesada en trabajar. Por lo tanto, los alumnos y alumnas convendrán no usar accesorios que no sean consensuados con la escuela y la familia, dentro ni fuera de ella. No obstante, se podrán revisar estas restricciones en todo momento a través de los mecanismos orgánicos colectivos disponibles, tales como las Asambleas.</p>

              <h4>BOLICHES, VIDA NOCTURNA</h4>
              <p>Los alumnos y alumnas de la Escuela se comprometerán a no asistir a pubs, boliches o lugares similares, ya que no son ambientes convenientes para adolescentes, ni son acordes a la forma de vida propuesta.</p>

              <h4>HORARIO Y ASISTENCIA</h4>
              <p>La Escuela considera imprescindible que alumnos y alumnas participen con regularidad y puntualidad a las actividades de la vida escolar. Se evitarán las inasistencias reiteradas y las reincorporaciones que deban gestionarse -con motivo de alcanzar la cantidad de faltas permitidas por el reglamento- se autorizarán solamente en caso de que estén debidamente justificadas por enfermedad u otras circunstancias graves que las ameriten.</p>

              <div className="evitar-quiebre">
                <h4>SANCIONES</h4>
                <p>No se utiliza un sistema de premios ni castigos, por lo cual tampoco hay sanciones para regular los comportamientos y la vida de la Escuela. Esto requiere que alumnos y alumnas sepan auto-gestionar su conducta dentro de los canales existentes y respetando los propósitos y fundamentos expuestos. Dado que la firma de los presentes compromisos determina la posibilidad del ingreso, la falta de cumplimiento de estos acuerdos significará que el alumno o la alumna deberá dejar la Escuela de inmediato, en cualquier momento del año o no acceder a la reinscripción para el año siguiente.</p>
              </div>

              <div className="evitar-quiebre">
                <h4>CUMPLIMIENTO COMPROMISO ECONÓMICO</h4>
                <p>Las familias se comprometen a abonar en tiempo y forma las cuotas. De existir algún inconveniente para el pago de las mismas, esto se comunicará inmediatamente a la Escuela, a fin de encontrar alguna alternativa para hacer frente a la situación. Si existiese una deuda de dos cuotas vencidas y no se acordase una forma de cumplimiento, la familia se compromete a pedir el pase y dejar la escuela en el momento en que se le solicite. Las cuotas pagadas fuera de término conllevarán un recargo. No se reinscribirán alumnos ni alumnas que mantengan deuda con la Escuela al comienzo del ciclo lectivo.</p>
              </div>

              <div className="evitar-quiebre">
                <h4>CUOTAS</h4>
                <p>Se abonan 12 cuotas al año, 2 de las cuales corresponden a matrícula (que deben estar pagas antes del finalizar el año previo al ciclo lectivo en que se inscribe el alumno) y luego 10 cuotas consecutivas, de marzo a diciembre del ciclo en que se inscribe. Las cuotas se ajustan periódicamente en forma proporcional a los aumentos en los salarios docentes y sus valores pueden consultarse en la página de la Escuela.</p>
              </div>
            </div>

            {/* Bloques de Firmas */}
            <div className="evitar-quiebre firmas-block">
              <div className="firmas-grid">
                <div className="firma-box" style={{ gridColumn: hasSecondParent ? 'auto' : 'span 2' }}>
                  <div className="firma-linea" style={{ width: hasSecondParent ? '80%' : '40%' }}></div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>Firma del Adulto Responsable 1</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748B' }}>Aclaración: ________________________</div>
                </div>
                {hasSecondParent && (
                  <div className="firma-box">
                    <div className="firma-linea"></div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>Firma del Adulto Responsable 2</div>
                    <div style={{ fontSize: '0.65rem', color: '#64748B' }}>Aclaración: ________________________</div>
                  </div>
                )}
                <div className="firma-box" style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                  <div className="firma-linea" style={{ width: '40%' }}></div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>Firma del Alumno/a</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748B' }}>Aclaración: ________________________</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }} className="no-print">
            <button className="btn btn-primary" style={{ padding: '0.75rem' }} onClick={() => navigate('/admin')}>
              Ver Ficha Completa
            </button>
            <button className="btn btn-outline" style={{ padding: '0.75rem' }} onClick={() => navigate('/admin/agenda', { state: { selectFichaId: Number(id) } })}>
              <Calendar size={18} /> Programar Entrevista
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FichaDetalle;
