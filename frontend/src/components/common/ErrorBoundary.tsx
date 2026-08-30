import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f1f5f9] p-8 flex items-center justify-center font-sans">
          <div className="bg-white border border-rose-300 rounded-3xl p-8 max-w-2xl w-full shadow-xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertOctagon className="w-8 h-8" />
              <h2 className="text-xl font-bold text-slate-900">Application Render Notice</h2>
            </div>
            <p className="text-sm text-slate-600">
              A runtime component exception was caught. Details below:
            </p>
            <div className="bg-slate-900 text-rose-300 p-4 rounded-2xl font-mono text-xs overflow-x-auto whitespace-pre-wrap">
              {this.state.error?.toString()}
              {this.state.errorInfo?.componentStack}
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center space-x-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
