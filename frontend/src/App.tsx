import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FormularioIngreso from './components/FormularioIngreso';
import AdminPanel from './components/AdminPanel';

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta pública para inscripciones */}
        <Route path="/" element={<FormularioIngreso />} />
        
        {/* Ruta para el panel de administración */}
        <Route path="/admin/*" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;
