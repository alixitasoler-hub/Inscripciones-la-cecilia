import { useState, useEffect } from 'react';
import { 
  User, 
  BookOpen, 
  Heart, 
  Users, 
  Home, 
  FileCheck, 
  ChevronRight, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api';

const STEPS = [
  { id: 1, label: 'Alumno', icon: <User size={18} /> },
  { id: 2, label: 'Escolaridad', icon: <BookOpen size={18} /> },
  { id: 3, label: 'Salud y Actv.', icon: <Heart size={18} /> },
  { id: 4, label: 'Responsables', icon: <Users size={18} /> },
  { id: 5, label: 'Familia', icon: <Home size={18} /> },
  { id: 6, label: 'Acuerdo', icon: <FileCheck size={18} /> }
];

const LOCALIDADES_MAP: Record<string, any> = {
  'Santa Fe': { provincia: 'Santa Fe', pais: 'Argentina', cp: '3000' },
  'Recreo': { provincia: 'Santa Fe', pais: 'Argentina', cp: '3018' },
  'Monte Vera': { provincia: 'Santa Fe', pais: 'Argentina', cp: '3014' },
  'Esperanza de Santa Fe': { provincia: 'Santa Fe', pais: 'Argentina', cp: '3080' },
  'Paraná de Entre Ríos': { provincia: 'Entre Ríos', pais: 'Argentina', cp: '3100' }
};

const FormularioIngreso = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [isAbierto, setIsAbierto] = useState(true);
  const [terminosAceptados, setTerminosAceptados] = useState(false);

  // Estado unificado
  const [data, setData] = useState({
    ficha: {
      apellido: '', nombre: '', dni_tipo: 'DNI', dni_nro: '', sexo: '', fecha_nac: '', lugar_nac: '',
      direccion: '', localidad: '', provincia: 'Santa Fe', pais: 'Argentina', cp: '',
      telefono_alumno: '', email_alumno: '', nivel_ingreso: '', grado_anio: '', repitente: false,
      observaciones_nivel: '', salud_detalles: '', embarazo_parto: '', discapacidad: '', 
      tiene_cud: false, obra_social: '', otras_actividades: '', problemas_aprendizaje: '', 
      motivo_eleccion: '', situacion_socioeconomica: '', otros_datos: '',
      contacto_entrevista_nombre: '', contacto_entrevista_medio: '', contacto_entrevista_dato: '',
      observaciones_generales: '', ciclo_lectivo: new Date().getFullYear() + 1
    },
    escolaridad: [
      { nivel: 'Jardín', anio_cursado: '', escuela: '', observaciones: '' },
      { nivel: 'Preescolar', anio_cursado: '', escuela: '', observaciones: '' },
      { nivel: 'Primaria', anio_cursado: '', escuela: '', observaciones: '' },
      { nivel: 'Secundaria', anio_cursado: '', escuela: '', observaciones: '' }
    ],
    padres: [
      { rol: 'Madre', rol_otro: '', apellido: '', nombre: '', dni_nro: '', dni_tipo: 'DNI', estado_civil: '', fecha_nac: '', lugar_nac_datos: '', domicilio_datos: '', telefono_casa: '', celular: '', email: '', profesion_ocupacion: '', empresa_laboral: '', telefono_laboral: '', horarios_laborales: '', whatsapp_contacto: true },
      { rol: 'Padre', rol_otro: '', apellido: '', nombre: '', dni_nro: '', dni_tipo: 'DNI', estado_civil: '', fecha_nac: '', lugar_nac_datos: '', domicilio_datos: '', telefono_casa: '', celular: '', email: '', profesion_ocupacion: '', empresa_laboral: '', telefono_laboral: '', horarios_laborales: '', whatsapp_contacto: false }
    ],
    hermanos: [] as Array<{nombre_apellido: string, dni_nro: string, fecha_nac: string, estado_civil: string, estudios_escuela: string, domicilio_ocupacion: string, ocupacion: string}>,
    convivientes: [] as Array<{nombre_apellido: string, vinculo: string, edad: string, observaciones: string}>
  });

  useEffect(() => {
    fetch(`${API_URL}/config`).then(res => res.json()).then(conf => {
      if (conf.inscripciones_abiertas === '0') setIsAbierto(false);
    }).catch(() => {});
  }, []);

  const handleFichaChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    let newData = { ...data.ficha, [name]: type === 'checkbox' ? checked : value };
    
    if (name === 'localidad' && LOCALIDADES_MAP[value]) {
      const ubi = LOCALIDADES_MAP[value];
      newData = { ...newData, provincia: ubi.provincia, pais: ubi.pais, cp: ubi.cp };
    }

    setData({ ...data, ficha: newData });
    if (fieldErrors.includes(name)) {
      setFieldErrors(prev => prev.filter(f => f !== name));
    }
  };

  const handleSalir = () => {
    if (confirm('¿Desea salir del formulario? Se perderán los datos no enviados.')) {
      window.location.href = '/';
    }
  };

  const addToArray = (key: string, item: any) => {
    setData({ ...data, [key]: [...(data as any)[key], item] });
  };

  const updateArray = (key: string, index: number, field: string, value: any) => {
    const newList = [...(data as any)[key]];
    newList[index] = { ...newList[index], [field]: value };
    setData({ ...data, [key]: newList });
    
    const errorKey = `p${index}_${field}`;
    if (fieldErrors.includes(errorKey)) {
        setFieldErrors(prev => prev.filter(f => f !== errorKey));
    }
  };

  const removeFromArray = (key: string, index: number) => {
    if (key === 'padres' && data.padres.length <= 1) {
        alert('Debe haber al menos un adulto responsable cargado.');
        return;
    }
    const newList = [...(data as any)[key]];
    newList.splice(index, 1);
    setData({ ...data, [key]: newList });
  };

  const nextStep = () => {
    if (currentStep === 1) {
      const required = ['apellido', 'nombre', 'dni_nro', 'nivel_ingreso'];
      const missing = required.filter(f => !(data.ficha as any)[f]);
      if (missing.length > 0) {
        setFieldErrors(missing);
        return;
      }
    }

    if (currentStep === 4) {
      let errors: string[] = [];
      let atLeastOneComplete = false;

      data.padres.forEach((p, idx) => {
        const hasSomeData = p.apellido || p.nombre || p.dni_nro || p.domicilio_datos || p.celular;
        if (hasSomeData) {
            if (!p.apellido) errors.push(`p${idx}_apellido`);
            if (!p.nombre) errors.push(`p${idx}_nombre`);
            if (!p.rol) errors.push(`p${idx}_rol`);
            if (!p.dni_nro) errors.push(`p${idx}_dni_nro`);
            if (!p.domicilio_datos) errors.push(`p${idx}_domicilio_datos`);
            if (!p.celular && !p.telefono_casa) errors.push(`p${idx}_celular`);
            
            if (p.apellido && p.nombre && p.rol && p.dni_nro && p.domicilio_datos && (p.celular || p.telefono_casa)) {
                atLeastOneComplete = true;
            }
        }
      });

      if (!atLeastOneComplete) {
          alert('Debe cargar al menos un adulto responsable con todos sus datos obligatorios (*).');
          return;
      }

      const { contacto_entrevista_nombre, contacto_entrevista_medio, contacto_entrevista_dato } = data.ficha;
      if (!contacto_entrevista_nombre || !contacto_entrevista_medio || !contacto_entrevista_dato) {
          setFieldErrors(prev => [...prev, 'contacto_entrevista_nombre', 'contacto_entrevista_medio', 'contacto_entrevista_dato']);
          alert('Debe completar los datos de la persona de contacto para la entrevista.');
          return;
      }

      if (errors.length > 0) {
        setFieldErrors(errors);
        return;
      }
    }
    
    window.scrollTo(0, 0);
    setError('');
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };
  
  const prevStep = () => {
    window.scrollTo(0, 0);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!terminosAceptados) {
      setError('Debe aceptar los términos y condiciones para enviar la ficha.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        ...data,
        padres: data.padres.map(p => ({
            ...p,
            rol: p.rol === 'Otro' ? p.rol_otro : p.rol
        }))
      };

      const res = await fetch(`${API_URL}/fichas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error || 'Error al enviar la ficha.');
      setSuccess(true);
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isAbierto) return (
    <div className="card text-center animate-in" style={{padding: '4rem'}}>
      <AlertCircle size={48} color="var(--error)" style={{marginBottom: '1.5rem'}} />
      <h2>Inscripciones Cerradas</h2>
      <p style={{marginTop: '1rem', color: 'var(--text-muted)'}}>Lo sentimos, el período de solicitudes no se encuentra abierto en este momento.</p>
    </div>
  );

  if (success) return (
    <div className="card text-center animate-in" style={{padding: '4rem'}}>
      <CheckCircle2 size={64} color="var(--success)" style={{marginBottom: '1.5rem'}} />
      <h2 style={{color: 'var(--success)'}}>¡Ficha Enviada con Éxito!</h2>
      <p style={{marginTop: '1.5rem', maxWidth: '500px', margin: '1.5rem auto 0'}}>
        Hemos recibido la solicitud para <strong>{data.ficha.nombre} {data.ficha.apellido}</strong>. 
        Pronto nos pondremos en contacto según los datos provistos para coordinar los siguientes pasos.
      </p>
      <button onClick={() => window.location.reload()} className="btn btn-primary" style={{marginTop: '2.5rem'}}>Finalizar</button>
    </div>
  );

  const getFieldClass = (name: string, index?: number) => `form-input ${fieldErrors.includes(index !== undefined ? 'p' + index + '_' + name : name) ? 'error' : ''}`;
  const getSelectClass = (name: string, index?: number) => `form-select ${fieldErrors.includes(index !== undefined ? 'p' + index + '_' + name : name) ? 'error' : ''}`;

  return (
    <div className="card animate-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-6" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Ficha de Inscripción</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Ciclo Lectivo {data.ficha.ciclo_lectivo}</p>
        </div>
        <button onClick={handleSalir} className="btn btn-ghost" style={{ color: 'var(--error)' }}>Salir</button>
      </div>

      <div className="wizard-progress">
        {STEPS.map(s => (
          <div key={s.id} className={`wizard-step ${currentStep === s.id ? 'active' : (currentStep > s.id ? 'completed' : '')}`}>
            {currentStep > s.id ? <CheckCircle2 size={18} /> : s.id}
            <span className="step-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '3rem' }}>
        {error && (
          <div className="animate-in" style={{ marginBottom: '2rem', background: '#FEE2E2', border: '1px solid #FCA5A5', padding: '1rem', borderRadius: 'var(--radius-md)', color: '#B91C1C', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <AlertCircle size={20} /> {error}
          </div>
        )}

        {/* PASO 1 */}
        {currentStep === 1 && (
          <section className="animate-in">
            <h3 className="section-title">Datos Personales del Alumno</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group"><label className="form-label">Apellido(s) *</label><input className={getFieldClass('apellido')} name="apellido" value={data.ficha.apellido} onChange={handleFichaChange} /></div>
              <div className="form-group"><label className="form-label">Nombre(s) *</label><input className={getFieldClass('nombre')} name="nombre" value={data.ficha.nombre} onChange={handleFichaChange} /></div>
              <div className="form-group">
                <label className="form-label">Tipo Documento</label>
                <select className="form-select" name="dni_tipo" value={data.ficha.dni_tipo} onChange={handleFichaChange}>
                  <option value="DNI">DNI</option><option value="Pasaporte">Pasaporte</option><option value="Cédula">Cédula</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Número Documento *</label><input className={getFieldClass('dni_nro')} name="dni_nro" placeholder="Sin puntos ni espacios" value={data.ficha.dni_nro} onChange={handleFichaChange} /></div>
              
              <div className="form-group">
                <label className="form-label">Sexo</label>
                <select className="form-select" name="sexo" value={data.ficha.sexo} onChange={handleFichaChange}>
                  <option value="">Seleccionar...</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="No binario">No binario</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Fecha Nacimiento</label><input type="date" className="form-input" name="fecha_nac" value={data.ficha.fecha_nac} onChange={handleFichaChange} /></div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Dirección (Calle y Altura)</label><input className="form-input" name="direccion" value={data.ficha.direccion} onChange={handleFichaChange} /></div>
              
              <div className="form-group">
                <label className="form-label">Localidad/Ciudad</label>
                <input className="form-input" list="localidades-list" name="localidad" value={data.ficha.localidad} onChange={handleFichaChange} />
                <datalist id="localidades-list">
                  {Object.keys(LOCALIDADES_MAP).map(l => <option key={l} value={l} />)}
                </datalist>
              </div>
              <div className="form-group"><label className="form-label">Provincia</label><input className="form-input" name="provincia" value={data.ficha.provincia} onChange={handleFichaChange} /></div>
              
              <div className="form-group">
                <label className="form-label">Nivel a Inscribirse *</label>
                <select className={getSelectClass('nivel_ingreso')} name="nivel_ingreso" value={data.ficha.nivel_ingreso} onChange={handleFichaChange}>
                  <option value="">Seleccione nivel...</option>
                  <option value="Nivel Inicial">Nivel Inicial (Jardín)</option>
                  <option value="EPO (Primaria)">EPO (Primaria)</option>
                  <option value="ESO (Secundaria)">ESO (Secundaria)</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Grado/Año</label><input className="form-input" name="grado_anio" placeholder="Ej: 1er Grado" value={data.ficha.grado_anio} onChange={handleFichaChange} /></div>
            </div>
          </section>
        )}

        {/* PASO 2 */}
        {currentStep === 2 && (
          <section className="animate-in">
            <h3 className="section-title">Escolaridad Previa</h3>
            <p className="mb-4" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Complete los datos si el alumno ya ha asistido a otras instituciones.</p>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead><tr style={{ background:'var(--primary)', color:'white' }}><th style={{color:'white'}}>Nivel</th><th style={{color:'white'}}>Institución / Escuela</th><th style={{color:'white'}}>Año</th></tr></thead>
                <tbody>
                  {data.escolaridad.map((e, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700 }}>{e.nivel}</td>
                      <td><input className="form-input" style={{border:'none', borderRadius:0, padding: '0.5rem'}} placeholder="Nombre de la escuela" value={e.escuela} onChange={v => updateArray('escolaridad', idx, 'escuela', v.target.value)} /></td>
                      <td><input className="form-input" style={{border:'none', borderRadius:0, padding: '0.5rem'}} placeholder="Ej: 2023" value={e.anio_cursado} onChange={v => updateArray('escolaridad', idx, 'anio_cursado', v.target.value)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* PASO 3 */}
        {currentStep === 3 && (
          <section className="animate-in">
            <h3 className="section-title">Salud y Actividades</h3>
            <div className="form-group">
              <label className="form-label">Información Médica Relevante</label>
              <textarea className="form-textarea" name="salud_detalles" placeholder="Indique alergias, enfermedades crónicas o atenciones especiales..." value={data.ficha.salud_detalles} onChange={handleFichaChange} rows={3} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group"><label className="form-label">Obra Social / Prepaga</label><input className="form-input" name="obra_social" value={data.ficha.obra_social} onChange={handleFichaChange} /></div>
              <div className="form-group">
                 <label className="form-label">¿Posee CUD?</label>
                 <div className="flex gap-4" style={{paddingTop: '0.5rem'}}>
                    <label className="flex items-center gap-2"><input type="radio" checked={data.ficha.tiene_cud} onChange={() => setData({...data, ficha: {...data.ficha, tiene_cud: true}})} /> Sí</label>
                    <label className="flex items-center gap-2"><input type="radio" checked={!data.ficha.tiene_cud} onChange={() => setData({...data, ficha: {...data.ficha, tiene_cud: false}})} /> No</label>
                 </div>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Intereses y Actividades Extra</label>
              <textarea className="form-textarea" name="otras_actividades" placeholder="¿Realiza deportes, arte o idiomas fuera del horario escolar?" value={data.ficha.otras_actividades} onChange={handleFichaChange} rows={2} />
            </div>
            <div className="form-group">
              <label className="form-label">¿Cómo conocieron la Escuela La Cecilia?</label>
              <input className="form-input" name="motivo_eleccion" value={data.ficha.motivo_eleccion} onChange={handleFichaChange} />
            </div>
          </section>
        )}

        {/* PASO 4 */}
        {currentStep === 4 && (
          <section className="animate-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="section-title" style={{marginBottom:0}}>Responsables / Tutores</h3>
              <button className="btn btn-outline btn-sm" onClick={() => addToArray('padres', { rol: '', rol_otro: '', apellido: '', nombre: '', dni_nro: '', dni_tipo: 'DNI', estado_civil: '', fecha_nac: '', lugar_nac_datos: '', domicilio_datos: '', telefono_casa: '', celular: '', email: '', profesion_ocupacion: '', empresa_laboral: '', telefono_laboral: '', horarios_laborales: '', whatsapp_contacto: false })}>+ Agregar Tutor</button>
            </div>
            
            {data.padres.map((p, idx) => (
              <div key={idx} className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderLeft: '5px solid var(--primary)' }}>
                <div className="flex justify-between items-center mb-3">
                   <h4 style={{ fontSize: '0.9375rem' }}>{p.rol === 'Otro' ? p.rol_otro : (p.rol || `Responsable ${idx + 1}`)}</h4>
                   {data.padres.length > 1 && <button onClick={() => removeFromArray('padres', idx)} className="btn btn-ghost" style={{color:'var(--error)'}}><Trash2 size={16} /></button>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                   <div className="form-group">
                      <label className="form-label">Vínculo *</label>
                      <select className={getSelectClass('rol', idx)} value={p.rol} onChange={v => updateArray('padres', idx, 'rol', v.target.value)}>
                        <option value="">Seleccionar...</option>
                        <option value="Madre">Madre</option><option value="Padre">Padre</option><option value="Tutor/a">Tutor/a</option><option value="Otro">Otro</option>
                      </select>
                      {p.rol === 'Otro' && (
                        <input className={getFieldClass('rol_otro', idx)} placeholder="¿Cuál?" style={{marginTop: '0.5rem'}} value={p.rol_otro} onChange={v => updateArray('padres', idx, 'rol_otro', v.target.value)} />
                      )}
                   </div>
                   <div className="form-group"><label className="form-label">Apellidos *</label><input className={getFieldClass('apellido', idx)} value={p.apellido} onChange={v => updateArray('padres', idx, 'apellido', v.target.value)} /></div>
                   <div className="form-group"><label className="form-label">Nombres *</label><input className={getFieldClass('nombre', idx)} value={p.nombre} onChange={v => updateArray('padres', idx, 'nombre', v.target.value)} /></div>
                   <div className="form-group"><label className="form-label">DNI *</label><input className={getFieldClass('dni_nro', idx)} placeholder="Sin puntos" value={p.dni_nro} onChange={v => updateArray('padres', idx, 'dni_nro', v.target.value)} /></div>
                   <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Domicilio Completo *</label><input className={getFieldClass('domicilio_datos', idx)} placeholder="Calle, Nro, Localidad..." value={p.domicilio_datos} onChange={v => updateArray('padres', idx, 'domicilio_datos', v.target.value)} /></div>
                   <div className="form-group"><label className="form-label">Celular / Teléfono *</label><input className={getFieldClass('celular', idx)} placeholder="Ej: 342 123456" value={p.celular} onChange={v => updateArray('padres', idx, 'celular', v.target.value)} /></div>
                </div>
              </div>
            ))}

            <div className="card" style={{ padding: '1.5rem', background: 'var(--accent-soft)', border: '1px solid var(--accent)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle size={18} color="var(--primary)" />
                  <h4 style={{ margin: 0, fontSize: '0.9375rem' }}>Preferencia de Contacto para Entrevista</h4>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                   <div className="form-group">
                      <label className="form-label">Nombre de Contacto *</label>
                      <input className={getFieldClass('contacto_entrevista_nombre')} name="contacto_entrevista_nombre" value={data.ficha.contacto_entrevista_nombre} onChange={handleFichaChange} />
                   </div>
                   <div className="form-group">
                      <label className="form-label">Medio de Contacto *</label>
                      <select className={getSelectClass('contacto_entrevista_medio')} name="contacto_entrevista_medio" value={data.ficha.contacto_entrevista_medio} onChange={handleFichaChange}>
                        <option value="">Seleccione medio...</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Email">Email</option>
                        <option value="Llamada Telefónica">Llamada Telefónica</option>
                      </select>
                   </div>
                   <div className="form-group" style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">Número o Email destino *</label>
                      <input className={getFieldClass('contacto_entrevista_dato')} name="contacto_entrevista_dato" placeholder="Ej: +54 9 342... o nombre@correo.com" value={data.ficha.contacto_entrevista_dato} onChange={handleFichaChange} />
                   </div>
                </div>
            </div>
          </section>
        )}

        {/* PASO 5 */}
        {currentStep === 5 && (
          <section className="animate-in">
            <h3 className="section-title">Composición Familiar</h3>
            <div className="flex justify-between items-center mb-3">
              <h4 style={{fontSize:'0.875rem'}}>Hermanos / Hermanas</h4>
              <button className="btn btn-outline btn-sm" onClick={() => addToArray('hermanos', { nombre_apellido: '', dni_nro: '', fecha_nac: '', estado_civil: '', estudios_escuela: '', domicilio_ocupacion: '', ocupacion: '' })}>+ Agregar</button>
            </div>
            <div className="admin-table-container mb-4">
              <table className="admin-table">
                <thead><tr><th>Nombre y Apellido</th><th>DNI</th><th>Escuela</th><th>Acción</th></tr></thead>
                <tbody>
                  {data.hermanos.map((h, idx) => (
                    <tr key={idx}>
                      <td><input className="form-input" style={{border:'none', background:'transparent'}} value={h.nombre_apellido} onChange={v => updateArray('hermanos', idx, 'nombre_apellido', v.target.value)} /></td>
                      <td><input className="form-input" style={{border:'none', background:'transparent'}} value={h.dni_nro} onChange={v => updateArray('hermanos', idx, 'dni_nro', v.target.value)} /></td>
                      <td><input className="form-input" style={{border:'none', background:'transparent'}} value={h.estudios_escuela} onChange={v => updateArray('hermanos', idx, 'estudios_escuela', v.target.value)} /></td>
                      <td><button onClick={() => removeFromArray('hermanos', idx)} className="btn btn-ghost" style={{color:'var(--error)'}}><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                  {data.hermanos.length === 0 && <tr><td colSpan={4} style={{textAlign:'center', padding:'1rem'}}>No se registraron hermanos.</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="form-group">
                <label className="form-label">Observaciones Adicionales / Situación Socioeconómica</label>
                <textarea className="form-textarea" name="otros_datos" placeholder="Indique cualquier otra información que considere importante para la escuela..." value={data.ficha.otros_datos} onChange={handleFichaChange} rows={4} />
            </div>
          </section>
        )}

        {/* PASO 6 */}
        {currentStep === 6 && (
          <section className="animate-in">
            <h3 className="section-title">Acuerdo y Envío</h3>
            <div className="card" style={{ padding: '1.5rem', maxHeight: '350px', overflowY: 'auto', background: '#F9FAFB', fontSize: '0.8125rem', lineHeight: '1.7', border: '1px solid var(--border-color)' }}>
              <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--primary)' }}>ACUERDO DE ADMISIÓN Y PERMANENCIA</h4>
              <p>Al enviar este documento, la familia declara conocer el Proyecto Educativo Institucional (PEI) de la Escuela La Cecilia y se compromete a respetar sus principios fundacionales...</p>
              <p style={{ marginTop: '1rem' }}><strong>Alimentación:</strong> La escuela promueve una alimentación consciente y vegetariana dentro del predio escolar...</p>
              <p style={{ marginTop: '1rem' }}><strong>Convivencia:</strong> Nos basamos en el respeto mutuo, el buen trato y la resolución pacífica de conflictos...</p>
              <p style={{ marginTop: '1rem' }}><strong>Compromiso Económico:</strong> La familia se compromete al pago mensual de las cuotas de marzo a diciembre, así como la matrícula correspondiente...</p>
            </div>
            
            <label className="flex items-center gap-3 mt-6" style={{ background: 'var(--accent-soft)', padding: '1.25rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', border: '1px solid var(--accent)' }}>
              <input 
                type="checkbox" 
                style={{ width: '20px', height: '20px' }} 
                checked={terminosAceptados} 
                onChange={e => setTerminosAceptados(e.target.checked)} 
              />
              <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--primary)' }}>
                Entiendo y acepto las condiciones expresadas en el acuerdo de admisión y declaro la veracidad de los datos informados.
              </span>
            </label>
          </section>
        )}

        <div className="flex justify-between mt-8 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
          {currentStep > 1 && (
            <button className="btn btn-outline" onClick={prevStep}>
              <ArrowLeft size={18} /> Anterior
            </button>
          )}
          <div style={{ marginLeft: 'auto' }}>
            {currentStep < STEPS.length ? (
              <button className="btn btn-primary" onClick={nextStep}>
                Siguiente Pasos <ChevronRight size={18} />
              </button>
            ) : (
              <button className="btn btn-accent" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Enviando...' : 'Finalizar y Enviar Solicitud'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Trash2 = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
);

export default FormularioIngreso;
