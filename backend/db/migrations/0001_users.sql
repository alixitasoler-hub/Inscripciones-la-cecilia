CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  nombre TEXT,
  rol TEXT DEFAULT 'admin'
);

CREATE TABLE IF NOT EXISTS historial_cambios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  ficha_id INTEGER,
  accion TEXT NOT NULL,
  detalles TEXT,
  fecha TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

INSERT OR IGNORE INTO usuarios (usuario, password, nombre, rol) VALUES ('admin', 'admin123', 'Administrador', 'superadmin');
