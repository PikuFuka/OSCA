import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  constructor(props: Props) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Error logged to monitoring service in production
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10 max-w-lg w-full text-center space-y-6">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={32} className="text-rose-500" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Something went wrong</h1>
            <p className="text-slate-500 font-medium leading-relaxed">
              The application encountered an unexpected error. Please try refreshing the page. 
              If the problem persists, contact your system administrator.
            </p>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-systemBlue text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-blue-800 transition-all shadow-lg shadow-blue-100"
            >
              <RefreshCw size={16} /> Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default ErrorBoundary;
