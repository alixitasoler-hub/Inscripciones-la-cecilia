import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MessageCircle, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  Plus
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://sistema-inscripciones.alixitasoler.workers.dev/api';

interface SplitAgendaProps {
  token: string;
  onAuthError: () => void;
}

const SplitAgenda: React.FC<SplitAgendaProps> = ({ token, onAuthError }) => {
  const [fichas, setFichas] = useState<any[]>([]);
  const [entrevistas, setEntrevistas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedFicha, setSelectedFicha] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [notas, setNotas] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [resFichas, resAgenda] = await Promise.all([
        fetch(`${API_URL}/admin/fichas`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/admin/agenda`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (resFichas.status === 401 || resAgenda.status === 401) {
        onAuthError();
        return;
      }
      if (!resFichas.ok || !resAgenda.ok) throw new Error('Error backend');

      const [dataFichas, dataAgenda] = await Promise.all([resFichas.json(), resAgenda.json()]);
      
      if (Array.isArray(dataFichas)) {
        const filtered = dataFichas.filter(f => f.estado === 'pendiente' || f.estado === 'contactado');
        setFichas(filtered);

        // Pre-selección de ficha por navegación desde KanbanBoard o FichaDetalle
        const selectFichaId = location.state?.selectFichaId;
        if (selectFichaId) {
          const found = dataFichas.find(f => f.id === Number(selectFichaId));
          if (found) {
            setSelectedFicha(found);
            setScheduleDate(new Date().toISOString().split('T')[0]);
          }
        }
      }
      
      if (Array.isArray(dataAgenda)) {
        setEntrevistas(dataAgenda);
        // Auto-foco: ir a la primera semana con entrevistas futuras
        const upcoming = dataAgenda
          .filter((e: any) => new Date(e.fecha_hora) >= new Date() && e.estado !== 'cancelada')
          .sort((a: any, b: any) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime());
        
        if (upcoming.length > 0) {
          setViewDate(new Date(upcoming[0].fecha_hora));
        }
      }
    } catch (e) {
      console.error('Error fetching data, cargando datos de prueba:', e);
      setFichas([
        { id: 1, nombre: 'Sofía', apellido: 'Martínez', nivel_ingreso: 'EPO (Primaria)', grado_anio: '3er Grado' }
      ]);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      setEntrevistas([
        { id: 101, ficha_id: 2, alumno_nombre: 'Tomás', alumno_apellido: 'García', fecha_hora: tomorrow.toISOString(), contacto_entrevista_nombre: 'Ana García', contacto_entrevista_dato: '1144443333', notas: 'Entrevista de admisión' }
      ]);
      setViewDate(tomorrow);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const upcomingInterviews = useMemo(() => {
    return entrevistas
      .filter(e => new Date(e.fecha_hora) >= new Date() && e.estado !== 'cancelada')
      .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime())
      .slice(0, 10);
  }, [entrevistas]);

  const handleSchedule = async () => {
    if (!selectedFicha || !scheduleDate) return alert('Seleccione fecha');
    
    try {
      const res = await fetch(`${API_URL}/admin/entrevistas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ficha_id: selectedFicha.id,
          fecha_hora: `${scheduleDate}T${scheduleTime}:00`,
          notas
        })
      });

      if (res.status === 401) {
        onAuthError();
        return;
      }

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al agendar');
      
      alert('Entrevista agendada con éxito');
      setShowModal(false);
      setSelectedFicha(null);
      fetchData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const daysOfWeek = useMemo(() => {
    const days = [];
    const start = new Date(viewDate);
    start.setDate(start.getDate() - start.getDay());
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [viewDate]);

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem' }}><Clock className="animate-spin" style={{margin:'0 auto 1rem'}} /> Cargando agenda...</div>;

  return (
    <div className="split-agenda-container animate-in">
      <style>{`
        .split-agenda-container {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 0;
          height: calc(100vh - 200px);
          min-height: 700px;
          background: white;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .pending-panel {
          background: #f8fafc;
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
        }

        .pending-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
          background: white;
        }

        .pending-list {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .pending-card {
          background: white;
          padding: 1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pending-card:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow-sm);
        }

        .pending-card.selected {
          background: var(--primary-soft);
          border-color: var(--primary);
        }

        .calendar-panel {
          display: flex;
          flex-direction: column;
          background: white;
        }

        .calendar-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .calendar-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          flex: 1;
          border-bottom: 1px solid var(--border-color);
          overflow-y: auto;
        }

        .calendar-day-col {
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          min-height: 250px;
        }

        .calendar-day-col:last-child {
          border-right: none;
        }

        .calendar-day-col.today {
          background: #f8fafc;
        }

        .calendar-day-header {
          padding: 0.75rem;
          text-align: center;
          border-bottom: 1px solid #f1f5f9;
          background: #fafafa;
        }

        .calendar-day-name {
          font-size: 0.65rem;
          text-transform: uppercase;
          font-weight: 800;
          color: var(--text-muted);
        }

        .calendar-day-number {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-main);
          margin-top: 0.25rem;
          width: 32px;
          height: 32px;
          line-height: 32px;
          margin: 0.25rem auto 0;
          border-radius: 50%;
        }

        .today .calendar-day-number {
          background: var(--primary);
          color: white;
        }

        .calendar-slots {
          padding: 0.5rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          overflow-y: auto;
        }

        .event-card {
          background: var(--primary-soft);
          border-left: 4px solid var(--primary);
          padding: 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          box-shadow: var(--shadow-sm);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .event-card:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
          border-left-color: var(--accent);
          background: #f1f5f9;
        }

        .event-card-time {
          font-weight: 800;
          color: var(--primary);
          margin-bottom: 0.25rem;
        }

        .upcoming-section {
          background: #f8fafc;
          padding: 1.5rem;
          max-height: 250px;
          overflow-y: auto;
          border-top: 1px solid var(--border-color);
        }

        .upcoming-title {
          font-weight: 800;
          font-size: 0.85rem;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .upcoming-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }

        .upcoming-item {
          background: white;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .upcoming-item:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow-sm);
          transform: translateY(-1px);
        }

        .upcoming-date-box {
          background: #f1f5f9;
          border-radius: 8px;
          width: 50px;
          height: 50px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3000;
        }

        .modal-card {
          background: white;
          padding: 2rem;
          border-radius: var(--radius-lg);
          width: 450px;
          box-shadow: var(--shadow-lg);
        }
      `}</style>

      <aside className="pending-panel">
        <div className="pending-header">
          <h3 style={{ fontSize: '1rem', margin: 0 }}>Pendientes de Agenda</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Selecciona una familia para asignar turno.</p>
        </div>
        <div className="pending-list">
          {fichas.map(f => (
            <div 
              key={f.id} 
              className={`pending-card ${selectedFicha?.id === f.id ? 'selected' : ''}`}
              onClick={() => {
                setSelectedFicha(f);
                setScheduleDate(new Date().toISOString().split('T')[0]);
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{f.apellido}, {f.nombre}</div>
                {selectedFicha?.id === f.id && (
                  <button 
                    className="btn btn-ghost" 
                    style={{ padding: '0.2rem', color: 'var(--accent)' }}
                    title="Copiar link de auto-agendado"
                    onClick={(e) => {
                      e.stopPropagation();
                      const link = `${window.location.origin}/agendar/${btoa(f.id.toString())}`;
                      navigator.clipboard.writeText(link);
                      alert('Link copiado al portapapeles');
                    }}
                  >
                    <ExternalLink size={14} />
                  </button>
                )}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{f.nivel_ingreso} - {f.grado_anio}</div>
              {selectedFicha?.id === f.id && (
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '1rem', fontSize: '0.8rem', padding: '0.4rem' }}
                  onClick={() => setShowModal(true)}
                >
                  <Plus size={14} /> Agendar Turno
                </button>
              )}
            </div>
          ))}
          {fichas.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No hay familias pendientes.</div>}
        </div>
      </aside>

      <section className="calendar-panel">
        <div className="calendar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--secondary)' }}>
              {viewDate.toLocaleString('es-AR', { month: 'long', year: 'numeric' }).toUpperCase()}
            </h2>
            <div className="flex gap-1">
              <button className="btn btn-ghost" style={{ padding: '0.25rem' }} onClick={() => {
                const d = new Date(viewDate);
                d.setDate(d.getDate() - 7);
                setViewDate(d);
              }}><ChevronLeft size={20} /></button>
              <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} onClick={() => setViewDate(new Date())}>Hoy</button>
              <button className="btn btn-ghost" style={{ padding: '0.25rem' }} onClick={() => {
                const d = new Date(viewDate);
                d.setDate(d.getDate() + 7);
                setViewDate(d);
              }}><ChevronRight size={20} /></button>
            </div>
          </div>
          <div style={{fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)'}}>
            <CalendarIcon size={14} style={{verticalAlign:'middle', marginRight:'0.4rem'}} />
            Vista Semanal
          </div>
        </div>

        <div className="calendar-content">
          <div className="calendar-grid">
            {daysOfWeek.map((day, i) => {
              const isToday = day.toDateString() === new Date().toDateString();
              const dayEvents = entrevistas.filter(e => new Date(e.fecha_hora).toDateString() === day.toDateString());
              
              return (
                <div key={i} className={`calendar-day-col ${isToday ? 'today' : ''}`}>
                  <div className="calendar-day-header">
                    <div className="calendar-day-name">{day.toLocaleString('es-AR', { weekday: 'short' })}</div>
                    <div className="calendar-day-number">{day.getDate()}</div>
                  </div>
                  <div className="calendar-slots">
                    {dayEvents.map(ev => (
                      <div 
                        key={ev.id} 
                        className="event-card" 
                        onClick={() => navigate(`/admin/ficha/${ev.ficha_id}`)}
                      >
                        <div className="event-card-time">{new Date(ev.fecha_hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })} hs</div>
                        <div style={{ fontWeight: 700 }}>{ev.alumno_apellido}</div>
                        <div style={{ fontSize: '0.6', opacity: 0.7 }}>{ev.notas || 'Sin notas'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="upcoming-section">
            <div className="upcoming-title">
              <Clock size={14} /> Próximas Entrevistas Agendadas (Haz clic para editar en su ficha)
            </div>
            <div className="upcoming-list">
              {upcomingInterviews.map(ev => {
                const date = new Date(ev.fecha_hora);
                return (
                  <div 
                    key={ev.id} 
                    className="upcoming-item"
                    onClick={() => navigate(`/admin/ficha/${ev.ficha_id}`)}
                  >
                    <div className="upcoming-date-box">
                      <div style={{fontSize:'0.6rem', textTransform:'uppercase', fontWeight:800, color:'var(--text-muted)'}}>{date.toLocaleString('es-AR', { month: 'short' })}</div>
                      <div style={{fontSize:'1.25rem', fontWeight:800, color:'var(--primary)'}}>{date.getDate()}</div>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'0.65rem', fontWeight:800, color:'var(--accent)'}}>{date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })} HS</div>
                      <div style={{fontWeight:700, fontSize:'0.9rem'}}>{ev.alumno_apellido}, {ev.alumno_nombre}</div>
                      <div style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>{ev.contacto_entrevista_nombre}</div>
                    </div>
                    <button 
                      className="btn btn-ghost" 
                      style={{padding:'0.5rem'}}
                      onClick={(e) => {
                        e.stopPropagation();
                        const dateStr = new Date(ev.fecha_hora).toLocaleDateString('es-AR');
                        const timeStr = new Date(ev.fecha_hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
                        const text = `¡Hola, ${ev.contacto_entrevista_nombre}! Hemos recibido la solicitud para el ingreso de *${ev.alumno_apellido}, ${ev.alumno_nombre}* a nuestra Escuela.\nLes proponemos asistir junto con ${ev.alumno_nombre} el día *${dateStr}* a las *${timeStr}*.\nEsperamos tu confirmación para agendar la entrevista o, si fuera necesario, cambiarla para otro día/hora.\n¡Gracias por contactarnos!`;
                        window.open(`https://wa.me/${(ev.contacto_entrevista_dato||'').replace(/\D/g,'')}?text=${encodeURIComponent(text)}`, '_blank');
                      }}
                    >
                      <MessageCircle size={18} color="#25D366" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Agendar Turno</h3>
              
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Familia seleccionada</label>
                <div style={{ fontWeight: 700, padding: '0.5rem', background: 'var(--primary-soft)', borderRadius: '4px' }}>
                  {selectedFicha?.apellido}, {selectedFicha?.nombre}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Fecha</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={scheduleDate}
                  onChange={e => setScheduleDate(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Hora</label>
                <input 
                  type="time" 
                  className="form-input" 
                  value={scheduleTime}
                  onChange={e => setScheduleTime(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Notas / Observaciones</label>
                <textarea 
                  className="form-textarea" 
                  rows={3}
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  placeholder="Ej: Entrevista presencial con los dos padres..."
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSchedule}>Confirmar Turno</button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default SplitAgenda;
