import { useState, useEffect } from 'react';
import { FileText, Plus, Send, Eye, Save, CheckCircle, DollarSign, Coins } from 'lucide-react';
import { BuscadorRUC } from '../../components/common/BuscadorRUC';
import { ProgressStepper } from '../../components/common/ProgressStepper';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = '/sistema/api/v1/facturacion';
const DRAFT_KEY = 'facturaDraft';

export default function FacturacionPage() {
  const [facturas, setFacturas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [tipoCambio, setTipoCambio] = useState(null);
  const [rucValido, setRucValido] = useState(false);
  const [rucTouched, setRucTouched] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  
  // Form state - MONEDA ÚNICA
    const [form, setForm] = useState({
    cliente_ruc: '',
    cliente_razon_social: '',
    moneda_factura: 'PEN',
    forma_pago: 'CONTADO', // NUEVO: CONTADO o CRÉDITO
    numero_cuotas: 3, // NUEVO: Por defecto 3 cuotas
    fecha_primer_vencimiento: '', // NUEVO: Fecha 1ª cuota
    items: [{ descripcion: '', cantidad: 1, valor_unitario: '' }]
  });


  // Verificar estado del módulo
  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'active') {
          toast.success('Módulo de facturación activo', { 
            icon: '✅',
            duration: 2000 
          });
        }
      })
      .catch(err => toast.error('Error conectando al módulo'));
  }, []);

  // Fetch tipo de cambio (SOLO INFORMATIVO)
  useEffect(() => {
    fetch('/sistema/api/tipo-cambio/actual')
      .then(res => res.json())
      .then(data => {
        setTipoCambio(data);
      })
      .catch(err => console.error('Error cargando tipo de cambio:', err));
  }, []);

  // Recuperar draft al cargar
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        const shouldRecover = window.confirm('¿Recuperar borrador guardado?');
        if (shouldRecover) {
          setForm(draft.form);
          setCurrentStep(draft.step || 1);
          toast.success('Borrador recuperado', { icon: '📋' });
        } else {
          localStorage.removeItem(DRAFT_KEY);
        }
      } catch (e) {
        localStorage.removeItem(DRAFT_KEY);
      }
    }
  }, []);

  // Auto-save draft cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (form.cliente_ruc || form.items.some(i => i.descripcion)) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step: currentStep }));
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [form, currentStep]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step: currentStep }));
        toast.success('Borrador guardado', { icon: '💾' });
      }
      
      if (e.key === 'Enter' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        if (currentStep < 3) {
          const canProceed = validateStep(currentStep);
          if (canProceed) {
            setCurrentStep(prev => prev + 1);
          }
        }
      }
      
      if (e.key === 'Escape' && currentStep > 1) {
        setCurrentStep(prev => prev - 1);
      }
    };
    
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [currentStep, form]);

  // Validar RUC
  useEffect(() => {
    if (form.cliente_ruc.length === 11) {
      setRucValido(true);
    } else if (form.cliente_ruc.length > 0) {
      setRucValido(false);
    }
  }, [form.cliente_ruc]);

  const validateStep = (step) => {
    if (step === 1) {
      return form.cliente_ruc.length === 11 && form.cliente_razon_social.length > 0;
    }
    if (step === 2) {
      return form.items.filter(i => i.descripcion && i.valor_unitario).length > 0;
    }
    return true;
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index][field] = value;
    setForm({ ...form, items: newItems });
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { descripcion: '', cantidad: 1, valor_unitario: '' }]
    });
    toast.success('Item agregado', { icon: '➕', duration: 1000 });
  };

  const removeItem = (index) => {
    if (form.items.length > 1) {
      const newItems = form.items.filter((_, i) => i !== index);
      setForm({ ...form, items: newItems });
      toast.success('Item eliminado', { icon: '🗑️', duration: 1000 });
    }
  };

  // CÁLCULO SIMPLIFICADO - SIN CONVERSIÓN
    const calcularTotales = () => {
    // Subtotal = suma de precios (SIN IGV)
    const subtotal = form.items.reduce((sum, item) => {
      return sum + (parseFloat(item.cantidad) || 0) * (parseFloat(item.valor_unitario) || 0);
    }, 0);
    
    // Calcular IGV sobre el subtotal
    const igv = subtotal * 0.18;
    const total = subtotal + igv;
    
    return { subtotal, igv, total };
  };


  const limpiarForm = () => {
    setForm({
      cliente_ruc: '',
      cliente_razon_social: '',
      moneda_factura: 'PEN',
      items: [{ descripcion: '', cantidad: 1, valor_unitario: '' }]
    });
    setPreview(null);
    setCurrentStep(1);
    setRucTouched(false);
    localStorage.removeItem(DRAFT_KEY);
    toast.success('Formulario limpiado', { icon: '🔄' });
  };

  const generarPreview = async () => {
    if (!form.cliente_ruc || !form.cliente_razon_social) {
      toast.error('Complete los datos del cliente', { icon: '⚠️' });
      return;
    }

    const itemsValidos = form.items.filter(i => i.descripcion && i.valor_unitario);
    if (itemsValidos.length === 0) {
      toast.error('Agregue al menos un item', { icon: '⚠️' });
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Generando factura firmada...');
    
    try {
      const response = await fetch(`${API_URL}/emitir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: {
            ruc: form.cliente_ruc,
            razon_social: form.cliente_razon_social
          },
          items: itemsValidos.map(item => ({
            descripcion: item.descripcion,
            cantidad: parseFloat(item.cantidad),
            valor_unitario: parseFloat(item.valor_unitario)
          })),
          serie: 'F001',
          moneda: form.moneda_factura,
          forma_pago: form.forma_pago,
          fecha_vencimiento: form.forma_pago === 'CREDITO' ? form.fecha_primer_vencimiento : null
        })
      });

      const data = await response.json();
      if (data.success) {
        setPreview(data);
        toast.success('Factura generada y firmada correctamente', { 
          id: loadingToast,
          icon: '🎉',
          duration: 4000
        });
        localStorage.removeItem(DRAFT_KEY);
      } else {
        toast.error(data.detail || 'Error generando factura', { id: loadingToast });
      }
    } catch (error) {
      toast.error('Error de conexión', { id: loadingToast });
    }
    setLoading(false);
  };

  const { subtotal, igv, total } = calcularTotales();

  // Símbolo de moneda
  const simboloMoneda = form.moneda_factura === 'USD' ? '$' : 'S/';

  // Helper: Formatear fecha sin conversión UTC
  const formatearFecha = (fechaString) => {
    if (!fechaString) return "";
    const [year, month, day] = fechaString.split("-");
    return `${day}/${month}/${year}`;
  };

  // Animación para pasos
  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Facturación Electrónica</h1>
            <p className="text-sm text-gray-500">SUNAT - Comprobantes de Pago Electrónicos</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {draftSaved && (
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"
            >
              <Save className="w-3 h-3" />
              Borrador guardado
            </motion.span>
          )}
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            RUC: 20610565451
          </span>
        </div>
      </div>

      {/* Progress Stepper */}
      <ProgressStepper currentStep={currentStep} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <AnimatePresence mode="wait">
            {/* PASO 1: CLIENTE + MONEDA */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  👤 Paso 1/3: Datos del Cliente
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RUC</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={form.cliente_ruc}
                        onChange={(e) => {
                          setForm({ ...form, cliente_ruc: e.target.value });
                          setRucTouched(true);
                        }}
                        placeholder="20123456789"
                        maxLength={11}
                        className={`
                          flex-1 px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all
                          ${rucValido ? 'border-green-500 bg-green-50' : rucTouched ? 'border-red-500' : 'border-gray-300'}
                        `}
                      />
                      <BuscadorRUC 
                        ruc={form.cliente_ruc}
                        onClienteEncontrado={(cliente) => {
                          setForm(prev => ({
                            ...prev,
                            cliente_ruc: cliente.ruc,
                            cliente_razon_social: cliente.razon_social
                          }));
                          toast.success(`Cliente: ${cliente.razon_social}`, { icon: '✅' });
                        }}
                        mostrarModal={true}
                      />
                    </div>
                    {!rucValido && rucTouched && form.cliente_ruc.length > 0 && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-500 mt-1 flex items-center gap-1"
                      >
                        ⚠️ RUC debe tener 11 dígitos
                      </motion.p>
                    )}
                    {rucValido && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-green-600 mt-1 flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" /> RUC válido
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social</label>
                    <input
                      type="text"
                      value={form.cliente_razon_social}
                      onChange={(e) => setForm({ ...form, cliente_razon_social: e.target.value })}
                      placeholder="EMPRESA CLIENTE SAC"
                      className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  {/* SELECTOR DE MONEDA */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <label className="block text-sm font-semibold text-blue-900 mb-3">
                      💰 Moneda de Factura
                    </label>
                    <div className="flex gap-4">
                      <motion.label
                        whileHover={{ scale: 1.02 }}
                        className={`
                          flex items-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all
                          ${form.moneda_factura === 'PEN' 
                            ? 'bg-green-100 border-green-500 text-green-900' 
                            : 'bg-white border-gray-300 text-gray-700 hover:border-green-300'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="moneda"
                          value="PEN"
                          checked={form.moneda_factura === 'PEN'}
                          onChange={(e) => setForm({ ...form, moneda_factura: e.target.value })}
                          className="w-4 h-4"
                        />
                        <Coins className="w-5 h-5" />
                        <span className="font-medium">S/ Soles</span>
                      </motion.label>

                      <motion.label
                        whileHover={{ scale: 1.02 }}
                        className={`
                          flex items-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all
                          ${form.moneda_factura === 'USD' 
                            ? 'bg-green-100 border-green-500 text-green-900' 
                            : 'bg-white border-gray-300 text-gray-700 hover:border-green-300'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="moneda"
                          value="USD"
                          checked={form.moneda_factura === 'USD'}
                          onChange={(e) => setForm({ ...form, moneda_factura: e.target.value })}
                          className="w-4 h-4"
                        />
                        <DollarSign className="w-5 h-5" />
                        <span className="font-medium">$ Dólares</span>
                      </motion.label>
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      ℹ️ Todos los items se facturarán en {form.moneda_factura === 'USD' ? 'dólares' : 'soles'}
                    </p>
                  </div>

                  {/* Selector de Forma de Pago */}
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                    <label className="block text-sm font-semibold text-purple-900 mb-3">
                      💳 Forma de Pago
                    </label>
                    <div className="flex gap-4">
                      <motion.label
                        whileHover={{ scale: 1.02 }}
                        className={`
                          flex items-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all flex-1
                          ${form.forma_pago === 'CONTADO' 
                            ? 'bg-purple-100 border-purple-500 text-purple-900' 
                            : 'bg-white border-gray-300 text-gray-700 hover:border-purple-300'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="forma_pago"
                          value="CONTADO"
                          checked={form.forma_pago === 'CONTADO'}
                          onChange={(e) => setForm({ ...form, forma_pago: e.target.value })}
                          className="w-4 h-4"
                        />
                        <span className="font-medium">💵 Contado</span>
                      </motion.label>

                      <motion.label
                        whileHover={{ scale: 1.02 }}
                        className={`
                          flex items-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all flex-1
                          ${form.forma_pago === 'CREDITO' 
                            ? 'bg-purple-100 border-purple-500 text-purple-900' 
                            : 'bg-white border-gray-300 text-gray-700 hover:border-purple-300'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="forma_pago"
                          value="CREDITO"
                          checked={form.forma_pago === 'CREDITO'}
                          onChange={(e) => setForm({ ...form, forma_pago: e.target.value })}
                          className="w-4 h-4"
                        />
                        <span className="font-medium">📅 Crédito</span>
                      </motion.label>
                    </div>

                    {/* Campo fecha vencimiento si es CRÉDITO */}
                    {form.forma_pago === 'CREDITO' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4"
                      >
                        <label className="block text-sm font-medium text-purple-800 mb-2">
                          📆 Fecha de Vencimiento
                        </label>
                        <input
                          type="date"
                          value={form.fecha_primer_vencimiento}
                          onChange={(e) => setForm({ ...form, fecha_primer_vencimiento: e.target.value })}
                          className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          min={new Date().toISOString().split('T')[0]}
                        />
                        <p className="text-xs text-purple-600 mt-1">
                          ℹ️ Fecha límite para el pago total de la factura
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* Preview Cliente */}
                  {form.cliente_razon_social && form.cliente_ruc.length === 11 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-green-50 border border-green-200 rounded-lg p-4"
                    >
                      <p className="font-semibold text-green-800">✅ Cliente Listo</p>
                      <p className="text-sm text-gray-700 mt-1">{form.cliente_razon_social}</p>
                      <p className="text-sm text-gray-600">RUC: {form.cliente_ruc}</p>
                      <p className="text-sm text-green-700 font-medium mt-1">
                        Factura en: {form.moneda_factura === 'USD' ? '$ USD' : 'S/ PEN'}
                      </p>
                      <p className="text-sm text-purple-700 font-medium mt-1">
                        Forma de pago: {form.forma_pago}
                        {form.forma_pago === "CREDITO" && form.fecha_primer_vencimiento && (
                          <span className="block text-xs text-purple-600 mt-0.5">
                            Vencimiento: {formatearFecha(form.fecha_primer_vencimiento)}
                          </span>
                        )}
                      </p>
                    </motion.div>
                  )}
                </div>

                <div className="flex justify-end mt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentStep(2)}
                    disabled={!validateStep(1)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                  >
                    Siguiente →
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* PASO 2: ITEMS (SIN SELECTOR MONEDA) */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    📦 Paso 2/3: Detalle de Servicios
                  </h2>
                  <div className={`
                    px-3 py-1 rounded-full text-sm font-semibold
                    ${form.moneda_factura === 'USD' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
                  `}>
                    Factura en: {simboloMoneda} {form.moneda_factura}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">ITEMS</h3>
                  <AnimatePresence>
                    {form.items.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.2 }}
                        className="flex gap-2 mb-2"
                      >
                        <input
                          type="text"
                          value={item.descripcion}
                          onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                          placeholder="Descripción del servicio"
                          className="flex-1 px-3 py-2 border rounded-lg hover:border-blue-400 transition-colors"
                        />
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                          placeholder="Cant"
                          min="1"
                          className="w-20 px-3 py-2 border rounded-lg text-center"
                        />
                        <div className="relative w-32">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                            {simboloMoneda}
                          </span>
                          <input
                            type="number"
                            value={item.valor_unitario}
                            onChange={(e) => handleItemChange(index, 'valor_unitario', e.target.value)}
                            placeholder="Precio"
                            step="0.01"
                            className="w-full pl-10 pr-3 py-2 border rounded-lg text-right"
                          />
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeItem(index)}
                          className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          disabled={form.items.length === 1}
                        >
                          ✕
                        </motion.button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addItem}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Agregar item
                  </motion.button>
                </div>

                <div className="flex gap-4 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    ← Anterior
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentStep(3)}
                    disabled={!validateStep(2)}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Siguiente →
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* PASO 3: CONFIRMACIÓN (SIN CONVERSIÓN) */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  ✅ Paso 3/3: Confirmar y Enviar
                </h2>

                {/* Preview Visual */}
                <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">FACTURA ELECTRÓNICA</h3>
                      <p className="text-gray-600">GTL CONSULTING S.A.C.S.</p>
                      <p className="text-gray-600">RUC: 20610565451</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-600">F001-00000001</p>
                      <p className="text-gray-500">{new Date().toLocaleDateString('es-PE')}</p>
                      <p className={`
                        text-sm font-semibold mt-1 px-2 py-1 rounded
                        ${form.moneda_factura === 'USD' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
                      `}>
                        {form.moneda_factura}
                      </p>
                    </div>
                  </div>

                      <p className={`
                        text-sm font-semibold mt-1 px-2 py-1 rounded
                        ${form.forma_pago === "CONTADO" ? "bg-purple-100 text-purple-800" : "bg-orange-100 text-orange-800"}
                      `}>
                        {form.forma_pago}
                      </p>
                      {form.forma_pago === "CREDITO" && form.fecha_primer_vencimiento && (
                        <p className="text-xs text-orange-600 mt-1">
                          Venc: {formatearFecha(form.fecha_primer_vencimiento)}
                        </p>
                      )}
                  <div className="border-t border-b border-gray-300 py-4 my-4">
                    <h4 className="font-semibold text-gray-700">CLIENTE</h4>
                    <p className="text-gray-800">{form.cliente_razon_social}</p>
                    <p className="text-sm text-gray-600">RUC: {form.cliente_ruc}</p>
                  </div>

                  <table className="w-full mb-6">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-2">Descripción</th>
                        <th className="text-right p-2">Cant.</th>
                        <th className="text-right p-2">P.U.</th>
                        <th className="text-right p-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.filter(i => i.descripcion && i.valor_unitario).map((item, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2">{item.descripcion}</td>
                          <td className="text-right p-2">{item.cantidad}</td>
                          <td className="text-right p-2">
                            {simboloMoneda} {parseFloat(item.valor_unitario).toFixed(2)}
                          </td>
                          <td className="text-right p-2">
                            {simboloMoneda} {(item.cantidad * item.valor_unitario).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-end">
                    <div className="w-80">
                      <div className="flex justify-between py-2 text-gray-700">
                        <span>Subtotal:</span>
                        <span>{simboloMoneda} {subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-2 text-gray-700">
                        <span>IGV (18%):</span>
                        <span>{simboloMoneda} {igv.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-3 border-t-2 border-gray-300 font-bold text-lg">
                        <span>TOTAL:</span>
                        <span className="text-blue-600">{simboloMoneda} {total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🔐</span>
                      <div>
                        <p className="font-semibold text-green-800">Certificado Digital Activo</p>
                        <p className="text-sm text-green-600">Válido hasta: 26/11/2028</p>
                      </div>
                    </div>
                  </div>
                </div>

                {preview && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 bg-green-50 border border-green-200 rounded-lg p-6"
                  >
                    <h3 className="text-lg font-semibold text-green-800 mb-3">✅ Factura Generada y Firmada</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Serie-Número:</strong> {preview.serie}-{String(preview.numero).padStart(8, '0')}</p>
                      <p><strong>Subtotal:</strong> {simboloMoneda} {preview.subtotal?.toFixed(2)}</p>
                      <p><strong>IGV:</strong> {simboloMoneda} {preview.igv?.toFixed(2)}</p>
                      <p><strong>Total:</strong> {simboloMoneda} {preview.total?.toFixed(2)}</p>
                      <p className="text-green-600"><strong>XML:</strong> {preview.xml_generado ? '✓ Generado' : '✗ Error'}</p>
                      <p className="text-green-600"><strong>Firmado:</strong> {preview.firmado ? '✓ Sí' : '✗ No'}</p>
                    </div>
                  </motion.div>
                )}

                <div className="flex gap-4 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    ← Anterior
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    onClick={generarPreview}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                  >
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          🔄
                        </motion.div>
                        Generando...
                      </>
                    ) : preview ? (
                      <>✅ Generar Nueva Factura</>
                    ) : (
                      <>🚀 Generar y Firmar Factura</>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Panel Derecho */}
        <div className="space-y-4">
          {/* Tipo de Cambio - SOLO INFORMATIVO */}
          {tipoCambio && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm"
            >
              <p className="font-medium text-blue-800 mb-1">💱 Tipo de Cambio (Referencia)</p>
              <p className="text-blue-700">
                S/ {tipoCambio.valor.toFixed(2)} = $1.00 USD
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Actualizado: {tipoCambio.fecha}
              </p>
            </motion.div>
          )}

          {/* Resumen SIN conversión */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Resumen</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>{simboloMoneda} {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>IGV (18%):</span>
                <span>{simboloMoneda} {igv.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t pt-2 mt-2">
                <span>TOTAL:</span>
                <span className="text-green-600">{simboloMoneda} {total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-medium mb-1">⌨️ Atajos de Teclado</p>
            <p className="text-xs leading-relaxed">
              • Enter: Siguiente paso<br />
              • Esc: Paso anterior<br />
              • Ctrl+S: Guardar borrador
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={limpiarForm}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-all"
          >
            🔄 Limpiar Formulario
          </motion.button>
        </div>
      </div>
    </div>
  );
}
