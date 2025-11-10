import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './modules/dashboard/Dashboard';
import IngresosPage from './modules/ingresos/IngresosPage';
import CostosPage from './modules/costos/CostosPage';
import UtilidadesPage from './modules/utilidades/UtilidadesPage';
import PagosPage from './modules/pagos/PagosPage';
import GraficosPage from './modules/graficos/GraficosPage';
import ClientesPage from './modules/clientes/ClientesPage';
import TiposCostoPage from './modules/tipos-costo/TiposCostoPage';
import ExcelImport from './modules/excel-import/ExcelImport';
import ChatButton from './components/common/ChatButton';
import { AppProvider } from './context/AppContext';

function App() {
  return (
    <AppProvider>
      <BrowserRouter basename="/sistema">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="ingresos" element={<IngresosPage />} />
            <Route path="costos" element={<CostosPage />} />
            <Route path="tipos-costo" element={<TiposCostoPage />} />
            <Route path="utilidades" element={<UtilidadesPage />} />
            <Route path="pagos" element={<PagosPage />} />
            <Route path="graficos" element={<GraficosPage />} />
            <Route path="clientes" element={<ClientesPage />} />
            <Route path="excel-import" element={<ExcelImport />} />
          </Route>
        </Routes>
        <ChatButton />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
