import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { fetchApi } from '../../lib/api';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Lock,
} from 'lucide-react';

const FALLBACK_STRIPE_PK =
  'pk_live_51TncmkIdVVmQLEG3kmpaJE7ROAPd9XcW94BzXuJoLlEjuGCMVflLVSw3chR4GL3IlI9Wnq2WkQKtkVrhxGRSB8mA00G5T3CIYn';

const getCurrencyMinStripeCents = (curr: string): number => {
  const c = (curr || 'USD').toUpperCase();
  if (c === 'ZAR') return 800; // R 8.00 minimum for Stripe card processing
  if (['USD', 'EUR', 'CAD', 'AUD', 'SGD', 'NZD'].includes(c)) return 50; // 0.50
  if (c === 'GBP') return 30; // £0.30
  if (c === 'JPY') return 50; // ¥50
  return 50;
};

const getCurrencySymbol = (curr: string): string => {
  const c = (curr || 'USD').toUpperCase();
  if (c === 'ZAR') return 'R';
  if (c === 'EUR') return '€';
  if (c === 'GBP') return '£';
  if (c === 'JPY') return '¥';
  return '$';
};

interface PaymentStepProps {
  tenantId: string;
  amount: number;
  currency: string;
  stripeAccountId?: string;
  onSuccess: (paymentId: string) => void;
  onBack?: () => void;
  primaryColor: string;
  visitId?: string;
  visitStepId?: string;
  onSkip?: () => void;
  isDark?: boolean;
}

