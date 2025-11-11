import React, { useState } from 'react';
import api from '../../services/api';
import { Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Layers, Eye, Trash2 } from 'lucide-react';

export default function ExcelImport() {
  const [file, setFile] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [preview, setPreview] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [editedData, setEditedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importingAll, setImportingAll] = useState(false);

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/excel/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'GTL_Template_Ingresos.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Error descargando plantilla');
    }
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setSheets([]);
    setSelectedSheets([]);
    setPreview(null);
    setSelectedSheet(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await api.post('/excel/sheets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSheets(res.data.sheets || []);
    } catch (err) {
      alert('Error leyendo hojas del Excel');
      console.error(err);
    }
  };

  const handlePreviewSheet = async (sheetName) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sheet_name', sheetName);

    setLoading(true);
    try {
      const res = await api.post('/excel/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreview(res.data);
      setSelectedSheet(sheetName);
      setEditedData(res.data.preview || []);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.detail || 'Error al procesar'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!editedData.length) return;

    setLoading(true);
    try {
      await api.post('/excel/confirm', { registros: editedData });
      alert(`✅ ${editedData.length} registros importados exitosamente`);
      
      setFile(null);
      setSheets([]);
      setPreview(null);
      setSelectedSheet(null);
      setEditedData([]);
    } catch (err) {
      alert('Error importando: ' + (err.response?.data?.detail || 'Error'));
    } finally {
      setLoading(false);
    }
  };

  const handleImportAll = async () => {
    if (!file) return;

    const confirmed = window.confirm(
      `¿Importar todas las ${sheets.length} hojas?\n\nEsto procesará todas las hojas válidas automáticamente.`
    );

    if (!confirmed) return;

    const formData = new FormData();
    formData.append('file', file);

    setImportingAll(true);
    try {
      const res = await api.post('/excel/import-all-sheets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const successMsg = res.data.message || `✅ ${res.data.total_imported} registros importados`;
      alert(successMsg);

      if (res.data.sheets && res.data.sheets.length > 0) {
        console.log('📊 Detalle de importación:', res.data.sheets);
      }

      setFile(null);
      setSheets([]);
      setSelectedSheets([]);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.detail || 'Error importando hojas'));
      console.error(err);
    } finally {
      setImportingAll(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-800">Importar Excel</h1>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Download size={20} />
            Descargar Plantilla
          </button>
        </div>

        {!file && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-lg text-blue-600 hover:text-blue-700 font-semibold">
                Click para seleccionar archivo
              </span>
              <p className="text-gray-500 mt-2">XLSX, XLS hasta 10MB</p>
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {file && sheets.length > 0 && !preview && (
          <div className="space-y-4">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="font-semibold text-blue-800">
                📄 {file.name} - {sheets.length} hojas detectadas
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleImportAll}
                disabled={importingAll}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold text-lg transition"
              >
                <Layers size={24} />
                {importingAll ? '⏳ Importando...' : `⚡ Importar TODAS las ${sheets.length} hojas`}
              </button>

              <button
                onClick={() => {
                  setFile(null);
                  setSheets([]);
                }}
                className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                <Trash2 size={20} className="inline mr-2" />
                Cancelar
              </button>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold text-gray-700 mb-3">O selecciona hojas individuales para preview:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sheets.map((sheet) => (
                  <button
                    key={sheet}
                    onClick={() => handlePreviewSheet(sheet)}
                    disabled={loading}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <Eye size={18} className="text-blue-600" />
                      <span className="font-medium text-gray-800">{sheet}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {preview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                📊 Preview: {selectedSheet}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPreview(null);
                    setSelectedSheet(null);
                  }}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ← Volver
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={loading || editedData.length === 0}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle size={20} />
                  Importar {editedData.length} registros
                </button>
              </div>
            </div>

            {editedData.length > 0 && (
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(editedData[0]).map((col) => (
                        <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {editedData.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        {Object.values(row).map((val, i) => (
                          <td key={i} className="px-4 py-3 text-sm text-gray-900">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {editedData.length > 10 && (
                  <div className="bg-gray-50 px-4 py-3 text-sm text-gray-600">
                    Mostrando 10 de {editedData.length} registros
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
