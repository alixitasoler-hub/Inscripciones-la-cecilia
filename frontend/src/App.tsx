import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FormularioIngreso from './components/FormularioIngreso';
import AdminPanelV3 from './components/AdminPanelV3'; // Importamos el nuevo

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FormularioIngreso />} />
        <Route path="/admin" element={<AdminPanelV3 />} />
      </Routes>
    </Router>
  );
}

export default App;
