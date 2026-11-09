import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, ArrowLeft, RotateCcw, LifeBuoy } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  isUpdating: boolean;
  error?: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    isUpdating: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Check if the error is related to chunk loading or dynamic imports
    const isChunkError = 
      error.name === 'ChunkLoadError' || 
      error.message.includes('Loading chunk') ||
      error.message.includes('Failed to fetch dynamically imported module');
    
    return { 
      hasError: true, 
      isUpdating: isChunkError,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);

    const isChunkError = 
      error.name === 'ChunkLoadError' || 
      error.message.includes('Loading chunk') ||
      error.message.includes('Failed to fetch dynamically imported module');

    if (isChunkError) {
      // Auto-reload after a short delay to get the new chunks
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, isUpdating: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      if (this.state.isUpdating) {
        return (
          <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm p-6 text-center">
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              className="max-w-md w-full bg-surface-container-low dark:bg-dark-surface border border-border dark:border-dark-border rounded-3xl p-8 shadow-2xl flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <h1 className="text-2xl font-bold text-on-surface dark:text-white mb-3">
                System Updating...
              </h1>
              <p className="text-on-surface-variant dark:text-zinc-400 mb-8 leading-relaxed">
                We&apos;ve just deployed a new version of the app. Refreshing your session to grab the latest features!
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
              >
                Reload Now
              </button>
            </motion.div>
          </div>
        );
      }

      // Check if user is on a public booking or check-in flow
      const isBookingOrPublicFlow = typeof window !== 'undefined' && (
        window.location.pathname.includes('/booking') || 
        window.location.pathname.includes('/_tenant/') ||
        window.location.pathname.includes('/customer/') ||
        window.location.pathname.includes('/checkin') ||
        window.location.pathname.includes('/public/')
      );

      // Customer-focused fallback for booking and public flows
      if (isBookingOrPublicFlow) {
        return (
          <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 p-6 text-center">
            <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center">
                <LifeBuoy className="w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-900/40">
                  Customer Assistance
                </span>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  Temporary Connection Hiccup
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                  We ran into an unexpected issue while loading this page. You can try recovering your session or visit the service counter upon arrival.
                </p>
              </div>

              <div className="w-full space-y-2 pt-2">
                <button
                  onClick={this.handleReset}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Try Again</span>
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-2.5 px-4 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 text-xs font-semibold rounded-xl transition-colors"
                >
                  Reload Page
                </button>

                <button
                  onClick={() => {
                    if (window.history.length > 1) {
                      window.history.back();
                    } else {
                      window.location.href = '/';
                    }
                  }}
                  className="w-full py-2 px-4 text-xs font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Go Back</span>
                </button>
              </div>
            </div>
          </div>
        );
      }

      // Generic fallback for dashboard / back-office
      return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background p-6 text-center">
          <div className="max-w-md w-full bg-surface-container-low dark:bg-dark-surface border border-border dark:border-dark-border rounded-3xl p-8 shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-on-surface dark:text-white mb-3">
              Something went wrong
            </h1>
            <p className="text-on-surface-variant dark:text-zinc-400 mb-8 leading-relaxed">
              We encountered an unexpected error. Please try reloading the page.
            </p>
            <div className="w-full space-y-2">
              <button
                onClick={this.handleReset}
                className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2.5 px-4 bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-medium rounded-xl transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
