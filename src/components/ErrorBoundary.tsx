import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public props: Props;
  public state: State;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled app error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetAndReload = () => {
    try {
      // Clear app state keys while preserving necessary items
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('p_') || key.startsWith('premier_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-slate-800/90 border border-slate-700 p-6 sm:p-8 rounded-3xl shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
              !
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Temporary Display Issue
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                The library portal encountered a display glitch. You can reload the page or reset cached session data to continue.
              </p>
            </div>

            {this.state.error && (
              <details className="text-left bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 max-h-36 overflow-y-auto">
                <summary className="cursor-pointer text-slate-300 font-semibold select-none">
                  Technical Details
                </summary>
                <p className="mt-2 text-rose-400 whitespace-pre-wrap">
                  {this.state.error.message}
                </p>
              </details>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer shadow-xs"
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleResetAndReload}
                className="w-full sm:flex-1 py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Reset Session
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
