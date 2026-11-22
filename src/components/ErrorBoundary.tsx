import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  declare readonly props: Readonly<Props>;

  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application Error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let friendlyMessage = 'Ocurrió un error inesperado al cargar tus datos.';
      try {
        const parsed = JSON.parse(this.state.errorMessage);
        if (parsed?.error?.includes('Missing or insufficient permissions')) {
          friendlyMessage =
            'No tienes permisos suficientes para acceder a este recurso. Verifica tu sesión o las reglas de seguridad.';
        } else if (parsed?.error?.includes('Quota exceeded')) {
          friendlyMessage =
            'Se alcanzó el límite diario de consultas de la base de datos. Intenta de nuevo mañana.';
        }
      } catch {
        // Not a JSON FirestoreErrorInfo string; keep default message
      }

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 dark:text-rose-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Algo salió mal</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{friendlyMessage}</p>
            </div>
            <button
              onClick={this.handleReload}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reintentar</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
