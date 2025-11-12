import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';
import Dashboard from './modules/dashboard/Dashboard';
import IngresosPage from './modules/ingresos/IngresosPage';
import CostosPage from './modules/costos/CostosPage';
import UtilidadesPage from './modules/utilidades/UtilidadesPage';
import PagosPage from './modules/pagos/PagosPage';
import GraficosPage from './modules/graficos/GraficosPage';
import EmpresasPage from './modules/empresas/EmpresasPage';

function App() {
  return (
    <AppProvider>
      <BrowserRouter basename="/sistema">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="ingresos" element={<IngresosPage />} />
            <Route path="costos" element={<CostosPage />} />
            <Route path="utilidades" element={<UtilidadesPage />} />
            <Route path="pagos" element={<PagosPage />} />
            <Route path="graficos" element={<GraficosPage />} />
            <Route path="empresas" element={<EmpresasPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
