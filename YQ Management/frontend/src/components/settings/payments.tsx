import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  CreditCard, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2,
  Landmark,
  Building2,
  Lock,
  ArrowRight,
  Check,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { toast } from 'sonner';
import { ConfirmModal } from '../modals/ConfirmModal';

interface SouthAfricanBank {
  name: string;
  code: string;
  slug: string;
}

const DEFAULT_SA_BANKS: SouthAfricanBank[] = [
  { name: 'Capitec Bank', code: '679000', slug: 'capitec-bank' },
  { name: 'First National Bank (FNB)', code: '250655', slug: 'fnb' },
  { name: 'Standard Bank', code: '051001', slug: 'standard-bank' },
  { name: 'Nedbank', code: '198765', slug: 'nedbank' },
  { name: 'Absa Bank', code: '632005', slug: 'absa' },
  { name: 'TymeBank', code: '678910', slug: 'tymebank' },
  { name: 'Discovery Bank', code: '679910', slug: 'discovery-bank' },
  { name: 'Investec Bank', code: '580105', slug: 'investec-bank' },
  { name: 'African Bank', code: '430000', slug: 'african-bank' },
  { name: 'Bidvest Bank', code: '462005', slug: 'bidvest-bank' },
  { name: 'Sasfin Bank', code: '683000', slug: 'sasfin-bank' },
];

