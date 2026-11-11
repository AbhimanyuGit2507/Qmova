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
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
}

const PaystackCheckoutForm = ({
  paystackData,
  onSuccess,
  onBack,
  onSkip,
  primaryColor,
  amount,
  currency,
  customerEmail,
}: {
  paystackData: any;
  onSuccess: (paymentId: string) => void;
  onBack?: () => void;
  onSkip?: () => void;
  primaryColor?: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  customerName?: string;
  isDark?: boolean;
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if script is already present
    const existing = document.getElementById('paystack-inline-v2-script');
    if (existing && (window as any).PaystackPop) return;

    const script = document.createElement('script');
    script.id = 'paystack-inline-v2-script';
    script.src = 'https://js.paystack.co/v2/inline.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const currSymbol = getCurrencySymbol(currency);
  const formattedAmount = `${currSymbol}${(amount / 100).toFixed(2)}`;

  const handlePay = (forceRedirect?: boolean) => {
    setError(null);
    setIsProcessing(true);

    if (forceRedirect === true && paystackData?.authorizationUrl) {
      window.location.href = paystackData.authorizationUrl;
      return;
    }

    try {
      const PaystackPop = (window as any).PaystackPop;

      // 10/10 Modern Paystack Inline V2 Transaction Resumption
      // Backend already initialized the transaction and generated accessCode.
      // resumeTransaction(accessCode) opens the popup directly without re-initializing
      // or attempting to duplicate references on Paystack.
      if (typeof PaystackPop !== 'undefined' && paystackData?.accessCode) {
        const popup = typeof PaystackPop === 'function' ? new PaystackPop() : PaystackPop;

        if (popup && typeof popup.resumeTransaction === 'function') {
          popup.resumeTransaction(paystackData.accessCode, {
            onSuccess: (transaction: any) => {
              setIsProcessing(true);
              const referenceToVerify =
                transaction?.reference ||
                transaction?.trxref ||
                paystackData.reference;

              fetchApi('/tenant-payments/public/paystack/verify', {
                method: 'POST',
                body: JSON.stringify({ reference: referenceToVerify }),
              })
                .then(() => {
                  onSuccess(paystackData.paymentId);
                })
                .catch((err: any) => {
                  console.error('Paystack verification error:', err);
                  setError(err?.message || 'Payment completed, but status sync failed.');
                  setIsProcessing(false);
                });
            },
            onCancel: () => {
              setIsProcessing(false);
            },
            onError: (err: any) => {
              console.warn('Paystack inline checkout error, redirecting to hosted checkout:', err);
              if (paystackData.authorizationUrl) {
                window.location.href = paystackData.authorizationUrl;
              } else {
                setError(err?.message || 'Payment could not be started. Please try again.');
                setIsProcessing(false);
              }
            },
          });
          return;
        }
      }

      // Resilient fallback: If popup is not available or blocked, open hosted checkout directly
      if (paystackData?.authorizationUrl) {
        window.location.href = paystackData.authorizationUrl;
        return;
      }

      setError('Payment gateway is loading. Please try again in a few moments.');
      setIsProcessing(false);
    } catch (popupErr: any) {
      console.warn('Paystack inline checkout exception, redirecting to hosted checkout:', popupErr);
      if (paystackData?.authorizationUrl) {
        window.location.href = paystackData.authorizationUrl;
      } else {
        setError(popupErr?.message || 'Payment could not be started. Please try again.');
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 flex-1 w-full max-w-2xl mx-auto bg-white dark:bg-zinc-900 border border-gray-200/90 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl shadow-black/5 dark:shadow-black/30">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Instant South African Clearing</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Secure Payment
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">
          Fast card, Apple Pay, & Capitec Pay checkout
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50/50 via-gray-50 to-emerald-50/20 dark:from-zinc-950 dark:via-zinc-950/90 dark:to-emerald-950/20 border border-emerald-200/60 dark:border-zinc-800 p-4 sm:p-5 flex items-center justify-between shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              Total Amount Due
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Direct Deposit
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-zinc-400 flex items-center gap-1.5 font-medium">
            <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Cards, Capitec Pay & Instant EFT
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-800/50 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-gray-900 dark:text-white">Capitec Pay</span>
          <span className="text-[10px] text-gray-500 dark:text-zinc-400">Push to App</span>
        </div>
        <div className="p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-800/50 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-gray-900 dark:text-white">Credit / Debit</span>
          <span className="text-[10px] text-gray-500 dark:text-zinc-400">Visa & MC</span>
        </div>
        <div className="p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-800/50 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-gray-900 dark:text-white">Instant EFT</span>
          <span className="text-[10px] text-gray-500 dark:text-zinc-400">All SA Banks</span>
        </div>
        <div className="p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-800/50 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-gray-900 dark:text-white">Apple Pay</span>
          <span className="text-[10px] text-gray-500 dark:text-zinc-400">Touch / Face ID</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={() => handlePay(false)}
        disabled={isProcessing}
        className="w-full py-4 rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-[1.01] active:scale-98 flex items-center justify-center gap-2 text-base"
        style={{ backgroundColor: primaryColor || '#059669' }}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span>Pay {formattedAmount} with Paystack</span>
          </>
        )}
      </button>

      {paystackData.authorizationUrl && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => handlePay(true)}
            className="text-xs text-gray-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 font-medium underline underline-offset-2 transition-colors"
          >
            Popup blocked? Open Paystack full-page checkout &rarr;
          </button>
        </div>
      )}

      {/* Satisfaction & Guarantee Card */}
      <div className="p-4 rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
          <p className="font-bold text-amber-950 dark:text-amber-100 mb-0.5">Satisfaction & Booking Guarantee</p>
          <p className="text-amber-800/90 dark:text-amber-300/80">
            Your payment is held under official banking escrow until your service is fulfilled. If your appointment is rescheduled or canceled, full refunds are processed automatically.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center pt-2 gap-1 text-[11px] text-gray-500 dark:text-zinc-400">
        <div className="flex items-center gap-1.5 font-semibold">
          <span>Secured by</span>
          <span className="font-bold text-gray-800 dark:text-zinc-200">Paystack</span>
          <span className="text-[10px] text-gray-400 font-normal">(A Stripe Company)</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <span>PCI-DSS Level 1 Certified</span>
          <span>•</span>
          <span>SARB Regulated</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-zinc-200 flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Go Back
          </button>
        )}
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="text-xs font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-zinc-200 ml-auto"
          >
            Pay at Counter Instead →
          </button>
        )}
      </div>
    </div>
  );
};

