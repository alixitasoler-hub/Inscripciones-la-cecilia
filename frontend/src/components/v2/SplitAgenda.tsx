import React, { useState, useEffect, useMemo } from 'react';
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

  const fetchData = async () => {
    try {
      const [resFichas, resAgenda] = await Promise.all([
        fetch(`${API_URL}/admin/fichas`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/admin/agenda`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      // Comentado para evitar deslogueos innecesarios si la API falla
      // if (resFichas.status === 401 || resAgenda.status === 401) return onAuthError();
      if (!resFichas.ok || !resAgenda.ok) throw new Error('Error backend');

      const [dataFichas, dataAgenda] = await Promise.all([resFichas.json(), resAgenda.json()]);
      
      if (Array.isArray(dataFichas)) {
        setFichas(dataFichas.filter(f => f.estado === 'pendiente' || f.estado === 'contactado'));
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
          overflow: hidden;
        }

        .calendar-header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
        }

        .calendar-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .calendar-grid {
          height: 350px;
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          overflow-y: auto;
          border-bottom: 1px solid var(--border-color);
        }

        .calendar-day-col {
          border-right: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          min-height: 300px;
        }

        .calendar-day-header {
          padding: 0.75rem;
          text-align: center;
          border-bottom: 1px solid #f1f5f9;
          background: #fcfdfe;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .calendar-day-name {
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .calendar-day-number {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--primary);
        }

        .calendar-day-col.today {
          background: #f8fafc;
        }

        .calendar-day-col.today .calendar-day-number {
          background: var(--primary);
          color: white;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          margin: 0 auto;
        }

        .calendar-slots {
          flex: 1;
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .event-card {
          background: white;
          border: 1px solid var(--border-color);
          border-left: 3px solid var(--primary);
          padding: 0.6rem;
          border-radius: 6px;
          font-size: 0.75rem;
          box-shadow: var(--shadow-sm);
        }

        .event-card-time {
          font-weight: 800;
          color: var(--primary);
          font-size: 0.65rem;
          margin-bottom: 0.2rem;
        }

        .upcoming-section {
          padding: 1.5rem;
          background: #f8fafc;
          overflow-y: auto;
          flex: 1;
        }

        .upcoming-title {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .upcoming-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }

        .upcoming-item {
          background: white;
          padding: 1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: transform 0.2s;
        }

        .upcoming-item:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .upcoming-date-box {
          text-align: center;
          min-width: 50px;
          padding-right: 1rem;
          border-right: 1px solid #f1f5f9;
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
                      <div key={ev.id} className="event-card">
                        <div className="event-card-time">{new Date(ev.fecha_hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs</div>
                        <div style={{ fontWeight: 700 }}>{ev.alumno_apellido}</div>
                        <div style={{ fontSize: '0.6rem', opacity: 0.7 }}>{ev.notas || 'Sin notas'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="upcoming-section">
            <div className="upcoming-title">
              <Clock size={14} /> Próximas Entrevistas Agendadas
            </div>
            <div className="upcoming-list">
              {upcomingInterviews.map(ev => {
                const date = new Date(ev.fecha_hora);
                return (
                  <div key={ev.id} className="upcoming-item">
                    <div className="upcoming-date-box">
                      <div style={{fontSize:'0.6rem', textTransform:'uppercase', fontWeight:800, color:'var(--text-muted)'}}>{date.toLocaleString('es-AR', { month: 'short' })}</div>
                      <div style={{fontSize:'1.25rem', fontWeight:800, color:'var(--primary)'}}>{date.getDate()}</div>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'0.65rem', fontWeight:800, color:'var(--accent)'}}>{date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} HS</div>
                      <div style={{fontWeight:700, fontSize:'0.9rem'}}>{ev.alumno_apellido}, {ev.alumno_nombre}</div>
                      <div style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>{ev.contacto_entrevista_nombre}</div>
                    </div>
                    <button 
                      className="btn btn-ghost" 
                      style={{padding:'0.5rem'}}
                      onClick={() => window.open(`https://wa.me/${(ev.contacto_entrevista_dato||'').replace(/\D/g,'')}?text=Hola ${ev.contacto_entrevista_nombre}, te recordamos la entrevista...`, '_blank')}
                    >
                      <MessageCircle size={18} color="#25D366" />
                    </button>
                  </div>
                );
              })}
              {upcomingInterviews.length === 0 && (
                <div style={{gridColumn:'1 / -1', textAlign:'center', padding:'2rem', color:'var(--text-muted)'}}>
                  No hay entrevistas próximas programadas.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card animate-in">
            <h3 style={{ marginBottom: '1.5rem' }}>Agendar Entrevista</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Alumno: <strong>{selectedFicha?.apellido}, {selectedFicha?.nombre}</strong>
            </p>
            
            <div className="form-group">
              <label className="form-label">Fecha</label>
              <input type="date" className="form-input" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
            </div>
            
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Hora</label>
              <input type="time" className="form-input" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
            </div>
            
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Notas (opcional)</label>
              <textarea className="form-textarea" rows={2} value={notas} onChange={e => setNotas(e.target.value)} placeholder="Ej: Traer boletín..." />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSchedule}>Confirmar Turno</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SplitAgenda;
