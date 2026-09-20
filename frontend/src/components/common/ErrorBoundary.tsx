import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
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
    console.error('Unhandled React Application Error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="max-w-xl w-full bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400 border-b border-slate-700 pb-3">
              <AlertTriangle className="h-7 w-7 text-rose-500 shrink-0" />
              <div>
                <h1 className="text-base font-bold text-white tracking-tight">Application Render Exception</h1>
                <p className="text-xs text-slate-400">An unexpected component error occurred during interface rendering.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-xs text-rose-300 overflow-x-auto">
              <div className="font-bold">{this.state.error?.name}: {this.state.error?.message}</div>
              {this.state.errorInfo?.componentStack && (
                <details className="mt-2 text-[11px] text-slate-400 cursor-pointer">
                  <summary className="hover:text-slate-200 font-sans">Component Trace</summary>
                  <pre className="mt-1 font-mono text-[10px] whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                </details>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={this.handleResetError}
                className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs font-semibold cursor-pointer"
              >
                Clear Error
              </button>
              <button
                onClick={this.handleReload}
                className="px-3.5 py-1.5 bg-[#2F3EA0] hover:bg-[#253285] text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
