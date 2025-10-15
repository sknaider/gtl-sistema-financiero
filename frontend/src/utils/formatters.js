import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatCurrency = (value, currency = 'PEN') => {
  if (!value && value !== 0) return '-';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numValue);
  }
  
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(numValue);
};

export const formatDate = (date) => {
  if (!date) return '-';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'dd/MM/yyyy', { locale: es });
  } catch (error) {
    return date;
  }
};

export const formatDateForInput = (date) => {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    return '';
  }
};

export const formatNumber = (value, decimals = 2) => {
  if (!value && value !== 0) return '-';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return numValue.toLocaleString('es-PE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatPercentage = (value) => {
  if (!value && value !== 0) return '0%';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return `${numValue.toFixed(2)}%`;
};
