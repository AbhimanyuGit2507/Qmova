import React, { Component, ErrorInfo, ReactNode } from 'react';
import { 
  AlertTriangle, 
  RefreshCw, 
  Phone, 
  Mail, 
  MessageSquare, 
  Store, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  RotateCcw,
  LifeBuoy
} from 'lucide-react';

interface Props {
  tenant?: any;
  selectedLocationId?: string | null;
  onRetry?: () => void;
  onPayAtCounter?: () => void;
  onReset?: () => void;
  primaryColor?: string;
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

export class BookingErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true, 
      error 
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[BookingErrorBoundary] Caught booking flow error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  public handlePayAtCounter = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onPayAtCounter) {
      this.props.onPayAtCounter();
    }
  };

  public handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public handleCopyDiagnostics = () => {
    const { error, errorInfo } = this.state;
    const diagnosticText = `Qmova Booking Error Diagnostic
Tenant: ${this.props.tenant?.name || 'N/A'} (ID: ${this.props.tenant?.id || 'N/A'})
URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}
Error: ${error?.name}: ${error?.message}
Stack:
${error?.stack || 'N/A'}
Component Stack:
${errorInfo?.componentStack || 'N/A'}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(diagnosticText).then(() => {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2500);
      });
    }
  };

  public render() {
    if (this.state.hasError) {
      const { tenant, selectedLocationId, primaryColor = '#4f46e5' } = this.props;
      const { error, showDetails, copied } = this.state;

      const locations: any[] = Array.isArray(tenant?.locations) ? tenant.locations : [];
      const location = locations.find(l => l.id === selectedLocationId) || locations[0];

      const tenantName = tenant?.name || 'Customer Support';
      const supportPhone = tenant?.supportPhone || tenant?.phone || (location?.phone as string) || '';
      const whatsappPhone = tenant?.whatsappPhone || tenant?.supportPhone || tenant?.phone || '';
      const supportEmail = tenant?.supportEmail || tenant?.email || '';
      const hasDirectContact = Boolean(supportPhone || whatsappPhone || supportEmail);

      const cleanPhone = supportPhone.replace(/[^\d+]/g, '');
      const cleanWaPhone = whatsappPhone.replace(/[^\d]/g, '');
      const waText = encodeURIComponent(`Hi ${tenantName}, I am trying to book online and ran into an issue. Could you please help me confirm my booking?`);
      const emailSubject = encodeURIComponent(`Booking Assistance Request - ${tenantName}`);
      const emailBody = encodeURIComponent(`Hello ${tenantName} Team,\n\nI was attempting to book online at your portal but encountered an unexpected error.\n\nPlease reach out or assist me in completing my booking.\n\nThank you!`);

      return (
        <div className="w-full flex-1 flex flex-col justify-center py-6 px-2">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-center max-w-lg mx-auto w-full">
            
            {/* Visual Icon Header */}
            <div className="flex flex-col items-center">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-md"
                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
              >
                <LifeBuoy className="w-8 h-8 animate-pulse" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-900/40 mb-2">
                Booking Concierge
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-zinc-100 tracking-tight">
                We hit a temporary bump
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 mt-2 leading-relaxed">
                Don&apos;t worry — your appointment details are safe. You can retry this step, switch to paying at the counter upon arrival, or connect directly with <strong className="text-gray-900 dark:text-zinc-200">{tenantName}</strong> to finalize your booking right away.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-white shadow-md hover:shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry This Step</span>
              </button>

              {this.props.onPayAtCounter && (
                <button
                  type="button"
                  onClick={this.handlePayAtCounter}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm text-gray-800 dark:text-zinc-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700/80 transition-colors flex items-center justify-center gap-2 border border-gray-200 dark:border-zinc-700"
                >
                  <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Confirm & Pay at Counter Instead</span>
                </button>
              )}

              {this.props.onReset && (
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Choose Services Again</span>
                </button>
              )}
            </div>

            {/* Tenant Customer Care Contacts */}
            {hasDirectContact && (
              <div className="pt-4 border-t border-gray-200/80 dark:border-zinc-800 text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-3 text-center">
                  Direct Support with {tenantName}
                </p>

                <div className="grid grid-cols-1 gap-2">
                  {supportPhone && (
                    <a
                      href={`tel:${cleanPhone}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/60 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors border border-gray-200/60 dark:border-zinc-700/60"
                    >
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 dark:text-zinc-100 truncate">Call Front Desk</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 font-mono truncate">{supportPhone}</p>
                      </div>
                    </a>
                  )}

                  {whatsappPhone && (
                    <a
                      href={`https://wa.me/${cleanWaPhone}?text=${waText}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors border border-emerald-200/60 dark:border-emerald-800/60"
                    >
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 dark:text-zinc-100 truncate">Chat on WhatsApp</p>
                        <p className="text-[11px] text-gray-500 dark:text-zinc-400">Instant customer support</p>
                      </div>
                    </a>
                  )}

                  {supportEmail && (
                    <a
                      href={`mailto:${supportEmail}?subject=${emailSubject}&body=${emailBody}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/60 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors border border-gray-200/60 dark:border-zinc-700/60"
                    >
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 dark:text-zinc-100 truncate">Email Customer Care</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{supportEmail}</p>
                      </div>
                    </a>
                  )}
                </div>

                {location && (location.address || location.city) && (
                  <div className="mt-3 p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/40 text-[11px] text-gray-500 dark:text-zinc-400 text-center border border-gray-200/50 dark:border-zinc-800/60">
                    📍 <strong>{location.name}:</strong> {location.address ? `${location.address}, ` : ''}{location.city || ''}
                  </div>
                )}
              </div>
            )}

            {/* Diagnostic Information (Collapsible) */}
            <div className="pt-2 text-left">
              <button
                type="button"
                onClick={() => this.setState({ showDetails: !showDetails })}
                className="w-full flex items-center justify-between text-[11px] font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 py-1 transition-colors"
              >
                <span>Diagnostic details (for staff)</span>
                {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showDetails && (
                <div className="mt-2 p-3 bg-gray-100 dark:bg-zinc-950 rounded-xl text-[11px] font-mono text-gray-700 dark:text-zinc-300 space-y-2 border border-gray-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-600 dark:text-red-400 truncate">
                      {error?.name || 'Error'}: {error?.message || 'Unknown issue'}
                    </span>
                    <button
                      type="button"
                      onClick={this.handleCopyDiagnostics}
                      className="ml-2 px-2 py-1 bg-white dark:bg-zinc-800 rounded border border-gray-200 dark:border-zinc-700 text-[10px] font-sans font-semibold flex items-center gap-1 shrink-0"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  {error?.stack && (
                    <pre className="max-h-28 overflow-y-auto text-[10px] text-gray-500 dark:text-zinc-500 whitespace-pre-wrap leading-tight">
                      {error.stack}
                    </pre>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

