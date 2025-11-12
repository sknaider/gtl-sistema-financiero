import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './modules/dashboard/Dashboard';
import Empresas from './modules/empresas/Empresas';
import Ingresos from './modules/ingresos/Ingresos';
import Costos from './modules/costos/Costos';
import Utilidades from './modules/utilidades/Utilidades';
import Pagos from './modules/pagos/Pagos';
import Graficos from './modules/graficos/Graficos';

function App() {
  // ✅ MODO LIBRE: Acceso directo sin autenticación
  return (
    <Router basename="/sistema">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/empresas" element={<Empresas />} />
        <Route path="/ingresos" element={<Ingresos />} />
        <Route path="/costos" element={<Costos />} />
        <Route path="/utilidades" element={<Utilidades />} />
        <Route path="/pagos" element={<Pagos />} />
        <Route path="/graficos" element={<Graficos />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
