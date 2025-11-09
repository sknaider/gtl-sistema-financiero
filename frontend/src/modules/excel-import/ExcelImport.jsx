import { useState } from 'react';
import api from '../../services/api';
import { Download, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ExcelImport() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editedData, setEditedData] = useState([]);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/v1/excel/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'GTL_Template_Ingresos.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error descargando template:', err);
      alert('Error descargando template');
    }
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const res = await api.post('/v1/excel/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreview(res.data);
      setEditedData(res.data.preview.map((row, idx) => ({
        ...row,
        _index: idx,
        _hasError: !row.FECHA || !row.CLIENTE || !row.MONTO || isNaN(parseFloat(row.MONTO))
      })));
      setCurrentPage(1);
    } catch (err) {
      console.error('Error en preview:', err);
      alert('Error: ' + (err.response?.data?.detail || 'Error al procesar el archivo'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index, field, value) => {
    const updated = [...editedData];
    const rowIdx = updated.findIndex(r => r._index === index);
    updated[rowIdx][field] = value;
    
    const row = updated[rowIdx];
    const hasError = !row.FECHA || !row.CLIENTE || !row.MONTO || isNaN(parseFloat(row.MONTO));
    updated[rowIdx]._hasError = hasError;
    
    setEditedData(updated);
  };

  const handleConfirm = async () => {
    const cleanData = editedData.map(({ _index, _hasError, ...rest }) => rest);
    try {
      await api.post('/v1/excel/confirm', { registros: cleanData });
      alert('✅ Datos importados correctamente');
      setPreview(null);
      setFile(null);
      setEditedData([]);
    } catch (err) {
      console.error('Error confirmando import:', err);
      alert('Error: ' + (err.response?.data?.detail || 'Error al importar los datos'));
    }
  };

  const filteredData = showOnlyErrors 
    ? editedData.filter(row => row._hasError)
    : editedData;

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const displayData = filteredData.slice(startIdx, startIdx + rowsPerPage);
  
  const errorCount = editedData.filter(row => row._hasError).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">📊 Importar Excel</h1>
          {preview?.column_mapping && Object.keys(preview.column_mapping).length > 0 && (
            <p className="text-sm text-green-600 mt-1">
              ✨ {Object.keys(preview.column_mapping).length} columnas mapeadas automáticamente
            </p>
          )}
        </div>
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Download size={20} />
          Descargar Plantilla
        </button>
      </div>
      
      {!preview && (
        <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-12">
          <div className="text-center">
            <div className="mb-4">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700 font-medium">
                Click para seleccionar archivo
              </span>
              <span className="text-gray-500"> o arrastra aquí</span>
            </label>
            <p className="text-sm text-gray-500 mt-2">XLSX, XLS hasta 10MB</p>
            
            {file && (
              <div className="mt-6">
                <p className="text-sm text-gray-700 mb-3">
                  📄 {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium disabled:opacity-50 transition"
                >
                  {loading ? '🔄 Analizando...' : '✅ Analizar Excel'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {preview && (
        <div className="space-y-4">
          {preview.errores?.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">⚠️ Errores encontrados</h3>
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {preview.errores.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {preview.sugerencias?.length > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">💡 Sugerencias</h3>
                <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                  {preview.sugerencias.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <div className="flex justify-between items-center">
              <p className="text-sm text-blue-800">
                <strong>📋 Resumen:</strong> {preview.total_registros} registros | 
                {preview.estructura_detectada}
                {errorCount > 0 && <span className="text-red-600 font-semibold ml-3">| {errorCount} con errores</span>}
              </p>
              
              {errorCount > 0 && (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyErrors}
                    onChange={(e) => {
                      setShowOnlyErrors(e.target.checked);
                      setCurrentPage(1);
                    }}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <span className="text-gray-700 font-medium">
                    Solo problemas ({errorCount})
                  </span>
                </label>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    {preview.columnas.map(col => (
                      <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayData.map((row) => (
                    <tr key={row._index} className={`${row._hasError ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {row._index + 1}
                      </td>
                      {preview.columnas.map(col => (
                        <td key={col} className="px-6 py-4">
                          <input
                            type="text"
                            value={row[col] || ''}
                            onChange={(e) => handleEdit(row._index, col, e.target.value)}
                            className={`w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 ${
                              row._hasError && (!row[col] || (col === 'MONTO' && isNaN(parseFloat(row[col]))))
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-300'
                            }`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t">
                <div className="text-sm text-gray-700">
                  Mostrando {startIdx + 1} a {Math.min(startIdx + rowsPerPage, filteredData.length)} de {filteredData.length} registros
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded hover:bg-white disabled:opacity-50"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="px-3 py-1">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded hover:bg-white disabled:opacity-50"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 justify-end">
            <button
              onClick={() => { setPreview(null); setFile(null); setEditedData([]); }}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={errorCount > 0}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              ✅ Confirmar ({editedData.length} registros)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
