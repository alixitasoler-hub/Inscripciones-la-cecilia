import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import FormularioIngreso from './components/FormularioIngreso';
import AdminPanel from './components/AdminPanel';

function App() {
  return (
    <Router>
      <header className="site-header no-print">
        <div className="container">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <div style={{ background: 'var(--primary)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <span style={{ color: 'white', fontWeight: 800, fontSize: '1.25rem' }}>C</span>
            </div>
            <span className="logo-text">La Cecilia</span>
          </Link>
          <nav>
            <Link to="/admin" className="btn btn-outline" style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}>
              Acceso Admin
            </Link>
          </nav>
        </div>
      </header>

      <main className="main-content">
        <div className="container">
          <Routes>
            <Route path="/" element={<FormularioIngreso />} />
            <Route path="/admin/*" element={<AdminPanel />} />
          </Routes>
        </div>
      </main>

      <footer className="no-print" style={{ padding: '2rem 0', textAlign: 'center', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
        <div className="container">
          <p>© {new Date().getFullYear()} Escuela La Cecilia - Sistema de Inscripciones Digitales</p>
        </div>
      </footer>
    </Router>
  );
}

export default App;
