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
  HelpCircle,
  Plus,
  Trash2,
  Calendar
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

const GRADOS_POR_NIVEL: Record<string, string[]> = {
  'Nivel Inicial': ['Sala de 3 años', 'Sala de 4 años', 'Sala de 5 años'],
  'EPO (Primaria)': ['1° grado', '2° grado', '3° grado', '4° grado', '5° grado', '6° grado', '7° grado'],
  'ESO (Secundaria)': ['1° año', '2° año', '3° año', '4° año', '5° año']
};

const ORDEN_ESCOLARIDAD = [
  'Sala de 3 años', 'Sala de 4 años', 'Sala de 5 años',
  '1° grado', '2° grado', '3° grado', '4° grado', '5° grado', '6° grado', '7° grado',
  '1° año', '2° año', '3° año', '4° año', '5° año'
];

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
      tiene_cud: false, posee_discapacidad: false, obra_social: '', otras_actividades: '', problemas_aprendizaje: '', 
      motivo_eleccion: '', situacion_socioeconomica: '', otros_datos: '',
      contacto_entrevista_nombre: '', contacto_entrevista_medio: '', contacto_entrevista_dato: '',
      observaciones_generales: '', ciclo_lectivo: '' as string | number
    },
    escolaridad: [
      { nivel: 'Sala de 3 años', anio_cursado: '', escuela: '', observaciones: '' },
      { nivel: 'Sala de 4 años', anio_cursado: '', escuela: '', observaciones: '' },
      { nivel: 'Sala de 5 años', anio_cursado: '', escuela: '', observaciones: '' },
      { nivel: '1° grado', anio_cursado: '', escuela: '', observaciones: '' },
      { nivel: '2° grado', anio_cursado: '', escuela: '', observaciones: '' },
      { nivel: '3° grado', anio_cursado: '', escuela: '', observaciones: '' },
      { nivel: '4° grado', anio_cursado: '', escuela: '', observaciones: '' },
      { nivel: '5° grado', anio_cursado: '', escuela: '', observaciones: '' },
      { nivel: '6° grado', anio_cursado: '', escuela: '', observaciones: '' },
      { nivel: '7° grado', anio_cursado: '', escuela: '', observaciones: '' },
      { nivel: '1° año', anio_cursado: '', escuela: '', observaciones: '' },
      { nivel: '2° año', anio_cursado: '', escuela: '', observaciones: '' },
      { nivel: '3° año', anio_cursado: '', escuela: '', observaciones: '' },
      { nivel: '4° año', anio_cursado: '', escuela: '', observaciones: '' },
      { nivel: '5° año', anio_cursado: '', escuela: '', observaciones: '' }
    ],
    padres: [
      { rol: '', rol_otro: '', apellido: '', nombre: '', dni_nro: '', dni_tipo: 'DNI', estado_civil: '', fecha_nac: '', lugar_nac_datos: '', domicilio_datos: '', telefono_casa: '', celular: '', email: '', profesion_ocupacion: '', empresa_laboral: '', telefono_laboral: '', horarios_laborales: '', whatsapp_contacto: false }
    ],
    hermanos: [] as Array<{vinculo: string, vinculo_otro: string, nombre_apellido: string, dni_nro: string, fecha_nac: string, estado_civil: string, estudios_escuela: string, domicilio_ocupacion: string, ocupacion: string}>,
    convivientes: [] as Array<{nombre_apellido: string, vinculo: string, edad: string, observaciones: string}>
  });

  useEffect(() => {
    fetch(`${API_URL}/config`).then(res => res.json()).then(conf => {
      if (conf.inscripciones_abiertas === '0') setIsAbierto(false);
    }).catch(() => {});
  }, []);

  const handleFichaChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;
    
    let newData = { ...data.ficha, [name]: newValue };
    
    // Si cambia el nivel, reseteamos el grado
    if (name === 'nivel_ingreso') {
      newData.grado_anio = '';
    }

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
      const required = ['apellido', 'nombre', 'dni_nro', 'nivel_ingreso', 'grado_anio'];
      const missing = required.filter(f => !(data.ficha as any)[f]);
      if (missing.length > 0) {
        setFieldErrors(missing);
        alert('Por favor complete los campos obligatorios (*) marcados en rojo.');
        return;
      }
      if (!data.ficha.ciclo_lectivo) {
        alert('Debe seleccionar el Ciclo Lectivo para el que solicita el ingreso.');
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
        escolaridad: data.escolaridad.filter(e => e.escuela.trim() !== '' || e.anio_cursado.trim() !== ''),
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
      <h2 style={{fontSize: '2rem'}}>Inscripciones Cerradas</h2>
      <p style={{marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '1.125rem'}}>Lo sentimos, el período de solicitudes no se encuentra abierto en este momento.</p>
      <button onClick={() => window.location.href = '/'} className="btn btn-outline" style={{marginTop: '2.5rem'}}>Volver al inicio</button>
    </div>
  );

  if (success) return (
    <div className="card text-center animate-in" style={{padding: '5rem 3rem'}}>
      <div style={{ background: 'var(--success)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)' }}>
        <CheckCircle2 size={40} color="white" />
      </div>
      <h2 style={{color: 'var(--success)', fontSize: '2.25rem', fontWeight: 800}}>¡Ficha Enviada!</h2>
      <p style={{marginTop: '2rem', maxWidth: '600px', margin: '2rem auto 0', fontSize: '1.125rem', lineHeight: '1.8', color: 'var(--text-muted)' }}>
        Hemos recibido la solicitud para <strong>{data.ficha.nombre} {data.ficha.apellido}</strong>. <br/>
        Pronto nos pondremos en contacto con <strong>{data.ficha.contacto_entrevista_nombre}</strong> vía <strong>{data.ficha.contacto_entrevista_medio}</strong> para coordinar la entrevista de admisión.
      </p>
      <button onClick={() => window.location.reload()} className="btn btn-primary" style={{marginTop: '3.5rem', padding: '1rem 3rem'}}>Finalizar</button>
    </div>
  );

  const getFieldClass = (name: string, index?: number) => `form-input ${fieldErrors.includes(index !== undefined ? 'p' + index + '_' + name : name) ? 'error' : ''}`;
  const getSelectClass = (name: string, index?: number) => `form-select ${fieldErrors.includes(index !== undefined ? 'p' + index + '_' + name : name) ? 'error' : ''}`;

  return (
    <div className="card animate-in" style={{ maxWidth: '900px', margin: '0 auto', borderTop: 'none' }}>
      <div className="flex justify-between items-start mb-10" style={{ paddingBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-4">
          <img src="/logo.jpg" alt="Logo La Cecilia" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem', letterSpacing: '-0.025em' }}>Ficha de Inscripción</h2>
            <div className="flex items-center gap-2 text-muted" style={{fontSize: '0.875rem', fontWeight: 600}}>
              <Calendar size={14} />
              Ciclo Lectivo {data.ficha.ciclo_lectivo}
            </div>
          </div>
        </div>
        <button onClick={handleSalir} className="btn btn-ghost" style={{ color: 'var(--error)', fontWeight: 700 }}>Salir</button>
      </div>

      <div className="wizard-progress">
        {STEPS.map(s => (
          <div key={s.id} className={`wizard-step ${currentStep === s.id ? 'active' : (currentStep > s.id ? 'completed' : '')}`}>
            {currentStep > s.id ? <CheckCircle2 size={24} /> : s.icon}
            <span className="step-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '4rem' }}>
        {error && (
          <div className="animate-in" style={{ marginBottom: '2.5rem', background: '#FEF2F2', border: '1px solid #FEE2E2', padding: '1.25rem', borderRadius: 'var(--radius-md)', color: '#991B1B', display: 'flex', gap: '1rem', alignItems: 'center', fontWeight: 500 }}>
            <AlertCircle size={24} /> {error}
          </div>
        )}

        {/* PASO 1 */}
        {currentStep === 1 && (
          <section className="animate-in">
            <div className="card" style={{ padding: '2rem', background: 'var(--accent-soft)', border: 'none', marginBottom: '2.5rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', justifyContent: 'center' }}>
              <div className="flex items-center gap-3">
                <Calendar size={24} color="var(--primary)" />
                <label className="form-label" style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>¿Para qué año solicita el ingreso? *</label>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {[new Date().getFullYear(), new Date().getFullYear() + 1].map(anio => (
                  <label key={anio} className={`btn ${data.ficha.ciclo_lectivo == anio ? 'btn-primary' : 'btn-outline'}`} style={{ cursor: 'pointer', padding: '0.75rem 2rem' }}>
                    <input 
                      type="radio" 
                      name="ciclo_lectivo" 
                      value={anio} 
                      checked={data.ficha.ciclo_lectivo == anio}
                      onChange={handleFichaChange}
                      style={{ display: 'none' }}
                    />
                    Ciclo {anio}
                  </label>
                ))}
              </div>
            </div>

            <h3 className="section-title">Datos Personales del Alumno</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              <div className="form-group"><label className="form-label">Apellido(s) *</label><input className={getFieldClass('apellido')} name="apellido" value={data.ficha.apellido} onChange={handleFichaChange} placeholder="Escriba los apellidos..." /></div>
              <div className="form-group"><label className="form-label">Nombre(s) *</label><input className={getFieldClass('nombre')} name="nombre" value={data.ficha.nombre} onChange={handleFichaChange} placeholder="Escriba los nombres..." /></div>
              <div className="form-group">
                <label className="form-label">Tipo Documento</label>
                <select className="form-select" name="dni_tipo" value={data.ficha.dni_tipo} onChange={handleFichaChange}>
                  <option value="DNI">DNI</option><option value="Pasaporte">Pasaporte</option><option value="Cédula">Cédula</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Número Documento *</label><input className={getFieldClass('dni_nro')} name="dni_nro" placeholder="Sin puntos ni espacios (Ej: 40123456)" value={data.ficha.dni_nro} onChange={handleFichaChange} /></div>
              
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
              <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Dirección (Calle y Altura)</label><input className="form-input" name="direccion" value={data.ficha.direccion} onChange={handleFichaChange} placeholder="Ej: Av. San Martín 1234" /></div>
              
              <div className="form-group">
                <label className="form-label">Localidad/Ciudad</label>
                <input className="form-input" list="localidades-list" name="localidad" value={data.ficha.localidad} onChange={handleFichaChange} placeholder="Buscar o escribir localidad..." />
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
              <div className="form-group">
                <label className="form-label">Grado/Año *</label>
                <select 
                  className={getSelectClass('grado_anio')} 
                  name="grado_anio" 
                  value={data.ficha.grado_anio} 
                  onChange={handleFichaChange}
                  disabled={!data.ficha.nivel_ingreso}
                >
                  <option value="">{data.ficha.nivel_ingreso ? 'Seleccione opción...' : 'Primero elija un nivel'}</option>
                  {data.ficha.nivel_ingreso && GRADOS_POR_NIVEL[data.ficha.nivel_ingreso]?.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                  <label className="form-label" style={{marginBottom: '1rem'}}>¿Es repitente de este grado/año?</label>
                  <div className="flex gap-6" style={{paddingTop: '0.5rem'}}>
                      <label className="flex items-center gap-2 cursor-pointer font-medium"><input type="radio" checked={data.ficha.repitente} onChange={() => setData({...data, ficha: {...data.ficha, repitente: true}})} style={{width:'1.2rem', height:'1.2rem'}} /> Sí</label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium"><input type="radio" checked={!data.ficha.repitente} onChange={() => setData({...data, ficha: {...data.ficha, repitente: false}})} style={{width:'1.2rem', height:'1.2rem'}} /> No</label>
                  </div>
              </div>
            </div>
          </section>
        )}

        {/* PASO 2 */}
        {currentStep === 2 && (
          <section className="animate-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="section-title" style={{marginBottom: 0}}>Escolaridad Previa</h3>
              <button 
                className="btn btn-outline btn-sm" 
                onClick={() => addToArray('escolaridad', { nivel: '', anio_cursado: '', escuela: '', observaciones: '' })}
                style={{ fontSize: '0.8125rem' }}
              >
                <Plus size={16} /> Agregar Otra Institución
              </button>
            </div>
            <p className="mb-8" style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Complete las instituciones y años correspondientes a la escolaridad del alumno hasta el grado/año de ingreso seleccionado. <br/>
              <strong>Esto nos ayuda a conocer su trayectoria pedagógica.</strong>
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.escolaridad.map((e, idx) => {
                const targetGradeIndex = ORDEN_ESCOLARIDAD.indexOf(data.ficha.grado_anio);
                const currentGradeIndex = ORDEN_ESCOLARIDAD.indexOf(e.nivel);
                
                // Si es un grado estándar pero está después del grado de ingreso, no lo mostramos
                if (currentGradeIndex !== -1 && targetGradeIndex !== -1 && currentGradeIndex > targetGradeIndex) {
                  return null;
                }

                const isFixed = ORDEN_ESCOLARIDAD.includes(e.nivel);

                return (
                  <div key={idx} className="card animate-in" style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderLeft: isFixed ? '4px solid var(--primary)' : '4px solid var(--accent)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 40px', gap: '1.5rem', alignItems: 'center' }}>
                      <div>
                        <label className="form-label" style={{fontSize: '0.75rem', marginBottom: '0.25rem'}}>Nivel / Grado</label>
                        {isFixed ? (
                          <div style={{ fontWeight: 700, color: 'var(--primary)', padding: '0.5rem 0' }}>{e.nivel}</div>
                        ) : (
                          <input 
                            className="form-input" 
                            placeholder="Ej: Otros estudios" 
                            value={e.nivel} 
                            onChange={v => updateArray('escolaridad', idx, 'nivel', v.target.value)} 
                          />
                        )}
                      </div>
                      <div>
                        <label className="form-label" style={{fontSize: '0.75rem', marginBottom: '0.25rem'}}>Institución / Escuela</label>
                        <input 
                          className="form-input" 
                          placeholder="Nombre de la escuela" 
                          value={e.escuela} 
                          onChange={v => updateArray('escolaridad', idx, 'escuela', v.target.value)} 
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{fontSize: '0.75rem', marginBottom: '0.25rem'}}>Año cursado</label>
                        <input 
                          className="form-input" 
                          placeholder="Ej: 2023" 
                          value={e.anio_cursado} 
                          onChange={v => updateArray('escolaridad', idx, 'anio_cursado', v.target.value)} 
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {!isFixed && (
                          <button onClick={() => removeFromArray('escolaridad', idx)} className="btn btn-ghost" style={{color:'var(--error)', padding: '0.5rem'}}><Trash2 size={18} /></button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {data.escolaridad.length === 0 && (
              <div className="card" style={{textAlign:'center', padding:'3rem', color: 'var(--text-muted)', background: '#F8FAFC', border: '2px dashed var(--border-color)' }}>
                No se ha cargado escolaridad previa. Si el alumno inicia su escolaridad aquí, puede continuar.
              </div>
            )}
          </section>
        )}

        {/* PASO 3 */}
        {currentStep === 3 && (
          <section className="animate-in">
            <h3 className="section-title">Salud y Actividades</h3>
            <div className="form-group">
              <label className="form-label">Información Médica Relevante</label>
              <textarea className="form-textarea" name="salud_detalles" placeholder="Indique alergias, enfermedades crónicas, medicamentos o atenciones especiales..." value={data.ficha.salud_detalles} onChange={handleFichaChange} rows={4} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div className="form-group"><label className="form-label">Obra Social / Prepaga</label><input className="form-input" name="obra_social" value={data.ficha.obra_social} onChange={handleFichaChange} placeholder="Nombre de la cobertura..." /></div>
              <div className="form-group">
                 <label className="form-label">¿Posee CUD (Discapacidad)?</label>
                 <div className="flex gap-6" style={{paddingTop: '0.75rem'}}>
                    <label className="flex items-center gap-2 cursor-pointer font-medium"><input type="radio" checked={data.ficha.tiene_cud} onChange={() => setData({...data, ficha: {...data.ficha, tiene_cud: true}})} style={{width:'1.2rem', height:'1.2rem'}} /> Sí</label>
                    <label className="flex items-center gap-2 cursor-pointer font-medium"><input type="radio" checked={!data.ficha.tiene_cud} onChange={() => setData({...data, ficha: {...data.ficha, tiene_cud: false}})} style={{width:'1.2rem', height:'1.2rem'}} /> No</label>
                 </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
              <div className="form-group">
                 <label className="form-label">¿Posee el alumno/a alguna discapacidad?</label>
                 <div className="flex gap-6" style={{paddingTop: '0.75rem'}}>
                    <label className="flex items-center gap-2 cursor-pointer font-medium"><input type="radio" checked={data.ficha.posee_discapacidad} onChange={() => setData({...data, ficha: {...data.ficha, posee_discapacidad: true}})} style={{width:'1.2rem', height:'1.2rem'}} /> Sí</label>
                    <label className="flex items-center gap-2 cursor-pointer font-medium"><input type="radio" checked={!data.ficha.posee_discapacidad} onChange={() => setData({...data, ficha: {...data.ficha, posee_discapacidad: false}})} style={{width:'1.2rem', height:'1.2rem'}} /> No</label>
                 </div>
              </div>
              {data.ficha.posee_discapacidad && (
                <div className="form-group animate-in">
                  <label className="form-label">Especifique cuál/es *</label>
                  <input className={getFieldClass('discapacidad')} name="discapacidad" placeholder="Detalle la discapacidad..." value={data.ficha.discapacidad} onChange={handleFichaChange} />
                </div>
              )}
            </div>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Intereses y Actividades Extracurriculares</label>
              <textarea className="form-textarea" name="otras_actividades" placeholder="¿Realiza deportes, arte, música o idiomas fuera del horario escolar?" value={data.ficha.otras_actividades} onChange={handleFichaChange} rows={3} />
            </div>
            <div className="form-group">
              <label className="form-label">¿Cómo conocieron la Escuela La Cecilia?</label>
              <input className="form-input" name="motivo_eleccion" placeholder="Recomendación, redes sociales, cercanía..." value={data.ficha.motivo_eleccion} onChange={handleFichaChange} />
            </div>
          </section>
        )}

        {/* PASO 4 */}
        {currentStep === 4 && (
          <section className="animate-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="section-title" style={{marginBottom:0}}>Responsables / Tutores</h3>
              <button className="btn btn-outline btn-sm" onClick={() => addToArray('padres', { rol: '', rol_otro: '', apellido: '', nombre: '', dni_nro: '', dni_tipo: 'DNI', estado_civil: '', fecha_nac: '', lugar_nac_datos: '', domicilio_datos: '', telefono_casa: '', celular: '', email: '', profesion_ocupacion: '', empresa_laboral: '', telefono_laboral: '', horarios_laborales: '', whatsapp_contacto: false })}>
                <Plus size={16} /> Agregar Responsable
              </button>
            </div>
            
            {data.padres.map((p, idx) => (
              <div key={idx} className="card" style={{ padding: '2rem', marginBottom: '2rem', borderLeft: '6px solid var(--primary)', borderRadius: 'var(--radius-md)' }}>
                <div className="flex justify-between items-center mb-6">
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                     <div style={{ background: 'var(--primary)', color: 'white', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{idx + 1}</div>
                     <h4 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{p.rol === 'Otro' ? p.rol_otro : (p.rol || `Responsable`)}</h4>
                   </div>
                   {data.padres.length > 1 && <button onClick={() => removeFromArray('padres', idx)} className="btn btn-ghost" style={{color:'var(--error)'}}><Trash2 size={20} /></button>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                   <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Vínculo / Relación con el alumno *</label>
                      <div className="flex gap-4">
                        <select className={getSelectClass('rol', idx)} style={{ flex: 1 }} value={p.rol} onChange={v => updateArray('padres', idx, 'rol', v.target.value)}>
                          <option value="">Seleccionar vínculo...</option>
                          <option value="Madre">Madre</option>
                          <option value="Padre">Padre</option>
                          <option value="Tutor/a">Tutor/a</option>
                          <option value="Otro">Otro</option>
                        </select>
                        {p.rol === 'Otro' && (
                          <input className={getFieldClass('rol_otro', idx)} style={{ flex: 1 }} placeholder="Especifique el vínculo..." value={p.rol_otro} onChange={v => updateArray('padres', idx, 'rol_otro', v.target.value)} />
                        )}
                      </div>
                   </div>
                   <div className="form-group"><label className="form-label">Apellidos *</label><input className={getFieldClass('apellido', idx)} value={p.apellido} onChange={v => updateArray('padres', idx, 'apellido', v.target.value)} /></div>
                   <div className="form-group"><label className="form-label">Nombres *</label><input className={getFieldClass('nombre', idx)} value={p.nombre} onChange={v => updateArray('padres', idx, 'nombre', v.target.value)} /></div>
                   <div className="form-group"><label className="form-label">DNI *</label><input className={getFieldClass('dni_nro', idx)} placeholder="Sin puntos" value={p.dni_nro} onChange={v => updateArray('padres', idx, 'dni_nro', v.target.value)} /></div>
                   <div className="form-group"><label className="form-label">Celular / Teléfono *</label><input className={getFieldClass('celular', idx)} placeholder="Ej: 342 1234567" value={p.celular} onChange={v => updateArray('padres', idx, 'celular', v.target.value)} /></div>
                   <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Domicilio Completo *</label><input className={getFieldClass('domicilio_datos', idx)} placeholder="Calle, Nro, Piso, Localidad..." value={p.domicilio_datos} onChange={v => updateArray('padres', idx, 'domicilio_datos', v.target.value)} /></div>
                   <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Email</label><input className="form-input" type="email" placeholder="ejemplo@correo.com" value={p.email} onChange={v => updateArray('padres', idx, 'email', v.target.value)} /></div>
                </div>
              </div>
            ))}

            <div className="card" style={{ padding: '2.5rem', background: 'white', border: '2px dashed var(--accent)', boxShadow: 'none' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div style={{ background: 'var(--accent-soft)', padding: '0.75rem', borderRadius: '12px' }}>
                    <HelpCircle size={24} color="var(--accent)" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800 }}>Preferencia de Contacto para Entrevista</h4>
                    <p style={{fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem'}}>A esta persona contactaremos para coordinar la cita.</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                   <div className="form-group">
                      <label className="form-label">Nombre de Contacto *</label>
                      <input className={getFieldClass('contacto_entrevista_nombre')} name="contacto_entrevista_nombre" placeholder="Nombre de la persona a contactar" value={data.ficha.contacto_entrevista_nombre} onChange={handleFichaChange} />
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
                      <input className={getFieldClass('contacto_entrevista_dato')} name="contacto_entrevista_dato" placeholder="Ej: +54 9 342 123456 o nombre@correo.com" value={data.ficha.contacto_entrevista_dato} onChange={handleFichaChange} />
                   </div>
                </div>
            </div>
          </section>
        )}

        {/* PASO 5 */}
        {currentStep === 5 && (
          <section className="animate-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="section-title" style={{marginBottom: 0}}>Composición Familiar</h3>
              <button 
                className="btn btn-outline btn-sm" 
                onClick={() => addToArray('hermanos', { vinculo: '', vinculo_otro: '', nombre_apellido: '', dni_nro: '', fecha_nac: '', estudios_escuela: '' })}
              >
                <Plus size={16} /> Agregar Familiar
              </button>
            </div>
            <p className="mb-6" style={{fontSize: '0.9375rem', color: 'var(--text-muted)' }}>Cargue los datos de todas las personas que viven con el alumno/a (Hermanos/as, abuelos, tíos, parejas, etc.).</p>
            
            <div className="admin-table-container mb-10" style={{boxShadow: 'none', borderStyle: 'dashed'}}>
              <table className="admin-table">
                <thead>
                  <tr style={{background: 'var(--bg-main)'}}>
                    <th>Vínculo</th>
                    <th>Nombre y Apellido</th>
                    <th>Fecha Nac.</th>
                    <th>Institución / Escuela (Hermanos)</th>
                    <th style={{textAlign: 'center'}}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {data.hermanos.map((h, idx) => (
                    <tr key={idx} className="animate-in" style={{animationDelay: `${idx * 0.1}s`}}>
                      <td>
                        <select className="form-select" style={{border:'none', background:'transparent', padding: '0.5rem', width: '100%'}} value={h.vinculo} onChange={v => updateArray('hermanos', idx, 'vinculo', v.target.value)}>
                          <option value="">Seleccionar...</option>
                          <option value="Hermano/a">Hermano/a</option>
                          <option value="Abuelo/a">Abuelo/a</option>
                          <option value="Tio/a">Tío/a</option>
                          <option value="Pareja de madre o padre">Pareja de madre o padre</option>
                          <option value="Otro">Otro</option>
                        </select>
                        {h.vinculo === 'Otro' && (
                          <input className="form-input" style={{padding: '0.25rem 0.5rem', marginTop: '0.25rem', fontSize: '0.8rem'}} placeholder="¿Cuál?" value={h.vinculo_otro} onChange={v => updateArray('hermanos', idx, 'vinculo_otro', v.target.value)} />
                        )}
                      </td>
                      <td><input className="form-input" style={{border:'none', background:'transparent', padding: '0.5rem'}} placeholder="Nombre completo" value={h.nombre_apellido} onChange={v => updateArray('hermanos', idx, 'nombre_apellido', v.target.value)} /></td>
                      <td><input type="date" className="form-input" style={{border:'none', background:'transparent', padding: '0.5rem'}} value={h.fecha_nac} onChange={v => updateArray('hermanos', idx, 'fecha_nac', v.target.value)} /></td>
                      <td>
                        <input 
                          className="form-input" 
                          style={{border:'none', background:'transparent', padding: '0.5rem', opacity: h.vinculo === 'Hermano/a' ? 1 : 0.4}} 
                          placeholder={h.vinculo === 'Hermano/a' ? "Escuela a la que asiste" : "-"} 
                          disabled={h.vinculo !== 'Hermano/a'}
                          value={h.estudios_escuela} 
                          onChange={v => updateArray('hermanos', idx, 'estudios_escuela', v.target.value)} 
                        />
                      </td>
                      <td style={{textAlign: 'center'}}><button onClick={() => removeFromArray('hermanos', idx)} className="btn btn-ghost" style={{color:'var(--error)', padding: '0.5rem'}}><Trash2 size={18} /></button></td>
                    </tr>
                  ))}
                  {data.hermanos.length === 0 && <tr><td colSpan={5} style={{textAlign:'center', padding:'2.5rem', color: 'var(--text-muted)', fontSize: '0.875rem'}}>No se registraron familiares.</td></tr>}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginTop: '3rem' }}>
                <div className="form-group">
                    <label className="form-label" style={{fontSize: '1rem'}}>Situación Socioeconómica</label>
                    <select className={getSelectClass('situacion_socioeconomica')} name="situacion_socioeconomica" value={data.ficha.situacion_socioeconomica} onChange={handleFichaChange}>
                        <option value="">Seleccionar...</option>
                        <option value="Muy buena">Muy buena</option>
                        <option value="Buena">Buena</option>
                        <option value="Regular">Regular</option>
                        <option value="Mala">Mala</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label" style={{fontSize: '1rem'}}>Observaciones Adicionales</label>
                    <textarea className="form-textarea" name="otros_datos" placeholder="Indique cualquier otra información, contexto familiar o situación que considere importante compartir con la escuela..." value={data.ficha.otros_datos} onChange={handleFichaChange} rows={3} />
                </div>
            </div>
          </section>
        )}

        {/* PASO 6 */}
        {currentStep === 6 && (
          <section className="animate-in">
            <h3 className="section-title">Acuerdo y Envío</h3>
            <div className="card" style={{ padding: '2.5rem', maxHeight: '500px', overflowY: 'auto', background: '#F8FAFC', fontSize: '0.9375rem', lineHeight: '1.8', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'none', color: '#334155' }}>
              <h4 style={{ textAlign: 'center', marginBottom: '2.5rem', color: 'var(--primary)', fontSize: '1.25rem', fontWeight: 800 }}>ACUERDO DE ADMISIÓN Y PERMANENCIA</h4>
              
              <p className="mb-4">Las familias, alumnos y alumnas pueden informarse sobre la filosofía y los fundamentos de la Escuela, así como conocer las condiciones generales que se expresan en documentos tales como “Propósitos de la Escuela”, “Principios de la Escuela”, “Manual de Bienvenida” y “Manual de Procedimientos”, de modo que exista una elección consciente al momento de solicitar la inscripción, contando siempre con la posibilidad de efectuar las consultas que consideren necesarias.</p>
              
              <p className="mb-4">No se considera que exista un alumno o alumna fuera y otro u otra dentro de la Escuela, por lo cual se espera una conducta coherente del alumnado con los principios de la misma, en cualquier ámbito en que se encuentren.</p>
              
              <p className="mb-4">La Escuela tiene la intención de crear las condiciones para que los niños, niñas y jóvenes que asisten a ella puedan desarrollarse en libertad, lo cual requiere comprender la trama del condicionamiento genético, cultural y psicológico que determina nuestras acciones. No hay libertad mientras los pensamientos, emociones y acciones están dictados por las modas, las presiones sociales, las ideologías, los dogmas de cualquier tipo, nuestras huellas psicológicas, todo lo cual constituye nuestro “yo”. La libertad -entendida como libertad de la actividad egocéntrica- nos permite ser personas atentas y reflexivas, lo que posibilita una amistosa convivencia, un armonioso desarrollo en sociedad y una vida libre de conflicto interno. Es en estos principios que se basa el núcleo de nuestros propósitos educativos y al cual se remiten las siguientes condiciones que los alumnos, alumnas y familias deben comprender y aceptar para su ingreso y permanencia en la escuela.</p>

              <h5 style={{marginTop: '2rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', fontSize: '1rem'}}>ADMISIÓN</h5>
              <p className="mb-4">La Escuela “La Cecilia” es un proyecto que propone una educación en libertad. En tal sentido, el ingreso implica conocer y acordar con sus principios. Será necesario para la admisión que potenciales ingresantes y sus familias muestren interés en los fundamentos de la Escuela y acepten estas condiciones.</p>
              <p className="mb-4">Siendo un proyecto educativo que requiere un marco de aceptación y coherencia en la vida familiar, se pretende que todos los hermanos o hermanas en edad escolar asistan a esta escuela, salvo circunstancias particulares que se analizarán en cada caso.</p>

              <h5 style={{marginTop: '2rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', fontSize: '1rem'}}>BUEN TRATO</h5>
              <p className="mb-4">No se permitirá ningún tipo de trato violento, físico ni verbal, como burlas, discriminación, bullying, etc. tanto dentro como fuera de la Escuela. Estas conductas serán informadas y conversadas con las familias y se exigirán seguimientos en cada caso.</p>

              <h5 style={{marginTop: '2rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', fontSize: '1rem'}}>EXPECTATIVAS ACADÉMICAS</h5>
              <p className="mb-4">Las familias, alumnos y alumnas deben comprender y aceptar que no resulta lógico ni posible que todos lleguen a los mismos resultados en sus aprendizajes académicos, ya que ello dependerá de sus intereses y capacidades.</p>
              <p className="mb-4">El propósito educativo de la Escuela es colaborar para que cada alumno o alumna pueda conocerse a sí mismo, conocer sus intereses y capacidades y desarrollarlos de la mejor manera, para poder hacer de ellos un medio de vida dentro de un proyecto vital con sentido social. Para los propósitos enunciados se les brindarán las opciones académicas correspondientes y el apoyo necesario. Los alumnos y alumnas podrán elegir las actividades que realizan y proponer otras que no se estén realizando. En todos los casos la tutoría de la Escuela, junto a educadores, hará un seguimiento de cada alumno o alumna, para lo cual se llevará un registro detallado de las actividades.</p>

              <h5 style={{marginTop: '2rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', fontSize: '1rem'}}>MODO DE VIDA - ALIMENTACIÓN</h5>
              <p className="mb-4">La Escuela propone un modo de vida que contribuya a la salud física y psicológica. Se propone una dieta vegetariana y natural que excluye las carnes de todo tipo y sus derivados, bebidas alcohólicas, gaseosas y golosinas, así como otros alimentos con exceso de dulces o de sal. Tanto en el predio de la Escuela como durante salidas, reuniones, actividades escolares o cualquier otra actividad donde participen grupalmente los alumnos y alumnas se respetará la alimentación vegetariana y los hábitos propuestos. El cumplimiento de esta dieta no es de exigencia en el hogar, pero se solicita a las familias que colaboren para que sus hijos o hijas adopten conscientemente una forma de vida que contribuya a cuidar su salud. En el mismo sentido, no se deben ingresar a la escuela alimentos que no respondan a las pautas de cuidado de la salud que se recomiendan.</p>

              <h5 style={{marginTop: '2rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', fontSize: '1rem'}}>CIGARRILLO, ALCOHOL, DROGAS</h5>
              <p className="mb-4">Se consideran dañinos para la salud el tabaco, alcohol u otras drogas, por lo cual alumnos y alumnas deben comprometerse a no consumirlos en ningún momento, dentro o fuera de la escuela. Se solicita a las familias que colaboren para que sus hijos o hijas no se conviertan en consumidores de estos elementos perjudiciales para la salud y generadores de tantos trastornos sociales.</p>

              <h5 style={{marginTop: '2rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', fontSize: '1rem'}}>ACCESORIOS</h5>
              <p className="mb-4">Hay jóvenes que suelen utilizar accesorios (algunos tipos de piercings, muñequeras, cadenas, expansores, etc.) que implican un riesgo para la seguridad y salud propia y de sus compañeros o compañeras, pero además son representativos de condicionamientos sobre los que la Escuela está fuertemente interesada en trabajar. Por lo tanto, los alumnos y alumnas convendrán no usar accesorios que no sean consensuados con la escuela y la familia, dentro ni fuera de ella. No obstante, se podrán revisar estas restricciones en todo momento a través de los mecanismos orgánicos colectivos disponibles, tales como las Asambleas.</p>

              <h5 style={{marginTop: '2rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', fontSize: '1rem'}}>BOLICHES, VIDA NOCTURNA</h5>
              <p className="mb-4">Los alumnos y alumnas de la Escuela se comprometerán a no asistir a pubs, boliches o lugares similares, ya que no son ambientes convenientes para adolescentes, ni son acordes a la forma de vida propuesta.</p>

              <h5 style={{marginTop: '2rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', fontSize: '1rem'}}>HORARIO Y ASISTENCIA</h5>
              <p className="mb-4">La Escuela considera imprescindible que alumnos y alumnas participen con regularidad y puntualidad a las actividades de la vida escolar. Se evitarán las inasistencias reiteradas y las reincorporaciones que deban gestionarse -con motivo de alcanzar la cantidad de faltas permitidas por el reglamento- se autorizarán solamente en caso de que estén debidamente justificadas por enfermedad u otras circunstancias graves que las ameriten.</p>

              <h5 style={{marginTop: '2rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', fontSize: '1rem'}}>SANCIONES</h5>
              <p className="mb-4">No se utiliza un sistema de premios ni castigos, por lo cual tampoco hay sanciones para regular los comportamientos y la vida de la Escuela. Esto requiere que alumnos y alumnas sepan auto-gestionar su conducta dentro de los canales existentes y respetando los propósitos y fundamentos expuestos.</p>
              <p className="mb-4">Dado que la firma de los presentes compromisos determina la posibilidad del ingreso, la falta de cumplimiento de estos acuerdos significará que el alumno o la alumna deberá dejar la Escuela de inmediato, en cualquier momento del año o no acceder a la reinscripción para el año siguiente.</p>

              <h5 style={{marginTop: '2rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', fontSize: '1rem'}}>CUMPLIMIENTO COMPROMISO ECONÓMICO</h5>
              <p className="mb-4">Las familias se comprometen a abonar en tiempo y forma las cuotas. De existir algún inconveniente para el pago de las mismas, esto se comunicará inmediatamente a la Escuela, a fin de encontrar alguna alternativa para hacer frente a la situación. Si existiese una deuda de dos cuotas vencidas y no se acordase una forma de cumplimiento, la familia se compromete a pedir el pase y dejar la escuela en el momento en que se le solicite. Las cuotas pagadas fuera de término conllevarán un recargo. No se reinscribirán alumnos ni alumnas que mantengan deuda con la Escuela al comienzo del ciclo lectivo.</p>

              <h5 style={{marginTop: '2rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', fontSize: '1rem'}}>CUOTAS</h5>
              <p className="mb-4">Se abonan 12 cuotas al año, 2 de las cuales corresponden a matrícula (que deben estar pagas antes del finalizar el año previo al ciclo lectivo en que se inscribe el alumno) y luego 10 cuotas consecutivas, de marzo a diciembre del ciclo en que se inscribe. Las cuotas se ajustan periódicamente en forma proporcional a los aumentos en los salarios docentes y sus valores pueden consultarse en la página de la Escuela.</p>
              
              <p style={{marginTop: '2.5rem', fontStyle: 'italic', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>Este documento tiene carácter de declaración jurada.</p>
            </div>
            
            <label className="flex items-center gap-4 mt-10" style={{ background: 'rgba(252, 163, 17, 0.05)', padding: '1.5rem 2rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', border: '2px solid rgba(252, 163, 17, 0.2)', transition: 'all 0.3s' }}>
              <input 
                type="checkbox" 
                style={{ width: '24px', height: '24px', cursor: 'pointer' }} 
                checked={terminosAceptados} 
                onChange={e => setTerminosAceptados(e.target.checked)} 
              />
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', lineHeight: '1.4' }}>
                Entiendo y acepto las condiciones expresadas en el acuerdo de admisión y declaro la veracidad de todos los datos informados en esta ficha.
              </span>
            </label>
          </section>
        )}

        <div className="flex justify-between mt-12 pt-8" style={{ borderTop: '1px solid var(--border-color)' }}>
          {currentStep > 1 ? (
            <button className="btn btn-outline" onClick={prevStep}>
              <ArrowLeft size={18} /> Anterior
            </button>
          ) : <div></div>}
          
          <div style={{ marginLeft: 'auto' }}>
            {currentStep < STEPS.length ? (
              <button className="btn btn-primary" onClick={nextStep} style={{ padding: '0.875rem 2.5rem' }}>
                Siguiente Pasos <ChevronRight size={18} />
              </button>
            ) : (
              <button className="btn btn-accent" onClick={handleSubmit} disabled={loading || !terminosAceptados} style={{ padding: '1rem 3rem', fontSize: '1.1rem', animation: terminosAceptados ? 'pulse-soft 2s infinite' : 'none' }}>
                {loading ? 'Procesando Envío...' : 'Finalizar y Enviar Solicitud'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormularioIngreso;