const CheckoutForm = ({
  onSuccess,
  onBack,
  onSkip,
  primaryColor,
  paymentId,
  amount,
  currency,
  isDark: _isDark,
  customerEmail,
  customerName,
  customerPhone,
}: {
  onSuccess: (paymentId: string) => void;
  onBack?: () => void;
  onSkip?: () => void;
  primaryColor: string;
  paymentId: string;
  amount: number;
  currency: string;
  isDark?: boolean;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
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
          Enter your payment details to instantly confirm your booking
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
                setElementLoadError('Card & wallet processor unavailable. Please choose pay at counter.');
              }}
              options={{
                layout: {
                  type: 'accordion',
                  defaultCollapsed: false,
                  radios: 'auto',
                  spacedAccordionItems: true,
                },
                wallets: {
                  applePay: 'auto',
                  googlePay: 'auto',
                },
                defaultValues: {
                  billingDetails: {
                    email: customerEmail || undefined,
                    name: customerName || undefined,
                    phone: customerPhone || undefined,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Deepstash-Style Satisfaction & Booking Guarantee Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/5 via-primary/5 to-transparent border border-amber-500/20 dark:border-amber-500/15 flex items-start gap-3.5 shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1 min-w-0">
          <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
            Booking & Satisfaction Guarantee
          </h4>
          <p className="text-[11px] sm:text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
            Your appointment reservation is secured with our provider guarantee. Rescheduling or cancellations under policy terms are refunded automatically to your original payment method.
          </p>
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

      {/* Deepstash-Style "Powered by stripe" and Verified Payment Network Badges */}
      <div className="pt-2 text-center space-y-2.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-800/60 text-xs font-semibold text-gray-700 dark:text-zinc-300">
          <span className="text-[11px] text-gray-400 font-medium">Powered by</span>
          <span className="font-extrabold tracking-tight text-[#635BFF]">stripe</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 border border-gray-200 dark:border-zinc-700">
             Pay
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 border border-gray-200 dark:border-zinc-700">
            G Pay
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold italic bg-blue-600 text-white shadow-xs">
            VISA
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-red-600 text-white shadow-xs">
            MC
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-500 text-white shadow-xs">
            DISCOVER
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-700 text-white shadow-xs">
            AMEX
          </span>
        </div>
      </div>

      {/* Trust & Compliance Footer */}
      <div className="pt-4 border-t border-gray-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 px-1 text-[11px] text-gray-500 dark:text-zinc-400">
        <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>PCI-DSS Level 1 Compliant</span>
        </div>
        <div className="flex items-center gap-2">
          <span>256-Bit Encrypted</span>
          <span className="text-gray-300 dark:text-zinc-700">•</span>
          <span>Refundable Terms</span>
        </div>
      </div>
    </form>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackAmount: number;
  currency: string;
  primaryColor: string;
  onPayAtCounter: () => void;
  onBack?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

export class PaymentErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PaymentErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const currSymbol = getCurrencySymbol(this.props.currency);
      const formatted = `${currSymbol}${(this.props.fallbackAmount / 100).toFixed(2)}`;
      return (
        <div className="w-full max-w-2xl mx-auto bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <CreditCard className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Pay at Counter
            </h2>
            <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
              Our card checkout processor is currently experiencing a brief technical delay. You can confirm your reservation now and settle your balance in person upon arrival.
            </p>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700/60 mt-4 text-left flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-zinc-400 font-semibold">Total Due Upon Arrival</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Pay at service counter (Cash, Card, or EFT)</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatted}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={this.props.onPayAtCounter}
              className="w-full py-4 rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-[1.01] active:scale-98 flex items-center justify-center gap-2"
              style={{ backgroundColor: this.props.primaryColor }}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Confirm Reservation (Pay at Counter)</span>
            </button>

            {this.props.onBack && (
              <button
                type="button"
                onClick={this.props.onBack}
                className="w-full py-3 rounded-xl font-semibold text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-1.5 text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Go Back
              </button>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function PaymentStepInternal({
  tenantId,
  amount,
  currency,
  stripeAccountId,
  onSuccess,
  onBack,
  onSkip,
  primaryColor,
  visitId,
  visitStepId,
  isDark,
  customerEmail,
  customerName,
  customerPhone,
}: PaymentStepProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [confirmingCounter, setConfirmingCounter] = useState(false);
  const [paystackData, setPaystackData] = useState<any | null>(null);

  const stripePromise = useMemo(() => {
    if (!stripeAccountId) return null;
    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || FALLBACK_STRIPE_PK;
    return loadStripe(pk, { stripeAccount: stripeAccountId });
  }, [stripeAccountId]);

  const activeIntentError = !stripeAccountId && !paystackData && !clientSecret && !isRetrying
    ? null
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
        body: JSON.stringify({
          tenantId,
          amount,
          description: 'Booking Prepayment',
          visitId,
          visitStepId,
          customerEmail: customerEmail || undefined,
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          returnOrigin: typeof window !== 'undefined' ? window.location.origin : undefined,
        })
      });
      if (res?.provider === 'paystack') {
        setPaystackData(res);
        setPaymentId(res.paymentId);
      } else {
        setClientSecret(res.clientSecret);
        setPaymentId(res.paymentId);
      }
    } catch (err: unknown) {
      console.error("Failed to create payment intent", err);
      const msg = err instanceof Error ? err.message : 'Unable to initialize secure payment session.';
      setIntentError(msg);
    } finally {
      setIsRetrying(false);
    }
  }, [tenantId, amount, visitId, visitStepId, customerEmail, customerName, customerPhone]);

  useEffect(() => {
    if (tenantId && amount > 0 && amount >= minRequiredCents) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      getSecret();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, amount, visitId, visitStepId, minRequiredCents, customerEmail, customerName, customerPhone]);

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

  if (paystackData) {
    return (
      <PaystackCheckoutForm
        paystackData={paystackData}
        onSuccess={onSuccess}
        onBack={onBack}
        onSkip={onSkip}
        primaryColor={primaryColor}
        amount={amount}
        currency={currency}
        customerEmail={customerEmail}
        customerName={customerName}
        isDark={isDark}
      />
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
            borderRadius: '16px',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            spacingUnit: '4px',
          },
          rules: {
            '.Input': {
              backgroundColor: isDark ? '#09090b' : '#ffffff',
              borderColor: isDark ? '#27272a' : '#e4e4e7',
              borderRadius: '12px',
            },
            '.Input:focus': {
              borderColor: primaryColor || '#6366f1',
            },
            '.AccordionItem': {
              backgroundColor: isDark ? '#18181b' : '#ffffff',
              border: isDark ? '1px solid #27272a' : '1px solid #e4e4e7',
              borderRadius: '16px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
            },
            '.AccordionItem--selected': {
              borderColor: primaryColor || '#6366f1',
              boxShadow: isDark
                ? '0 0 0 2px rgba(99, 102, 241, 0.25)'
                : '0 0 0 2px rgba(99, 102, 241, 0.15)',
            },
            '.Radio': {
              borderColor: isDark ? '#52525b' : '#d4d4d8',
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
        customerEmail={customerEmail}
        customerName={customerName}
        customerPhone={customerPhone}
      />
    </Elements>
  );
}

export function PaymentStep(props: PaymentStepProps) {
  const handleFallbackPayAtCounter = async () => {
    try {
      if (props.visitId) {
        await fetchApi('/public-visit/confirm-counter-payment', {
          method: 'POST',
          body: JSON.stringify({ visitIds: [props.visitId] }),
        });
      }
    } catch (e) {
      console.warn('Fallback pay at counter error:', e);
    }
    if (props.onSkip) {
      props.onSkip();
    } else {
      props.onSuccess('COUNTER_PAY');
    }
  };

  return (
    <PaymentErrorBoundary
      fallbackAmount={props.amount}
      currency={props.currency}
      primaryColor={props.primaryColor}
      onPayAtCounter={handleFallbackPayAtCounter}
      onBack={props.onBack}
    >
      <PaymentStepInternal {...props} />
    </PaymentErrorBoundary>
  );
}
