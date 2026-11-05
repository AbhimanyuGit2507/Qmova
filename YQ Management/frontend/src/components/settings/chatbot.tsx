import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { FeatureGuard } from '../guards/FeatureGuard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../lib/api';
import { toast } from 'sonner';
import { 
  Bot, Save, Loader2, Sparkles, Zap, Calendar, CreditCard, 
  Smartphone, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight,
  Clock, ShieldAlert, Check, RefreshCw, MessageSquare
} from 'lucide-react';
import { Button } from '../ui/button';

interface ChatbotConfig {
  botName: string;
  agentName: string;
  welcomeMessage: string;
  booking: {
    enabled: boolean;
    mode: 'BOTH' | 'WALKIN_ONLY' | 'APPOINTMENT_ONLY';
    requireName: boolean;
    offerMenuAddons: boolean;
  };
  payments: {
    enabled: boolean;
    mode: 'BOTH' | 'STRIPE_ONLY' | 'COUNTER_ONLY';
    requirePaymentForBooking: boolean;
  };
  quickReplies: {
    status: boolean;
    cancel: boolean;
    human: boolean;
    booking: boolean;
    checkin: boolean;
    pay: boolean;
  };
  sessionTimeoutMinutes: number;
  humanHandoverHours: number;
}

export default function ChatbotSettings() {
  const queryClient = useQueryClient();
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', 'me'],
    queryFn: () => fetchApi('/tenant/me'),
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => fetchApi('/staff'),
  });

  const { data: paymentStatus } = useQuery({
    queryKey: ['tenant-payment-status'],
    queryFn: () => fetchApi('/tenant-payments/status'),
  });

  const [chatbotEnabled, setChatbotEnabled] = useState(false);
  const [config, setConfig] = useState<ChatbotConfig>({
    botName: 'Qmova Assistant',
    agentName: 'Support Team',
    welcomeMessage: 'Hi there! I am your automated assistant. How can I help you today?',
    booking: {
      enabled: true,
      mode: 'BOTH',
      requireName: true,
      offerMenuAddons: true,
    },
    payments: {
      enabled: true,
      mode: 'BOTH',
      requirePaymentForBooking: false,
    },
    quickReplies: {
      status: true,
      cancel: true,
      human: true,
      booking: true,
      checkin: true,
      pay: true,
    },
    sessionTimeoutMinutes: 30,
    humanHandoverHours: 12,
  });

  useEffect(() => {
    if (tenant) {
      setChatbotEnabled(tenant.chatbotEnabled ?? false);
      if (tenant.chatbotConfig) {
        const c = tenant.chatbotConfig as any;
        setConfig({
          botName: c.botName || 'Qmova Assistant',
          agentName: c.agentName || 'Support Team',
          welcomeMessage: c.welcomeMessage || 'Hi there! I am your automated assistant. How can I help you today?',
          booking: {
            enabled: c.booking?.enabled ?? (c.quickReplies?.booking !== false),
            mode: c.booking?.mode || 'BOTH',
            requireName: c.booking?.requireName ?? true,
            offerMenuAddons: c.booking?.offerMenuAddons ?? true,
          },
          payments: {
            enabled: c.payments?.enabled ?? true,
            mode: c.payments?.mode || 'BOTH',
            requirePaymentForBooking: c.payments?.requirePaymentForBooking ?? false,
          },
          quickReplies: {
            status: c.quickReplies?.status !== false,
            cancel: c.quickReplies?.cancel !== false,
            human: c.quickReplies?.human !== false,
            booking: c.quickReplies?.booking !== false,
            checkin: c.quickReplies?.checkin ?? true,
            pay: c.quickReplies?.pay ?? true,
          },
          sessionTimeoutMinutes: Number(c.sessionTimeoutMinutes) || 30,
          humanHandoverHours: Number(c.humanHandoverHours) || 12,
        });
      }
    }
  }, [tenant]);

  const updateMutation = useMutation({
    mutationFn: (data: AnyFixMe) => fetchApi(`/tenant/${tenant?.id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'me'] });
      toast.success('WhatsApp Chatbot settings saved successfully');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const handleSave = () => {
    updateMutation.mutate({
      chatbotEnabled,
      chatbotConfig: config,
    });
  };

  // Generate real-time menu lines for the Phone Simulator
  const simulatedMenu = useMemo(() => {
    let index = 1;
    const lines: string[] = [];
    if (config.quickReplies.status) lines.push(`${index++}. Check Status`);
    if (config.quickReplies.human) lines.push(`${index++}. Chat with Human`);
    if (config.quickReplies.booking && config.booking.enabled) lines.push(`${index++}. Book a Service / Join Line`);
    if (config.quickReplies.checkin) lines.push(`${index++}. Appointment Check-In`);
    if (config.quickReplies.pay) lines.push(`${index++}. Pay Outstanding Balance`);
    if (config.quickReplies.cancel) lines.push(`${index++}. Cancel Ticket`);
    return lines;
  }, [config.quickReplies, config.booking.enabled]);

  const stripeActive = Boolean(paymentStatus?.chargesEnabled);

  return (
    <div id="chatbot-settings" className="bg-card dark:bg-dark-card rounded-[24px] border border-border dark:border-dark-border shadow-sm p-6 sm:p-8 relative overflow-hidden mb-8 transition-all duration-300">
      
      {/* ── Top Header & WhatsApp Connection Status ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b border-border dark:border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">AI Assistant & WhatsApp Chatbot</h2>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Configure conversational bookings, automated Stripe checkout links, and quick replies.</p>
        </div>

        {/* WhatsApp Health Status Pill */}
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2.5 text-xs font-semibold ${
            tenant?.whatsappConnected 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            <span className={`w-2 h-2 rounded-full ${tenant?.whatsappConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {tenant?.whatsappConnected ? (
              <span>Session Active: <strong>{tenant.whatsappPhone || 'Paired'}</strong></span>
            ) : (
              <span>WhatsApp Disconnected</span>
            )}
          </div>

          {!tenant?.whatsappConnected && (
            <Link href="/dashboard/settings/integrations" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              Connect Instance <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      <FeatureGuard 
        featureKey="whatsappChatbot" 
        featureName="AI WhatsApp Chatbot" 
        description="Automate your waiting room with a 2-way conversational bot that handles service bookings, status checks, cancellations, and payments."
      >
        {isLoading ? (
          <div className="flex justify-center items-center py-12 text-zinc-400">
            <Loader2 strokeWidth={1.5} className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Master Bot Enable Toggle Card */}
            <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/80 border border-border dark:border-white/10 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${chatbotEnabled ? 'bg-primary/10 text-primary' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'}`}>
                  <Bot strokeWidth={1.5} className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Enable WhatsApp Chatbot
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Allows the bot to parse and respond to inbound WhatsApp messages on your business line.</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={chatbotEnabled}
                  onChange={(e) => {
                    const newValue = e.target.checked;
                    setChatbotEnabled(newValue);
                    updateMutation.mutate({
                      chatbotEnabled: newValue,
                      chatbotConfig: config,
                    });
                  }}
                  className="sr-only peer" 
                />
                <div className="w-14 h-7 bg-zinc-300 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-primary dark:peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Main Content Area: 2-Column Split (Settings on Left, Live Simulator on Right) */}
            <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 transition-opacity duration-300 ${!chatbotEnabled ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              
              {/* ── LEFT COLUMN: Configuration Controls (8 Cols) ── */}
              <div className="lg:col-span-7 space-y-8">
                
                {/* 1. Chatbot Persona */}
                <section className="bg-zinc-50 dark:bg-zinc-900/60 border border-border dark:border-white/10 p-6 rounded-3xl shadow-sm space-y-5">
                  <div className="flex items-center gap-2 pb-3 border-b border-border dark:border-white/10">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Bot Persona & Identity</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">Bot Display Name</label>
                      <input
                        type="text"
                        value={config.botName}
                        onChange={(e) => setConfig({ ...config, botName: e.target.value })}
                        className="w-full h-11 px-4 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary shadow-sm font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">Fallback Human Agent</label>
                      <select
                        value={config.agentName}
                        onChange={(e) => setConfig({ ...config, agentName: e.target.value })}
                        className="w-full h-11 px-4 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                      >
                        <option value="Support Team">Support Team (Default)</option>
                        {staffList.map((staff: AnyFixMe) => (
                          <option key={staff.id} value={staff.name || staff.email}>
                            {staff.name || staff.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">Welcome Message / Greeting</label>
                    <textarea
                      value={config.welcomeMessage}
                      onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                      rows={3}
                      className="w-full p-3.5 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary shadow-sm resize-none leading-relaxed"
                    />
                    <p className="text-[11px] text-zinc-400">Delivered when a customer initiates an unsolicited WhatsApp conversation.</p>
                  </div>
                </section>

                {/* 2. Self-Service Booking System on WhatsApp */}
                <section className="bg-zinc-50 dark:bg-zinc-900/60 border border-border dark:border-white/10 p-6 rounded-3xl shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-border dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Service Bookings via WhatsApp</h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Rule-Based Engine
                    </span>
                  </div>

                  {/* Booking Master Switch */}
                  <label className="flex items-start justify-between p-4 bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-white/5 rounded-2xl cursor-pointer hover:border-emerald-500/40 transition-colors">
                    <div className="pr-4">
                      <span className="text-sm font-bold text-gray-900 dark:text-white block">Allow Service Booking & Queue Joining</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 block mt-0.5">
                        Customers can choose location, select service, pick dates/times, and enter their name directly in WhatsApp.
                      </span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={config.booking.enabled} 
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        setConfig({
                          ...config,
                          booking: { ...config.booking, enabled },
                          quickReplies: { ...config.quickReplies, booking: enabled }
                        });
                      }}
                      className="w-5 h-5 mt-1 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 shrink-0"
                    />
                  </label>

                  {/* Booking Sub-options */}
                  {config.booking.enabled && (
                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Permitted Booking Flow Mode</label>
                        <select
                          value={config.booking.mode}
                          onChange={(e) => setConfig({
                            ...config,
                            booking: { ...config.booking, mode: e.target.value as any }
                          })}
                          className="w-full h-11 px-4 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                        >
                          <option value="BOTH">Both Walk-in Tickets & Scheduled Appointments</option>
                          <option value="WALKIN_ONLY">Walk-in Only (Immediate Queue Join)</option>
                          <option value="APPOINTMENT_ONLY">Scheduled Appointments Only</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800/60 border border-gray-200 dark:border-white/5 rounded-xl cursor-pointer text-xs">
                          <input 
                            type="checkbox" 
                            checked={config.booking.requireName} 
                            onChange={(e) => setConfig({
                              ...config,
                              booking: { ...config.booking, requireName: e.target.checked }
                            })}
                            className="w-4 h-4 text-emerald-600 rounded border-gray-300"
                          />
                          <span className="text-gray-900 dark:text-white font-medium">Verify Customer Full Name</span>
                        </label>

                        <label className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800/60 border border-gray-200 dark:border-white/5 rounded-xl cursor-pointer text-xs">
                          <input 
                            type="checkbox" 
                            checked={config.booking.offerMenuAddons} 
                            onChange={(e) => setConfig({
                              ...config,
                              booking: { ...config.booking, offerMenuAddons: e.target.checked }
                            })}
                            className="w-4 h-4 text-emerald-600 rounded border-gray-300"
                          />
                          <span className="text-gray-900 dark:text-white font-medium">Offer Catering / Add-ons Menu</span>
                        </label>
                      </div>
                    </div>
                  )}
                </section>

                {/* 3. WhatsApp Payments & Stripe Integration */}
                <section className="bg-zinc-50 dark:bg-zinc-900/60 border border-border dark:border-white/10 p-6 rounded-3xl shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-border dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-indigo-500" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">WhatsApp Payments & Stripe Checkout</h3>
                    </div>

                    <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border flex items-center gap-1 ${
                      stripeActive 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                        : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${stripeActive ? 'bg-blue-400' : 'bg-zinc-400'}`} />
                      {stripeActive ? 'Stripe Active' : 'Stripe Inactive'}
                    </div>
                  </div>

                  {/* Payment Master Switch */}
                  <label className="flex items-start justify-between p-4 bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-white/5 rounded-2xl cursor-pointer hover:border-indigo-500/40 transition-colors">
                    <div className="pr-4">
                      <span className="text-sm font-bold text-gray-900 dark:text-white block">Accept Payments via WhatsApp</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 block mt-0.5">
                        Delivers secure, dynamic Stripe Checkout links directly into WhatsApp conversations for paid services and add-ons.
                      </span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={config.payments.enabled} 
                      onChange={(e) => setConfig({
                        ...config,
                        payments: { ...config.payments, enabled: e.target.checked }
                      })}
                      className="w-5 h-5 mt-1 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 shrink-0"
                    />
                  </label>

                  {/* Payment Mode Configuration */}
                  {config.payments.enabled && (
                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Collection Mode for Bookings</label>
                        <select
                          value={config.payments.mode}
                          onChange={(e) => setConfig({
                            ...config,
                            payments: { ...config.payments, mode: e.target.value as any }
                          })}
                          className="w-full h-11 px-4 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                        >
                          <option value="BOTH">Customer Choice (Stripe Link or Pay at Counter)</option>
                          <option value="STRIPE_ONLY">Strict Online Payment Only (Stripe link required)</option>
                          <option value="COUNTER_ONLY">Pay at Counter Only (Cash / Physical POS on arrival)</option>
                        </select>
                      </div>

                      {!stripeActive && (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <div className="text-xs leading-relaxed text-amber-200">
                            <strong>Stripe account not yet connected:</strong> Customers will default to Pay-at-Counter until you complete Stripe Onboarding in{' '}
                            <Link href="/dashboard/settings/payments" className="underline font-bold text-amber-100 hover:text-white">
                              Settings → Payments
                            </Link>.
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* 4. Automated Quick Replies Matrix */}
                <section className="bg-zinc-50 dark:bg-zinc-900/60 border border-border dark:border-white/10 p-6 rounded-3xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-border dark:border-white/10">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Automated Quick Actions Matrix</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { 
                        key: 'status', 
                        label: 'Queue Status Check', 
                        desc: 'Customer replies with "Status" to get their live ETA and queue position.' 
                      },
                      { 
                        key: 'booking', 
                        label: 'Book Service / Join Line', 
                        desc: 'Customer replies with "Book" to launch multi-step service reservation.' 
                      },
                      { 
                        key: 'checkin', 
                        label: 'Appointment Check-In', 
                        desc: 'Customer replies with "Checkin" to self-check-in for booked visits.' 
                      },
                      { 
                        key: 'pay', 
                        label: 'Pay Outstanding Balance', 
                        desc: 'Customer replies with "Pay" to receive a direct Stripe payment link.' 
                      },
                      { 
                        key: 'cancel', 
                        label: 'Cancel Ticket / Booking', 
                        desc: 'Customer replies with "Cancel" to automatically leave queue.' 
                      },
                      { 
                        key: 'human', 
                        label: 'Live Staff Handover', 
                        desc: 'Customer replies with "Human" to pause bot and route to Staff Inbox.' 
                      },
                    ].map((item) => (
                      <label 
                        key={item.key} 
                        className="flex items-start gap-3 p-3.5 bg-white dark:bg-zinc-800/70 border border-gray-200 dark:border-white/5 rounded-2xl cursor-pointer hover:border-primary/40 transition-colors"
                      >
                        <input 
                          type="checkbox" 
                          checked={Boolean(config.quickReplies[item.key as keyof typeof config.quickReplies])} 
                          onChange={(e) => {
                            const val = e.target.checked;
                            setConfig(prev => ({
                              ...prev,
                              quickReplies: { ...prev.quickReplies, [item.key]: val },
                              ...(item.key === 'booking' ? { booking: { ...prev.booking, enabled: val } } : {})
                            }));
                          }}
                          className="w-4 h-4 mt-0.5 text-primary rounded border-gray-300 focus:ring-primary shrink-0"
                        />
                        <div>
                          <span className="text-xs font-bold text-gray-900 dark:text-white block">{item.label}</span>
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5 leading-snug">{item.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </section>

                {/* 5. Operational Safeguards & Timeouts */}
                <section className="bg-zinc-50 dark:bg-zinc-900/60 border border-border dark:border-white/10 p-6 rounded-3xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-border dark:border-white/10">
                    <Clock className="w-4 h-4 text-cyan-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">Auto-Recovery & Safeguard Timers</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Inactivity Draft Reset</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          min={5} 
                          max={120}
                          value={config.sessionTimeoutMinutes}
                          onChange={(e) => setConfig({ ...config, sessionTimeoutMinutes: Number(e.target.value) || 30 })}
                          className="w-24 h-11 px-3 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white text-center font-bold"
                        />
                        <span className="text-xs text-zinc-400">Minutes (Default: 30m)</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Clears abandoned booking flows so customer can restart cleanly.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Human Mute Auto-Resume</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          min={1} 
                          max={72}
                          value={config.humanHandoverHours}
                          onChange={(e) => setConfig({ ...config, humanHandoverHours: Number(e.target.value) || 12 })}
                          className="w-24 h-11 px-3 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white text-center font-bold"
                        />
                        <span className="text-xs text-zinc-400">Hours (Default: 12h)</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Automatically resumes bot if staff forget to unpause in dashboard.</p>
                    </div>
                  </div>
                </section>

              </div>

              {/* ── RIGHT COLUMN: Interactive Live WhatsApp Phone Simulator (5 Cols) ── */}
              <div className="lg:col-span-5">
                <div className="sticky top-24">
                  <div className="flex items-center justify-between mb-3 px-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-500" /> Live WhatsApp Simulator
                    </span>
                    <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Real-time Preview
                    </span>
                  </div>

                  {/* Smartphone Device Frame */}
                  <div className="w-full max-w-[340px] mx-auto rounded-[40px] p-3 bg-zinc-800 dark:bg-zinc-950 border-4 border-zinc-700 dark:border-zinc-800 shadow-2xl relative overflow-hidden">
                    
                    {/* Phone Notch / Speaker */}
                    <div className="w-32 h-4 bg-zinc-900 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-zinc-800 mr-2" />
                      <div className="w-10 h-1 rounded-full bg-zinc-800" />
                    </div>

                    {/* WhatsApp Screen Screen */}
                    <div className="rounded-[30px] overflow-hidden bg-[#0b141a] flex flex-col h-[540px] text-zinc-100 relative">
                      
                      {/* WhatsApp Top App Bar */}
                      <div className="bg-[#202c33] px-3.5 py-2.5 flex items-center justify-between border-b border-[#2a3942] z-10">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                            <Bot className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white tracking-tight truncate max-w-[120px]">
                              {config.botName || 'Assistant'}
                            </div>
                            <div className="text-[10px] text-emerald-400 font-medium">online</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-zinc-400 text-xs">
                          <span className="material-symbols-outlined text-[18px]">videocam</span>
                          <span className="material-symbols-outlined text-[18px]">call</span>
                          <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </div>
                      </div>

                      {/* WhatsApp Chat Conversation Area */}
                      <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px]">
                        
                        {/* Date Divider */}
                        <div className="flex justify-center">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#182229] text-zinc-400 uppercase tracking-wider shadow-sm">
                            Today
                          </span>
                        </div>

                        {/* Customer Message (Inbound) */}
                        <div className="flex justify-end">
                          <div className="bg-[#005c4b] text-white text-xs p-2.5 rounded-2xl rounded-tr-none max-w-[80%] shadow-sm">
                            <p>Hi</p>
                            <span className="text-[9px] text-emerald-200 float-right mt-1 ml-2">10:41 AM</span>
                          </div>
                        </div>

                        {/* Bot Menu Response (Outbound) */}
                        <div className="flex justify-start">
                          <div className="bg-[#202c33] text-zinc-200 text-xs p-3 rounded-2xl rounded-tl-none max-w-[90%] shadow-md border border-[#2a3942]/40">
                            <div className="font-bold text-emerald-400 text-[13px] mb-1">
                              *{config.botName || 'Assistant'}*
                            </div>
                            <div className="text-zinc-300 text-[11px] mb-2 leading-relaxed whitespace-pre-wrap">
                              {config.welcomeMessage}
                            </div>

                            {/* Dynamically Numbered Options */}
                            <div className="space-y-1 py-1 border-t border-[#2a3942] text-[11px] font-mono">
                              {simulatedMenu.map((line, idx) => (
                                <div key={idx} className="text-zinc-200 font-medium">{line}</div>
                              ))}
                            </div>

                            <div className="text-[10px] text-zinc-400 mt-2 font-sans italic">
                              Reply with a number to proceed.
                            </div>

                            <span className="text-[9px] text-zinc-400 float-right mt-1 flex items-center gap-0.5">
                              10:42 AM <span className="text-sky-400 text-[11px]">✓✓</span>
                            </span>
                          </div>
                        </div>

                        {/* Simulated Payment Bubble (If Enabled) */}
                        {config.payments.enabled && stripeActive && (
                          <div className="flex justify-start">
                            <div className="bg-[#202c33] text-zinc-200 text-xs p-3 rounded-2xl rounded-tl-none max-w-[90%] shadow-md border border-indigo-500/30">
                              <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-[11px] mb-1">
                                <CreditCard className="w-3.5 h-3.5" /> *Stripe Secure Checkout*
                              </div>
                              <p className="text-[11px] text-zinc-300">
                                💳 Total: <strong>R113.00</strong>
                              </p>
                              <div className="mt-2 p-1.5 bg-[#111b21] rounded-lg text-[10px] text-sky-400 break-all font-mono">
                                👉 checkout.stripe.com/c/pay/...
                              </div>
                              <span className="text-[9px] text-zinc-400 float-right mt-1">10:43 AM</span>
                            </div>
                          </div>
                        )}

                      </div>

                      {/* WhatsApp Bottom Text Input Bar */}
                      <div className="bg-[#202c33] p-2 flex items-center gap-2 border-t border-[#2a3942]">
                        <span className="material-symbols-outlined text-zinc-400 text-[20px]">sentiment_satisfied</span>
                        <div className="flex-1 bg-[#2a3942] h-8 rounded-full px-3 flex items-center text-[11px] text-zinc-400">
                          Type a message...
                        </div>
                        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0">
                          <span className="material-symbols-outlined text-[16px]">mic</span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Save Bar */}
            <div className="flex justify-end pt-6 border-t border-border dark:border-white/10">
              <Button 
                onClick={handleSave} 
                disabled={updateMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-white font-semibold h-12 px-8 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 text-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                {updateMutation.isPending ? <Loader2 strokeWidth={1.5} className="w-4 h-4 animate-spin" /> : <Save strokeWidth={1.5} className="w-4 h-4" />}
                Save All Chatbot Settings
              </Button>
            </div>

          </div>
        )}
      </FeatureGuard>
    </div>
  );
}
