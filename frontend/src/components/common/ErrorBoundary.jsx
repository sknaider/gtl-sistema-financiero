import { Component } from 'react';

/**
 * Error Boundary component para capturar errores de React y evitar crash completo
 *
 * Uso:
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el estado para renderizar UI de fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log del error
    console.error('ErrorBoundary capturó un error:', error, errorInfo);

    // Aquí podrías enviar el error a un servicio de monitoring
    // como Sentry, LogRocket, etc.
    // Example: Sentry.captureException(error);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/sistema/';
  };

  render() {
    if (this.state.hasError) {
      // UI de fallback personalizada
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
            <div className="text-center">
              {/* Icono de error */}
              <div className="mb-4">
                <svg
                  className="w-16 h-16 text-red-500 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Algo salió mal!
              </h1>

              <p className="text-gray-600 mb-6">
                Lo sentimos, ha ocurrido un error inesperado. Por favor, intenta recargar la página.
              </p>

              {/* Detalles del error (solo en desarrollo) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                    Ver detalles técnicos
                  </summary>
                  <div className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-48">
                    <p className="font-semibold text-red-600 mb-2">
                      {this.state.error.toString()}
                    </p>
                    <pre className="text-gray-700 whitespace-pre-wrap">
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              {/* Botones de acción */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={this.handleReload}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Recargar página
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Ir al inicio
                </button>
              </div>

              {/* Información de soporte */}
              <p className="mt-6 text-sm text-gray-500">
                Si el problema persiste, contacta a soporte técnico
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