const CheckoutForm = ({
  onSuccess,
  onBack,
  onSkip,
  primaryColor,
  paymentId,
  amount,
  currency,
  isDark: _isDark,
}: {
  onSuccess: (paymentId: string) => void;
  onBack?: () => void;
  onSkip?: () => void;
  primaryColor: string;
  paymentId: string;
  amount: number;
  currency: string;
  isDark?: boolean;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [isElementReady, setIsElementReady] = useState(false);
  const [elementLoadError, setElementLoadError] = useState<string | null>(null);

  // Safety fallback: if Stripe loads but onReady event is delayed or suppressed, reveal inputs after 3.5s
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsElementReady(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const currSymbol = getCurrencySymbol(currency);
  const formattedAmount = `${currSymbol}${(amount / 100).toFixed(2)}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setError(null);
    setProcessing(true);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'Please check your card details and try again.');
      setProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment failed. Please verify your card details or pay at the counter.');
      setProcessing(false);
    } else {
      try {
        await fetchApi(`/tenant-payments/public/payment/${paymentId}/complete`, {
          method: 'POST',
          body: JSON.stringify({ method: 'CARD' }),
        });
        onSuccess(paymentId);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Payment confirmed by Stripe, but status sync took longer than expected.';
        setError(msg);
        setProcessing(false);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 sm:space-y-6 flex-1 w-full max-w-2xl mx-auto bg-white dark:bg-zinc-900 border border-gray-200/90 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl shadow-black/5 dark:shadow-black/30"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>256-Bit SSL Encrypted Checkout</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Secure Payment
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">
          Enter your card details to instantly confirm your booking
        </p>
      </div>

      {/* Amount Due Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100/80 dark:from-zinc-950 dark:via-zinc-950/90 dark:to-zinc-900 border border-gray-200/80 dark:border-zinc-800 p-4 sm:p-5 flex items-center justify-between shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              Total Amount Due
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Instant Confirm
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-zinc-400 flex items-center gap-1.5 font-medium">
            <CreditCard className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
            Credit / Debit / Digital Wallets
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {formattedAmount}
          </div>
          <span className="text-[10px] sm:text-[11px] font-medium text-gray-400 dark:text-zinc-500">
            Taxes & fees included
          </span>
        </div>
      </div>

      {/* Payment Element Container with Skeleton Overlay */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-zinc-300">
            Card or Payment Method
          </label>
          <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-zinc-500 font-medium">
            <Lock className="w-3 h-3 text-emerald-500" />
            <span>End-to-End Encrypted</span>
          </div>
        </div>

        <div className="relative min-h-[160px]">
          {!isElementReady && !elementLoadError && (
            <div className="absolute inset-0 z-10 bg-white dark:bg-zinc-900 space-y-3 py-1 pointer-events-none">
              <div className="h-11 bg-gray-100 dark:bg-zinc-800 rounded-xl w-full flex items-center justify-center text-xs font-medium text-gray-400 dark:text-zinc-500 gap-2 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-[#635BFF]" />
                Initializing secure Stripe checkout...
              </div>
              <div className="h-12 bg-gray-100 dark:bg-zinc-800 rounded-xl w-full animate-pulse" />
              <div className="grid grid-cols-2 gap-3 animate-pulse">
                <div className="h-12 bg-gray-100 dark:bg-zinc-800 rounded-xl" />
                <div className="h-12 bg-gray-100 dark:bg-zinc-800 rounded-xl" />
              </div>
            </div>
          )}

          {elementLoadError && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs space-y-2 mb-3">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                {elementLoadError}
              </p>
              <p className="text-[11px] opacity-90">
                You can confirm your booking right now and pay in person at the counter.
              </p>
            </div>
          )}

          <div className={!isElementReady ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
            <PaymentElement
              onReady={() => setIsElementReady(true)}
              onLoadError={(err) => {
                console.error('PaymentElement failed to load:', err);
                setElementLoadError('Card processor unavailable. Please choose pay at counter.');
              }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs font-medium flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Buttons */}
      <div className="space-y-3 pt-2">
        <div className="flex gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={processing}
              className="px-5 py-4 rounded-xl font-bold text-gray-700 dark:text-zinc-300 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors text-sm"
            >
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={!stripe || !elements || !isElementReady || processing}
            className="flex-1 py-4 rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-[1.01] active:scale-98 flex justify-center items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: primaryColor }}
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : !isElementReady ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading Details...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Pay Now • {formattedAmount}</span>
              </>
            )}
          </button>
        </div>

        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={processing}
            className="w-full py-3.5 rounded-xl font-semibold text-xs sm:text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white bg-transparent hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5"
          >
            Skip & Pay Later at Counter (Cash or Card)
          </button>
        )}
      </div>

      {/* Trust & Accepted Cards & Powered by Stripe Footer */}
      <div className="pt-4 border-t border-gray-100 dark:border-zinc-800/80 space-y-3.5">
        {/* Accepted Payment Methods Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-zinc-800/90 border border-gray-200/80 dark:border-zinc-700/60 text-[11px] font-black tracking-tight text-[#1A1F71] dark:text-[#6979F8]">
            VISA
          </span>
          <span className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-zinc-800/90 border border-gray-200/80 dark:border-zinc-700/60 text-[11px] font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-1">
            <span className="flex -space-x-1 items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EB001B] inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#F79E1B] inline-block opacity-85" />
            </span>
            <span>Mastercard</span>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-zinc-800/90 border border-gray-200/80 dark:border-zinc-700/60 text-[11px] font-extrabold text-[#006FCF] dark:text-[#2E9BFF]">
            AMEX
          </span>
          <span className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-zinc-800/90 border border-gray-200/80 dark:border-zinc-700/60 text-[11px] font-bold text-gray-700 dark:text-zinc-300">
            Apple Pay
          </span>
          <span className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-zinc-800/90 border border-gray-200/80 dark:border-zinc-700/60 text-[11px] font-bold text-gray-700 dark:text-zinc-300">
            Google Pay
          </span>
        </div>

        {/* Powered by Stripe & PCI Compliance */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 px-1 text-[11px] text-gray-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5 font-medium">
            <span>Powered by</span>
            <span className="inline-flex items-center gap-1 font-bold text-[#635BFF] dark:text-[#7A73FF]">
              <svg className="h-3.5 w-auto" viewBox="0 0 60 25" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M59.64 14.28c0-4.3-2.1-7.7-6.26-7.7-4.18 0-6.72 3.4-6.72 7.68 0 5.09 3.06 7.74 7.27 7.74 2.05 0 3.61-.46 4.79-1.19v-3.32c-1.18.66-2.5 1.05-4.15 1.05-1.64 0-3.08-.63-3.29-2.48h8.31c0-.23.05-1.15.05-1.78zm-8.35-1.52c.07-1.72 1.05-2.41 2.12-2.41 1.05 0 2.01.69 2.08 2.41h-4.2zm-9.35-6.18h-4.32v15.17h4.32V6.58zm-2.17-5.06c1.47 0 2.47-.98 2.47-2.22C42.24.98 41.25 0 39.77 0c-1.48 0-2.48.98-2.48 2.22 0 1.24 1 2.22 2.48 2.22zm-7.9 5.06h-4.25v2.32c-.89-1.54-2.44-2.5-4.52-2.5-3.66 0-6.75 3.12-6.75 7.64 0 4.54 3.09 7.66 6.75 7.66 2.08 0 3.63-.96 4.52-2.5v2.38h4.25V6.58zm-4.32 7.46c0 2.5-1.73 4.2-3.8 4.2-2.06 0-3.79-1.7-3.79-4.2 0-2.49 1.73-4.19 3.79-4.19 2.07 0 3.8 1.7 3.8 4.19zm-13.6-7.46l-2.4 8.21-2.46-8.21h-4.63l4.63 12.39-4.21 2.78h4.63l8.77-15.17h-4.33zm-13.7 0c-1.07 0-2.02.44-2.73 1.15V6.58H0v20.48h4.32v-7.85c.71.71 1.66 1.15 2.73 1.15 3.32 0 6.07-2.82 6.07-6.89 0-4.08-2.75-6.89-6.07-6.89zm-.74 10.3c-2.07 0-3.64-1.56-3.64-3.41s1.57-3.41 3.64-3.41c2.08 0 3.65 1.56 3.65 3.41s-1.57 3.41-3.65 3.41z"/>
              </svg>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> PCI-DSS Level 1
            </span>
            <span className="text-gray-300 dark:text-zinc-700">•</span>
            <span className="font-medium text-gray-500 dark:text-zinc-400">
              Money-Back Terms
            </span>
          </div>
        </div>
      </div>
    </form>
  );
};

export function PaymentStep({ tenantId, amount, currency, stripeAccountId, onSuccess, onBack, onSkip, primaryColor, visitId, visitStepId, isDark }: PaymentStepProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [confirmingCounter, setConfirmingCounter] = useState(false);

  const stripePromise = useMemo(() => {
    if (!stripeAccountId) return null;
    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || FALLBACK_STRIPE_PK;
    return loadStripe(pk, { stripeAccount: stripeAccountId });
  }, [stripeAccountId]);

  const activeIntentError = !stripeAccountId
    ? 'Online card payment is currently unavailable. Please complete your booking and pay in person at the counter.'
    : intentError;

  const minRequiredCents = getCurrencyMinStripeCents(currency);
  const currSymbol = getCurrencySymbol(currency);
  const isUnderLimit = amount < minRequiredCents || Boolean(
    activeIntentError && (
      activeIntentError.toLowerCase().includes('below') ||
      activeIntentError.toLowerCase().includes('minimum') ||
      activeIntentError.toLowerCase().includes('threshold') ||
      activeIntentError.toLowerCase().includes('limit')
    )
  );

  const handlePayAtCounter = async () => {
    setConfirmingCounter(true);
    try {
      if (visitId) {
        await fetchApi('/public-visit/confirm-counter-payment', {
          method: 'POST',
          body: JSON.stringify({ visitIds: [visitId] })
        });
      }
      if (onSkip) {
        onSkip();
      } else {
        onSuccess('COUNTER_PAY');
      }
    } catch (err) {
      console.warn('Confirm counter payment fallback warning:', err);
      if (onSkip) {
        onSkip();
      } else {
        onSuccess('COUNTER_PAY');
      }
    } finally {
      setConfirmingCounter(false);
    }
  };

  const getSecret = useCallback(async () => {
    setIntentError(null);
    setIsRetrying(true);
    try {
      const res = await fetchApi('/tenant-payments/public/intent', {
        method: 'POST',
        body: JSON.stringify({ tenantId, amount, description: 'Booking Prepayment', visitId, visitStepId })
      });
      setClientSecret(res.clientSecret);
      setPaymentId(res.paymentId);
    } catch (err: unknown) {
      console.error("Failed to create payment intent", err);
      const msg = err instanceof Error ? err.message : 'Unable to initialize secure payment session.';
      setIntentError(msg);
    } finally {
      setIsRetrying(false);
    }
  }, [tenantId, amount, visitId, visitStepId]);

  useEffect(() => {
    if (tenantId && amount > 0 && stripeAccountId && amount >= minRequiredCents) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      getSecret();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, amount, stripeAccountId, visitId, visitStepId, minRequiredCents]);

  // Seamless fallback to Pay at Counter if amount is below minimum processing limit
  if (isUnderLimit) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-sm">
        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <CreditCard className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Pay at Counter
          </h2>
          <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
            Online card checkout is available for amounts of{' '}
            <span className="font-semibold text-gray-800 dark:text-zinc-200">
              {currSymbol}{(minRequiredCents / 100).toFixed(2)}
            </span>{' '}
            or higher. You can pay your balance upon arrival.
          </p>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700/60 mt-4 text-left flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-zinc-400 font-semibold">Total Due Upon Arrival</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Pay at service counter (Cash or Card)</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {currSymbol}{(amount / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handlePayAtCounter}
            disabled={confirmingCounter}
            className="w-full py-4 rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-[1.01] active:scale-98 flex items-center justify-center gap-2"
            style={{ backgroundColor: primaryColor }}
          >
            {confirmingCounter ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Confirming Booking...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Complete Booking (Pay at Counter)</span>
              </>
            )}
          </button>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={confirmingCounter}
              className="w-full py-3 rounded-xl font-semibold text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-1.5 text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  if (activeIntentError) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-6 text-center space-y-5">
        <div className="w-14 h-14 bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment Notice</h2>
          <p className="text-sm text-gray-600 dark:text-zinc-400 mt-2 bg-gray-50 dark:bg-zinc-800 p-3 rounded-xl border border-gray-200 dark:border-zinc-700">
            {activeIntentError}
          </p>
        </div>
        <div className="flex flex-col gap-2.5 pt-2">
          <button
            type="button"
            onClick={handlePayAtCounter}
            disabled={confirmingCounter}
            className="w-full py-3.5 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-sm"
            style={{ backgroundColor: primaryColor }}
          >
            {confirmingCounter ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Continue & Pay at Counter ({currSymbol}{(amount / 100).toFixed(2)})
          </button>

          {stripeAccountId && (
            <button
              type="button"
              onClick={getSecret}
              disabled={isRetrying}
              className="w-full py-3 rounded-xl font-semibold text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
            >
              {isRetrying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Retry Online Card Payment
            </button>
          )}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={confirmingCounter}
              className="w-full py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-zinc-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!clientSecret || !stripePromise) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: primaryColor }} />
        <p className="text-gray-500 font-medium">Preparing secure checkout...</p>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: isDark ? 'night' : 'stripe',
          variables: {
            colorPrimary: primaryColor || '#4f46e5',
            colorBackground: isDark ? '#18181b' : '#ffffff',
            colorText: isDark ? '#f4f4f5' : '#18181b',
            colorDanger: '#f43f5e',
            borderRadius: '12px',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          },
          rules: {
            '.Input': {
              backgroundColor: isDark ? '#09090b' : '#ffffff',
              borderColor: isDark ? '#27272a' : '#e4e4e7',
            },
            '.Input:focus': {
              borderColor: primaryColor || '#6366f1',
            },
            '.Tab': {
              backgroundColor: isDark ? '#18181b' : '#ffffff',
              borderColor: isDark ? '#27272a' : '#e4e4e7',
            },
            '.Tab--selected': {
              borderColor: primaryColor || '#6366f1',
              backgroundColor: isDark ? '#27272a' : '#f4f4f5',
            },
          },
        },
      }}
    >
      <CheckoutForm
        onSuccess={onSuccess}
        onBack={onBack}
        onSkip={onSkip}
        primaryColor={primaryColor}
        paymentId={paymentId || ''}
        amount={amount}
        currency={currency}
        isDark={isDark}
      />
    </Elements>
  );
}