export default function PaymentsSettings() {
  const [activeTab, setActiveTab] = useState<'paystack' | 'stripe'>('paystack');
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  
  // Paystack Bank Form State
  const [selectedBankCode, setSelectedBankCode] = useState('679000'); // Default Capitec
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);

  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ['tenant-payment-status'],
    queryFn: () => fetchApi('/tenant-payments/status'),
  });

  const { data: banksData } = useQuery<SouthAfricanBank[]>({
    queryKey: ['sa-banks-list'],
    queryFn: () => fetchApi('/tenant-payments/banks'),
    initialData: DEFAULT_SA_BANKS,
  });

  const banks = banksData && banksData.length > 0 ? banksData : DEFAULT_SA_BANKS;

  // Set active tab based on active provider once loaded
  React.useEffect(() => {
    if (status?.provider === 'stripe' && status?.accountId) {
      setActiveTab('stripe');
    } else if (status?.provider === 'paystack') {
      setActiveTab('paystack');
    }
  }, [status?.provider, status?.accountId]);

  // Verify SA Bank Account
  const handleVerifyBank = async () => {
    if (!accountNumber || accountNumber.length < 6) {
      toast.error('Please enter a valid South African bank account number');
      return;
    }
    setIsVerifying(true);
    try {
      const res = await fetchApi('/tenant-payments/paystack/verify-bank', {
        method: 'POST',
        body: JSON.stringify({
          accountNumber: accountNumber.trim(),
          bankCode: selectedBankCode,
        }),
      });
      if (res.accountName) {
        setVerifiedName(res.accountName);
        if (!accountHolderName) {
          setAccountHolderName(res.accountName);
        }
        toast.success(`Account verified: ${res.accountName}`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Could not verify bank account details');
    } finally {
      setIsVerifying(false);
    }
  };

  // Connect Paystack Bank Mutation
  const connectPaystackMutation = useMutation({
    mutationFn: () => {
      const bank = banks.find((b) => b.code === selectedBankCode);
      return fetchApi('/tenant-payments/paystack/connect', {
        method: 'POST',
        body: JSON.stringify({
          bankCode: selectedBankCode,
          bankName: bank?.name || 'South African Bank',
          accountNumber: accountNumber.trim(),
          accountName: accountHolderName || verifiedName || 'Business Account',
        }),
      });
    },
    onSuccess: (data: any) => {
      toast.success('South African bank account successfully connected for direct payouts!');
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to connect bank account for payouts');
    },
  });

  // Reset Paystack Mutation
  const resetPaystackMutation = useMutation({
    mutationFn: () => fetchApi('/tenant-payments/paystack/reset', { method: 'POST' }),
    onSuccess: () => {
      toast.success('Payout bank account disconnected.');
      setAccountNumber('');
      setAccountHolderName('');
      setVerifiedName(null);
      refetch();
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to disconnect account'),
  });

  // Stripe Mutations
  const connectStripeMutation = useMutation({
    mutationFn: () => fetchApi('/tenant-payments/connect', { method: 'POST' }),
    onSuccess: (data: { url?: string }) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.success('Successfully refreshed Stripe connection');
        refetch();
      }
    },
    onError: () => toast.error('Failed to initiate Stripe connection'),
  });

  const resetStripeMutation = useMutation({
    mutationFn: () => fetchApi('/tenant-payments/reset', { method: 'POST' }),
    onSuccess: () => {
      toast.success('Stripe connection reset. You can now connect a new account.');
      refetch();
    },
    onError: () => toast.error('Failed to reset Stripe connection'),
  });

  const isPaystackActive = status?.provider === 'paystack' && status?.status === 'ENABLED';
  const isStripeActive = status?.provider === 'stripe' && status?.accountId && status?.status === 'ENABLED';

  return (
    <div className="w-full space-y-6">
      {/* ── Provider Mode Switcher Tabs ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-surface dark:bg-dark-surface p-2 rounded-2xl border border-border dark:border-dark-border">
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-zinc-800/80 rounded-xl">
          <button
            onClick={() => setActiveTab('paystack')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'paystack'
                ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>🇿🇦 South Africa Direct Payout</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Recommended
            </span>
          </button>
          <button
            onClick={() => setActiveTab('stripe')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'stripe'
                ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>🌍 International (Stripe Connect)</span>
          </button>
        </div>

        {/* Status Pill Indicator */}
        <div className="px-3 py-1 flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Gateway: {status?.provider === 'paystack' ? 'Paystack South Africa' : status?.provider === 'stripe' ? 'Stripe Connect' : 'Not Connected'}</span>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: PAYSTACK SOUTH AFRICA DIRECT BANK PAYOUTS                            */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'paystack' && (
        <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 sm:p-8 border-b border-border dark:border-dark-border bg-surface-container-low dark:bg-dark-card flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Landmark className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    South Africa Direct Bank Payouts
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> No Gateway Account Needed
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
                  Accept cards, Apple Pay, and <strong>Capitec Pay / Instant EFT</strong> from your customers. Payouts are deposited directly into your South African bank account daily.
                </p>
              </div>
            </div>

            {isPaystackActive && (
              <button
                onClick={() => setIsDisconnectModalOpen(true)}
                disabled={resetPaystackMutation.isPending}
                className="text-xs text-red-600 dark:text-red-400 hover:underline shrink-0 font-medium"
              >
                {resetPaystackMutation.isPending ? 'Disconnecting...' : 'Switch Bank Account'}
              </button>
            )}
          </div>

          <div className="p-6 sm:p-8">
            {isLoading ? (
              <div className="flex items-center gap-3 text-gray-500 dark:text-zinc-400 py-6">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Loading payout account status...</span>
              </div>
            ) : isPaystackActive ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-sm font-semibold border border-emerald-200 dark:border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" /> Active & Receiving Customer Payments
                  </div>
                  <span className="text-xs font-mono bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 px-2.5 py-1 rounded-md border border-gray-200 dark:border-zinc-700">
                    Subaccount: {status.accountId}
                  </span>
                </div>

                {/* Bank Card Display */}
                <div className="p-5 rounded-2xl border border-border dark:border-dark-border bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/10 dark:from-zinc-900 dark:via-zinc-900 dark:to-emerald-950/20 max-w-xl">
                  <div className="flex items-center justify-between pb-4 border-b border-border/80 dark:border-dark-border/80">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Primary Payout Bank
                      </p>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                        {status.bankName || 'South African Bank'}
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Landmark className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">Account Number</p>
                      <p className="font-mono font-bold text-gray-900 dark:text-white mt-0.5">
                        {status.accountNumberMasked || '••••••••'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">Account Holder</p>
                      <p className="font-semibold text-gray-900 dark:text-white mt-0.5 truncate">
                        {status.accountName || 'Verified Tenant'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/60 dark:border-dark-border/60 flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                      <Check className="w-3.5 h-3.5" /> Direct Payouts Active (ZAR)
                    </span>
                    <span>Daily Automated Settlement</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 text-xs text-gray-500 dark:text-zinc-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Secured by Paystack (A Stripe Company). Deposits are cleared directly by the South African Reserve Bank network.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-w-xl">
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs sm:text-sm text-gray-700 dark:text-zinc-300 space-y-1.5">
                  <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Zero Third-Party Registration Required
                  </p>
                  <p className="leading-relaxed text-gray-600 dark:text-zinc-400">
                    Unlike international gateways, you do not need to register a separate merchant account. Simply enter your local South African bank account below to begin accepting customer payments immediately.
                  </p>
                </div>

                {/* Bank Select Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-2">
                      Select Your South African Bank
                    </label>
                    <div className="relative">
                      <select
                        value={selectedBankCode}
                        onChange={(e) => {
                          setSelectedBankCode(e.target.value);
                          setVerifiedName(null);
                        }}
                        className="w-full appearance-none px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10"
                      >
                        {banks.map((b) => (
                          <option key={b.code} value={b.code}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-2">
                      Account Number
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => {
                          setAccountNumber(e.target.value);
                          setVerifiedName(null);
                        }}
                        placeholder="e.g. 1054893201"
                        className="flex-1 px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyBank}
                        disabled={isVerifying || !accountNumber}
                        className="px-4 py-3 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-xs font-bold text-gray-800 dark:text-zinc-200 rounded-xl transition-colors shrink-0 disabled:opacity-50"
                      >
                        {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify'}
                      </button>
                    </div>
                  </div>

                  {verifiedName && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-semibold">
                      <span>Verified: {verifiedName}</span>
                      <Check className="w-4 h-4" />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-2">
                      Account Holder / Business Name
                    </label>
                    <input
                      type="text"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="e.g. All-American Burger Co."
                      className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => connectPaystackMutation.mutate()}
                    disabled={connectPaystackMutation.isPending || !accountNumber}
                    className="w-full mt-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    {connectPaystackMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Connecting Bank Account...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Enable Instant Direct Payouts</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: STRIPE CONNECT (INTERNATIONAL)                                       */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'stripe' && (
        <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 sm:p-8 border-b border-border dark:border-dark-border bg-surface-container-low dark:bg-dark-card flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#635BFF]/10 rounded-xl flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6 text-[#635BFF]" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Stripe Connect
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                    ● Global Standard
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
                  Accept international credit cards, Apple Pay, and Google Pay from worldwide customers into your registered Stripe entity.
                </p>
              </div>
            </div>
            {isStripeActive && (
              <button
                onClick={() => setIsDisconnectModalOpen(true)}
                disabled={resetStripeMutation.isPending}
                className="text-xs text-red-600 dark:text-red-400 hover:underline shrink-0 font-medium"
              >
                {resetStripeMutation.isPending ? 'Resetting...' : 'Disconnect Account'}
              </button>
            )}
          </div>

          <div className="p-6 sm:p-8">
            {isLoading ? (
              <div className="flex items-center gap-3 text-gray-500 dark:text-zinc-400 py-6">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Loading payment account status...</span>
              </div>
            ) : !isStripeActive ? (
              <div className="flex flex-col items-start gap-6">
                <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-500/10 p-4 rounded-xl text-blue-700 dark:text-blue-300 w-full text-sm">
                  <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">Stripe Connect Compliance</p>
                    <p>Requires an incorporated business entity in Stripe-supported regions (US, UK, Europe, etc.). For South Africa, prefer the Direct Payout tab.</p>
                  </div>
                </div>

                <button
                  onClick={() => connectStripeMutation.mutate()}
                  disabled={connectStripeMutation.isPending}
                  className="flex items-center gap-2 px-6 py-3 bg-[#635BFF] hover:bg-[#5249EC] disabled:opacity-50 text-white rounded-xl font-semibold shadow-md shadow-[#635BFF]/20 transition-all text-sm"
                >
                  {connectStripeMutation.isPending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                  Connect with Stripe
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-sm font-semibold border border-emerald-200 dark:border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" /> Active & Receiving Payments
                  </div>
                  <span className="text-sm text-gray-500 dark:text-zinc-500 font-mono bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">
                    {status.accountId}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                  <div className="p-4 rounded-xl border border-border dark:border-dark-border bg-gray-50 dark:bg-black/30 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">Accepting Payments</p>
                      <p className="font-bold text-gray-900 dark:text-white mt-1">
                        {status.chargesEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                    {status.chargesEnabled ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                  
                  <div className="p-4 rounded-xl border border-border dark:border-dark-border bg-gray-50 dark:bg-black/30 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">Bank Payouts</p>
                      <p className="font-bold text-gray-900 dark:text-white mt-1">
                        {status.payoutsEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                    {status.payoutsEnabled ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border dark:border-dark-border flex items-center justify-between">
                  <a 
                    href={status.isTestMode ? "https://dashboard.stripe.com/test" : "https://dashboard.stripe.com"} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-[#635BFF] hover:text-[#5249EC] font-semibold"
                  >
                    Go to Stripe Dashboard <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Disconnect Modal */}
      <ConfirmModal
        isOpen={isDisconnectModalOpen}
        onClose={() => setIsDisconnectModalOpen(false)}
        onConfirm={() => {
          if (activeTab === 'paystack') {
            resetPaystackMutation.mutate();
          } else {
            resetStripeMutation.mutate();
          }
          setIsDisconnectModalOpen(false);
        }}
        title="Disconnect Payout Account?"
        description="Disconnecting your account will pause online card and bank checkout on your public booking forms until a new bank account is linked."
        confirmText="Disconnect Account"
        isDanger={true}
      />
    </div>
  );
}
