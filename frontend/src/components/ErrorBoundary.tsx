import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, background: '#ffebee', border: '2px solid #c62828', margin: 12 }}>
          <h3 style={{ color: '#c62828', margin: '0 0 8px 0', fontSize: 14 }}>
            ⚠ {this.props.fallbackTitle ?? 'Tab Rendering Error'}
          </h3>
          <p style={{ fontSize: 12, color: '#333', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {this.state.error?.message}
          </p>
          <button
            className="ir-btn ir-btn-outline"
            style={{ fontSize: 11, marginTop: 8 }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            ↻ Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
