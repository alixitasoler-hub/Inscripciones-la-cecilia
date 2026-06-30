-- Agregar campos de tratamiento y problemas de aprendizaje
ALTER TABLE fichas ADD COLUMN tiene_problemas_aprendizaje INTEGER DEFAULT 0;
ALTER TABLE fichas ADD COLUMN tratamiento_profesional INTEGER DEFAULT 0;
ALTER TABLE fichas ADD COLUMN tratamiento_detalles TEXT;
