import { createContext, useContext, useState } from 'react';
import { MESES } from '../utils/constants';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const mesActual = MESES[new Date().getMonth()];
  const [mesSeleccionado, setMesSeleccionado] = useState(mesActual);
  const [loading, setLoading] = useState(false);

  const value = {
    mesSeleccionado,
    setMesSeleccionado,
    loading,
    setLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
