import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 sm:p-6 text-center">
          <div className="bg-white border border-red-200 shadow-xl rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>
            
            <div className="space-y-1.5">
              <h2 className="text-lg font-black text-slate-900">
                Dashboard Rendering Notice
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Page display karte waqt samasya aayi. Kripya reload karein ya home par jayein.
              </p>
              {this.state.error && (
                <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left font-mono text-[11px] text-rose-600 overflow-x-auto max-h-24">
                  {String(this.state.error?.message || this.state.error)}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-md shadow-orange-600/20 active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Go to Home</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
