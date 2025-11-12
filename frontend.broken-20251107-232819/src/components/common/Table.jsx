import { ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const Table = ({ columns, data, onRowClick, className = '' }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    
    if (aVal === bVal) return 0;
    
    const comparison = aVal > bVal ? 1 : -1;
    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });
  
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                onClick={() => column.sortable && handleSort(column.key)}
                className={`
                  px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                  ${column.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''}
                `}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.label}</span>
                  {column.sortable && (
                    <span className="ml-2">
                      {sortConfig.key === column.key ? (
                        sortConfig.direction === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      ) : (
                        <ChevronUp className="h-4 w-4 text-gray-300" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-8 text-center text-sm text-gray-500"
              >
                No hay datos disponibles
              </td>
            </tr>
          ) : (
            sortedData.map((row, index) => (
              <tr
                key={row.id || index}
                onClick={() => onRowClick && onRowClick(row)}
                className={onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
