import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-void-black flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <h2 className="font-display text-xl text-frost-white mb-2">Error Inesperado</h2>
            <p className="text-sm text-ghost-white mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 border border-cyber-cyan text-cyber-cyan rounded-lg hover:bg-cyber-cyan/10 font-mono text-sm"
            >
              Reiniciar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
