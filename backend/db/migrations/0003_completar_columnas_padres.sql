-- Completar columnas faltantes en la tabla padres_tutores
-- Nota: Es normal que algunas sentencias fallen si la columna ya existe.

ALTER TABLE padres_tutores ADD COLUMN localidad TEXT;
ALTER TABLE padres_tutores ADD COLUMN provincia TEXT;
ALTER TABLE padres_tutores ADD COLUMN pais TEXT;
ALTER TABLE padres_tutores ADD COLUMN cp TEXT;
ALTER TABLE padres_tutores ADD COLUMN telefono_casa TEXT;
ALTER TABLE padres_tutores ADD COLUMN celular TEXT;
ALTER TABLE padres_tutores ADD COLUMN email TEXT;
ALTER TABLE padres_tutores ADD COLUMN profesion_ocupacion TEXT;
ALTER TABLE padres_tutores ADD COLUMN empresa_laboral TEXT;
ALTER TABLE padres_tutores ADD COLUMN telefono_laboral TEXT;
ALTER TABLE padres_tutores ADD COLUMN horarios_laborales TEXT;
ALTER TABLE padres_tutores ADD COLUMN dni_tipo TEXT;
ALTER TABLE padres_tutores ADD COLUMN estado_civil TEXT;
ALTER TABLE padres_tutores ADD COLUMN fecha_nac TEXT;
ALTER TABLE padres_tutores ADD COLUMN lugar_nac_datos TEXT;
ALTER TABLE padres_tutores ADD COLUMN whatsapp_contacto INTEGER DEFAULT 0;
