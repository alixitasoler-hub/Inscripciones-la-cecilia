import React, { useState } from 'react';

// Interfaz simple para las solicitudes
interface Solicitud {
  id: string;
  nombre: string;
  telefono: string;
  estado: 'pendiente' | 'entrevista' | 'aceptado';
  fecha: string;
}

const AdminPanelV3 = () => {
  const [isLogged, setIsLogged] = useState(false);
  const [password, setPassword] = useState('');
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Lógica de Login Simple
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // CAMBIA 'tu_clave_secreta' por la contraseña real que uses en tu backend
    if (password === 'admin123') { 
      setIsLogged(true);
      fetchSolicitudes();
    } else {
      alert("Contraseña incorrecta");
    }
  };

  // 2. Obtener datos del Backend (Cloudflare Workers)
  const fetchSolicitudes = async () => {
    setLoading(true);
    try {
      // Ajusta esta URL a la de tu backend real
      const res = await fetch('/api/solicitudes'); 
      const data = await res.json();
      setSolicitudes(data);
    } catch (error) {
      console.error("Error al cargar:", error);
      // Datos de prueba si falla el backend para que veas que la UI funciona
      setSolicitudes([
        { id: '1', nombre: 'María Pérez', telefono: '555-0101', estado: 'pendiente', fecha: '2026-06-01' },
        { id: '2', nombre: 'Juan López', telefono: '555-0202', estado: 'entrevista', fecha: '2026-05-30' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 3. Vista de Login
  if (!isLogged) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-lg w-96">
          <h2 className="text-2xl font-bold mb-4 text-center">Acceso La Cecilia</h2>
          <input 
            type="password" 
            placeholder="Contraseña" 
            className="w-full p-2 border rounded mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            Ingresar
          </button>
        </form>
      </div>
    );
  }

  // 4. Vista del Panel (Kanban Simple)
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Inscripciones</h1>
        <button onClick={() => setIsLogged(false)} className="text-red-600 font-semibold">
          Salir
        </button>
      </header>

      {loading ? <p>Cargando...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Columna Pendientes */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-lg mb-4 text-yellow-600">Pendientes</h3>
            {solicitudes.filter(s => s.estado === 'pendiente').map(s => (
              <div key={s.id} className="border p-3 mb-2 rounded bg-yellow-50">
                <p className="font-semibold">{s.nombre}</p>
                <p className="text-sm text-gray-600">{s.telefono}</p>
              </div>
            ))}
          </div>

          {/* Columna Entrevistas */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-lg mb-4 text-blue-600">Entrevistas</h3>
            {solicitudes.filter(s => s.estado === 'entrevista').map(s => (
              <div key={s.id} className="border p-3 mb-2 rounded bg-blue-50">
                <p className="font-semibold">{s.nombre}</p>
                <p className="text-sm text-gray-600">{s.fecha}</p>
              </div>
            ))}
          </div>

          {/* Columna Aceptados */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-lg mb-4 text-green-600">Aceptados</h3>
            {solicitudes.filter(s => s.estado === 'aceptado').map(s => (
              <div key={s.id} className="border p-3 mb-2 rounded bg-green-50">
                <p className="font-semibold">{s.nombre}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanelV3;
