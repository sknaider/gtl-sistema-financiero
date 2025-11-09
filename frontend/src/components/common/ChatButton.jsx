import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, Sparkles } from 'lucide-react';
import axios from 'axios';

const ChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 **Hola, soy JARVIS**, tu asistente financiero IA de GTL Consulting.\n\n**Puedo ayudarte con:**\n• 📊 Análisis de ingresos y costos\n• 💰 Estado de cuentas por cobrar\n• 📈 KPIs y métricas financieras\n• 🏢 Consultas sobre empresas clientes\n• 💡 Recomendaciones estratégicas',
      suggestions: [
        '¿Cuál es la utilidad de octubre?',
        'Dame un resumen financiero',
        '¿Cuántas empresas tenemos?',
        'Analiza los costos del mes'
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async (messageText = null) => {
    const userMessage = messageText || input.trim();
    if (!userMessage || isLoading) return;

    setInput('');
    setIsLoading(true);

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await axios.post('/sistema/api/ai/chat', {
        message: userMessage,
        mes: 'SETIEMBRE',  // TODO: Obtener del contexto global
        context: {
          current_page: window.location.pathname,
          timestamp: new Date().toISOString()
        }
      });

      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: response.data.response,
          suggestions: response.data.suggestions || []
        }
      ]);
    } catch (error) {
      console.error('Error al comunicarse con JARVIS:', error);
      
      let errorMessage = '❌ Error al conectar con JARVIS.';
      
      if (error.response?.status === 402) {
        errorMessage = '⚠️ **Sin créditos disponibles**\n\nJARVIS requiere créditos de Anthropic.\n\n[Recargar créditos](https://console.anthropic.com/settings/billing)';
      } else if (error.response?.status === 500) {
        errorMessage = '⚠️ **Error interno del servidor**\n\nVerifica los logs del backend:\n```bash\njournalctl -u gtl-backend -n 50\n```';
      } else if (!error.response) {
        errorMessage = '⚠️ **Sin conexión al servidor**\n\nVerifica que el backend esté corriendo:\n```bash\nsystemctl status gtl-backend\n```';
      }

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: errorMessage }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSend(suggestion);
  };

  /**
   * Sanitiza y formatea mensajes de manera segura sin XSS
   * Escapa HTML peligroso antes de aplicar formato markdown
   */
  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const formatMessage = (content) => {
    // Primero escapar todo el HTML peligroso
    let safe = escapeHtml(content);

    // Luego aplicar formato markdown de manera segura
    safe = safe
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold
      .replace(/\n/g, '<br/>')  // Newlines
      .replace(/```bash([\s\S]*?)```/g, '<pre class="bg-gray-800 text-green-400 p-2 rounded text-xs overflow-x-auto my-2">$1</pre>')  // Code blocks
      .replace(/\[(.*?)\]\((https?:\/\/.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>');  // Links seguros

    return safe;
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 z-50 flex items-center gap-2 group animate-pulse hover:animate-none"
          aria-label="Abrir chat JARVIS"
        >
          <Bot className="w-6 h-6" />
          <Sparkles className="w-4 h-4 absolute -top-1 -right-1 text-yellow-300" />
          <span className="hidden group-hover:inline-block text-sm font-bold pr-2 whitespace-nowrap">
            JARVIS AI
          </span>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 animate-slideIn">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bot className="w-7 h-7" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="font-bold text-lg">JARVIS AI</h3>
                <p className="text-xs text-blue-100">Asistente Financiero GTL</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-2 rounded-lg transition"
              aria-label="Cerrar chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((msg, idx) => (
              <div key={idx}>
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none shadow-md'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                        <Bot className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-gray-700">JARVIS</span>
                      </div>
                    )}
                    <div 
                      className="text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                    />
                  </div>
                </div>

                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 ml-2">
                    {msg.suggestions.map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        disabled={isLoading}
                        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-none shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-600">JARVIS está analizando...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pregunta algo a JARVIS..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                aria-label="Enviar mensaje"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              Powered by Claude Sonnet 4 • Anthropic
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatButton;
