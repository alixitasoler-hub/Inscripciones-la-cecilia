DROP TABLE IF EXISTS entrevistas;
DROP TABLE IF EXISTS hermanos;
DROP TABLE IF EXISTS convivientes;
DROP TABLE IF EXISTS padres_tutores;
DROP TABLE IF EXISTS escolaridad;
DROP TABLE IF EXISTS fichas;
DROP TABLE IF EXISTS configuracion;

CREATE TABLE configuracion (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

INSERT INTO configuracion (clave, valor) VALUES ('inscripciones_abiertas', '1');
INSERT INTO configuracion (clave, valor) VALUES ('mensaje_cerrado', 'El período de solicitudes de ingreso se encuentra cerrado.');
INSERT INTO configuracion (clave, valor) VALUES ('email_notificacion', 'laceciliasecretaria@gmail.com');

CREATE TABLE fichas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  estado TEXT DEFAULT 'pendiente', -- pendiente, contactado, entrevista_programada, finalizado, cancelado
  -- Ciclo Lectivo y Alumno
  ciclo_lectivo TEXT,
  fecha_solicitud TEXT DEFAULT CURRENT_TIMESTAMP,
  apellido TEXT NOT NULL,
  nombre TEXT NOT NULL,
  dni_tipo TEXT,
  dni_nro TEXT UNIQUE NOT NULL,
  sexo TEXT,
  fecha_nac TEXT,
  lugar_nac TEXT,
  -- Domicilio Alumno
  direccion TEXT,
  localidad TEXT,
  provincia TEXT,
  pais TEXT,
  cp TEXT,
  telefono_alumno TEXT,
  email_alumno TEXT,
  -- Inscripción
  nivel_ingreso TEXT, -- Inicial, EPO, ESO
  grado_anio TEXT,
  repitente INTEGER DEFAULT 0, -- 0: No, 1: Si
  -- Salud
  salud_detalles TEXT, -- Enfermedades, alergias, accidentes
  embarazo_parto TEXT,
  discapacidad TEXT, -- SI/NO + detalles
  tiene_cud INTEGER DEFAULT 0,
  obra_social TEXT,
  -- Antecedentes
  otras_actividades TEXT,
  problemas_aprendizaje TEXT,
  motivo_eleccion TEXT,
  -- Situación Socioeconómica (Muy buena, Buena, Regular, Mala)
  situacion_socioeconomica TEXT,
  observaciones_nivel TEXT,
  otros_datos TEXT,
  contacto_entrevista_nombre TEXT,
  contacto_entrevista_medio TEXT,
  contacto_entrevista_dato TEXT,
  observaciones_generales TEXT,
  modificado_admin INTEGER DEFAULT 0,
  decision_final TEXT, -- 'ingresa', 'no_ingresa', 'espera'
  motivo_finalizacion TEXT -- Desistieron, Rechazamos, No contestan, etc.
);

CREATE TABLE escolaridad (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ficha_id INTEGER NOT NULL,
  nivel TEXT, -- Jardin, Preescolar, Primaria, Secundaria
  anio_cursado TEXT,
  escuela TEXT,
  observaciones TEXT,
  FOREIGN KEY (ficha_id) REFERENCES fichas(id) ON DELETE CASCADE
);

CREATE TABLE padres_tutores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ficha_id INTEGER NOT NULL,
  rol TEXT, -- Padre, Madre, Tutor
  apellido TEXT,
  nombre TEXT,
  dni_nro TEXT,
  estado_civil TEXT,
  fecha_nac TEXT,
  lugar_nac_datos TEXT, -- Localidad, Provincia, Pais
  direccion TEXT,
  localidad TEXT,
  provincia TEXT,
  pais TEXT,
  cp TEXT,
  telefono_casa TEXT,
  celular TEXT,
  whatsapp_contacto INTEGER DEFAULT 0, -- 1 si este es el nro para contacto
  email TEXT,
  profesion_ocupacion TEXT,
  empresa_laboral TEXT,
  telefono_laboral TEXT,
  horarios_laborales TEXT,
  FOREIGN KEY (ficha_id) REFERENCES fichas(id) ON DELETE CASCADE
);

CREATE TABLE hermanos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ficha_id INTEGER NOT NULL,
  vinculo TEXT, -- hermano/a, abuelo/a, tio/a, pareja de madre o padre, otro
  nombre_apellido TEXT,
  dni_nro TEXT,
  fecha_nac TEXT,
  estado_civil TEXT,
  estudios_escuela TEXT,
  domicilio_ocupacion TEXT,
  ocupacion TEXT,
  FOREIGN KEY (ficha_id) REFERENCES fichas(id) ON DELETE CASCADE
);

CREATE TABLE convivientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ficha_id INTEGER NOT NULL,
  nombre_apellido TEXT,
  vinculo TEXT,
  edad INTEGER,
  observaciones TEXT,
  FOREIGN KEY (ficha_id) REFERENCES fichas(id) ON DELETE CASCADE
);

CREATE TABLE entrevistas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ficha_id INTEGER NOT NULL,
  fecha_hora TEXT NOT NULL,
  estado TEXT DEFAULT 'programada', -- programada, realizada, cancelada, movida
  notas TEXT,
  respuesta TEXT, -- Respuesta de la familia (confirmado, pide cambio, etc)
  FOREIGN KEY (ficha_id) REFERENCES fichas(id) ON DELETE CASCADE
);
