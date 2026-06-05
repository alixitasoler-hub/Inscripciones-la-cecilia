import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Edit3, Save, X, User, Users, BookOpen, Heart, Home } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://sistema-inscripciones.alixitasoler.workers.dev/api';

interface FichaDetalleProps {
  token: string;
  onAuthError: () => void;
}

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: '#64748B' },
  contactado: { label: 'Contactado', color: '#F59E0B' },
  entrevista_programada: { label: 'Entrevista Programada', color: '#3B82F6' },
  finalizado: { label: 'Admitido', color: '#10B981' },
  cancelado: { label: 'Cancelado / Baja', color: '#EF4444' },
};

const Campo = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div style={{ marginBottom: '1rem' }}>
    <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>
      {label}
    </div>
    <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 500 }}>
      {value || <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>No informado</span>}
    </div>
  </div>
);

const Seccion = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div style={{ marginBottom: '2rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '2px solid var(--border-color)' }}>
      <div style={{ background: 'var(--primary-soft)', color: 'var(--primary)', padding: '0.4rem', borderRadius: '8px', display: 'flex' }}>
        {icon}
      </div>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--secondary)' }}>{title}</h3>
    </div>
    {children}
  </div>
);

const Grid = ({ cols = 3, children }: { cols?: number; children: React.ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '0 2rem' }}>
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
      <button className="btn btn-outline" onClick={() => navigate(-1)}>Volver</button>
    </div>
  );

  if (!data) return null;

  const { ficha, escolaridad = [], padres = [], hermanos = [], convivientes = [] } = data;
  const estado = ESTADO_LABELS[ficha.estado] || { label: ficha.estado, color: '#64748B' };

  const InputEdit = ({ campo, label }: { campo: string; label: string }) => (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{label}</div>
      <input
        type="text"
        className="form-input"
        style={{ fontSize: '0.9rem', padding: '0.4rem 0.75rem' }}
        value={fichaEdit[campo] ?? ''}
        onChange={e => setFichaEdit({ ...fichaEdit, [campo]: e.target.value })}
      />
    </div>
  );

  return (
    <>
      {/* Estilos de impresión */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .v2-sidebar { display: none !important; }
          .v2-layout { grid-template-columns: 1fr !important; }
          .v2-content { max-height: none !important; overflow: visible !important; padding: 0 !important; }
          body { background: white !important; }
          .ficha-detalle-container { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="ficha-detalle-container animate-in">
        {/* Barra superior */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

        {/* Encabezado de la ficha */}
        <div style={{ background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-lg)', padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.7, marginBottom: '0.5rem' }}>
              Ficha de Inscripción #{ficha.id}
            </div>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 900 }}>
              {ficha.apellido}, {ficha.nombre}
            </h1>
            <div style={{ marginTop: '0.5rem', opacity: 0.85 }}>
              DNI {ficha.dni_tipo} {ficha.dni_nro} · {ficha.nivel_ingreso} — {ficha.grado_anio}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '0.5rem 1rem', marginBottom: '0.5rem' }}>
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
        <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', boxShadow: 'var(--shadow-sm)' }}>

          {/* Datos del Alumno */}
          <Seccion title="Datos del Alumno" icon={<User size={16} />}>
            {editando ? (
              <Grid cols={3}>
                <InputEdit campo="nombre" label="Nombre" />
                <InputEdit campo="apellido" label="Apellido" />
                <InputEdit campo="dni_nro" label="DNI Nro" />
                <InputEdit campo="sexo" label="Sexo" />
                <InputEdit campo="fecha_nac" label="Fecha de Nacimiento" />
                <InputEdit campo="lugar_nac" label="Lugar de Nacimiento" />
                <InputEdit campo="direccion" label="Dirección" />
                <InputEdit campo="localidad" label="Localidad" />
                <InputEdit campo="provincia" label="Provincia" />
                <InputEdit campo="pais" label="País" />
                <InputEdit campo="cp" label="Código Postal" />
                <InputEdit campo="telefono_alumno" label="Teléfono Alumno" />
                <InputEdit campo="email_alumno" label="Email Alumno" />
                <InputEdit campo="obra_social" label="Obra Social" />
                <InputEdit campo="otras_actividades" label="Otras Actividades" />
              </Grid>
            ) : (
              <Grid cols={3}>
                <Campo label="Nombre" value={ficha.nombre} />
                <Campo label="Apellido" value={ficha.apellido} />
                <Campo label="DNI" value={`${ficha.dni_tipo || ''} ${ficha.dni_nro || ''}`} />
                <Campo label="Sexo" value={ficha.sexo} />
                <Campo label="Fecha de Nacimiento" value={ficha.fecha_nac} />
                <Campo label="Lugar de Nacimiento" value={ficha.lugar_nac} />
                <Campo label="Dirección" value={ficha.direccion} />
                <Campo label="Localidad" value={ficha.localidad} />
                <Campo label="Provincia" value={ficha.provincia} />
                <Campo label="País" value={ficha.pais} />
                <Campo label="Código Postal" value={ficha.cp} />
                <Campo label="Teléfono" value={ficha.telefono_alumno} />
                <Campo label="Email" value={ficha.email_alumno} />
                <Campo label="Obra Social" value={ficha.obra_social} />
                <Campo label="Otras Actividades" value={ficha.otras_actividades} />
              </Grid>
            )}
          </Seccion>

          {/* Información Escolar */}
          <Seccion title="Información Escolar" icon={<BookOpen size={16} />}>
            {editando ? (
              <Grid cols={3}>
                <InputEdit campo="nivel_ingreso" label="Nivel de Ingreso" />
                <InputEdit campo="grado_anio" label="Grado / Año" />
                <InputEdit campo="ciclo_lectivo" label="Ciclo Lectivo" />
                <InputEdit campo="repitente" label="Repitente (si/no)" />
                <InputEdit campo="motivo_eleccion" label="Motivo de Elección" />
                <InputEdit campo="problemas_aprendizaje" label="Problemas de Aprendizaje" />
              </Grid>
            ) : (
              <Grid cols={3}>
                <Campo label="Nivel de Ingreso" value={ficha.nivel_ingreso} />
                <Campo label="Grado / Año" value={ficha.grado_anio} />
                <Campo label="Ciclo Lectivo" value={ficha.ciclo_lectivo} />
                <Campo label="Repitente" value={ficha.repitente ? 'Sí' : 'No'} />
                <Campo label="Motivo de Elección" value={ficha.motivo_eleccion} />
                <Campo label="Problemas de Aprendizaje" value={ficha.problemas_aprendizaje} />
              </Grid>
            )}

            {escolaridad.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Historial Escolar</div>
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
          <Seccion title="Salud" icon={<Heart size={16} />}>
            {editando ? (
              <Grid cols={2}>
                <InputEdit campo="salud_detalles" label="Detalles de Salud" />
                <InputEdit campo="embarazo_parto" label="Embarazo / Parto" />
                <InputEdit campo="discapacidad" label="Discapacidad" />
                <InputEdit campo="tiene_cud" label="Tiene CUD (si/no)" />
              </Grid>
            ) : (
              <Grid cols={2}>
                <Campo label="Detalles de Salud" value={ficha.salud_detalles} />
                <Campo label="Embarazo / Parto" value={ficha.embarazo_parto} />
                <Campo label="Discapacidad" value={ficha.discapacidad} />
                <Campo label="Tiene CUD" value={ficha.tiene_cud ? 'Sí' : 'No'} />
              </Grid>
            )}
          </Seccion>

          {/* Padres / Tutores */}
          {padres.length > 0 && (
            <Seccion title="Padres / Tutores" icon={<Users size={16} />}>
              {padres.map((p: any, i: number) => (
                <div key={i} style={{ background: '#f8fafc', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '1rem' }}>{p.rol || `Contacto ${i + 1}`}</div>
                  <Grid cols={3}>
                    <Campo label="Nombre" value={`${p.apellido || ''}, ${p.nombre || ''}`} />
                    <Campo label="DNI" value={p.dni_nro} />
                    <Campo label="Estado Civil" value={p.estado_civil} />
                    <Campo label="Celular" value={p.celular} />
                    <Campo label="Email" value={p.email} />
                    <Campo label="WhatsApp" value={p.whatsapp_contacto ? 'Sí' : 'No'} />
                    <Campo label="Profesión" value={p.profesion_ocupacion} />
                    <Campo label="Empresa" value={p.empresa_laboral} />
                    <Campo label="Tel. Laboral" value={p.telefono_laboral} />
                    <Campo label="Dirección" value={p.direccion} />
                    <Campo label="Localidad" value={p.localidad} />
                    <Campo label="Horarios" value={p.horarios_laborales} />
                  </Grid>
                </div>
              ))}
            </Seccion>
          )}

          {/* Hermanos */}
          {hermanos.length > 0 && (
            <Seccion title="Hermanos / Familiares" icon={<Users size={16} />}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Vínculo', 'Nombre y Apellido', 'DNI', 'Fecha Nac.', 'Estado Civil', 'Estudios / Escuela'].map(h => (
                      <th key={h} style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hermanos.map((h: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem 1rem' }}>{h.vinculo}</td>
                      <td style={{ padding: '0.5rem 1rem', fontWeight: 600 }}>{h.nombre_apellido}</td>
                      <td style={{ padding: '0.5rem 1rem' }}>{h.dni_nro}</td>
                      <td style={{ padding: '0.5rem 1rem' }}>{h.fecha_nac}</td>
                      <td style={{ padding: '0.5rem 1rem' }}>{h.estado_civil}</td>
                      <td style={{ padding: '0.5rem 1rem' }}>{h.estudios_escuela}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Seccion>
          )}

          {/* Convivientes */}
          {convivientes.length > 0 && (
            <Seccion title="Grupo Conviviente" icon={<Home size={16} />}>
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
          <Seccion title="Información Administrativa" icon={<User size={16} />}>
            {editando ? (
              <Grid cols={3}>
                <InputEdit campo="contacto_entrevista_nombre" label="Contacto Entrevista - Nombre" />
                <InputEdit campo="contacto_entrevista_medio" label="Contacto Entrevista - Medio" />
                <InputEdit campo="contacto_entrevista_dato" label="Contacto Entrevista - Dato" />
                <InputEdit campo="situacion_socioeconomica" label="Situación Socioeconómica" />
                <InputEdit campo="otros_datos" label="Otros Datos" />
              </Grid>
            ) : (
              <Grid cols={3}>
                <Campo label="Contacto - Nombre" value={ficha.contacto_entrevista_nombre} />
                <Campo label="Contacto - Medio" value={ficha.contacto_entrevista_medio} />
                <Campo label="Contacto - Dato" value={ficha.contacto_entrevista_dato} />
                <Campo label="Situación Socioeconómica" value={ficha.situacion_socioeconomica} />
                <Campo label="Otros Datos" value={ficha.otros_datos} />
              </Grid>
            )}
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Observaciones Generales</div>
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
                  {ficha.observaciones_generales || <span style={{ color: '#CBD5E1', fontStyle: 'italic' }}>Sin observaciones</span>}
                </p>
              )}
            </div>
          </Seccion>

        </div>
      </div>
    </>
  );
};

export default FichaDetalle;
