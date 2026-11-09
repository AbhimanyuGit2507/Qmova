import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  Phone,
  Mail,
  Calendar,
  User,
  ShieldAlert,
  Loader2,
  Clock,
  MapPin,
  CheckCircle2,
  Star,
  ExternalLink,
  Copy,
  Edit3,
  Save,
  RefreshCw,
  Ticket,
  ChevronDown,
  ChevronUp,
  Check,
  History,
  CreditCard,
  Plus,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { toast } from 'sonner';

interface CustomerDossierSidebarProps {
  phone: string;
  onClose: () => void;
  onOpenCustomerDrawer?: (customerId: string) => void;
  onInspectVisit?: (visit: AnyFixMe) => void;
}

export function CustomerDossierSidebar({
  phone,
  onClose,
  onOpenCustomerDrawer,
  onInspectVisit,
}: CustomerDossierSidebarProps) {
  const queryClient = useQueryClient();

  // ── Dossier Query ────────────────────────────────────────────────────────
  const {
    data: dossier,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['inbox-dossier', phone],
    queryFn: () => fetchApi<AnyFixMe>(`/messages/inbox/${phone}/dossier`),
    enabled: !!phone,
    staleTime: 10000,
  });

  // ── State for Contact Editing ───────────────────────────────────────────
  const customer = dossier?.customer;
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const startEditing = () => {
    setEditName(customer?.name || '');
    setEditEmail(customer?.email || '');
    setIsEditingContact(true);
  };

  // ── State for Staff Notes ───────────────────────────────────────────────
  const [localNotes, setLocalNotes] = useState<string | null>(null);
  const notes = localNotes !== null ? localNotes : (customer?.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // ── State for History Filter & Accordions ───────────────────────────────
  const [historyFilter, setHistoryFilter] = useState<'all' | 'visits' | 'appointments'>('all');
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
  const [isReviewsExpanded, setIsReviewsExpanded] = useState(true);

  // ── Customer Update Mutation ────────────────────────────────────────────
  const updateCustomerMutation = useMutation({
    mutationFn: (body: {
      name?: string;
      email?: string;
      notes?: string;
      isVip?: boolean;
      isBlocked?: boolean;
    }) =>
      fetchApi(`/messages/inbox/${phone}/customer`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox-dossier', phone] });
      queryClient.invalidateQueries({ queryKey: ['inbox-conversations'] });
      toast.success('Customer details updated');
      setIsEditingContact(false);
      setLocalNotes(null);
    },
    onError: () => {
      toast.error('Failed to update customer');
    },
  });

  // ── Send Payment Link Mutation ──────────────────────────────────────────
  const sendPaymentLinkMutation = useMutation({
    mutationFn: (body: { visitId: string; visitStepId?: string }) =>
      fetchApi(`/messages/inbox/${phone}/payment-link`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox-messages', phone] });
      toast.success('💳 Payment link sent to customer via WhatsApp');
    },
    onError: () => {
      toast.error('Failed to send payment link');
    },
  });

  const handleSaveContact = () => {
    updateCustomerMutation.mutate({
      name: editName.trim() || undefined,
      email: editEmail.trim() || undefined,
    });
  };


  const handleToggleBlock = () => {
    const newBlocked = !dossier?.customer?.isBlocked;
    updateCustomerMutation.mutate({ isBlocked: newBlocked });
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await updateCustomerMutation.mutateAsync({ notes });
      toast.success('Staff notes saved');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCopyPhone = () => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    toast.success('Phone copied to clipboard');
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  // ── Helpers ─────────────────────────────────────────────────────────────
  const stats = dossier?.stats;
  const activeTicket = dossier?.activeTicket;
  const activePaymentStep = activeTicket?.rawVisit?.visitSteps?.find(
    (s: AnyFixMe) =>
      (s.type === 'PAYMENT' || s.templateStep?.type === 'PAYMENT') &&
      s.paymentStatus !== 'PAID' &&
      s.status !== 'COMPLETED'
  );
  const upcomingAppointments = dossier?.upcomingAppointments || [];
  const pastBookings = dossier?.pastBookings || [];
  const reviews = dossier?.reviews || [];
  const conversationMeta = dossier?.conversationMeta;

  const displayName = customer?.name || 'Anonymous Visitor';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'U';

  const formatCurrency = (amountCents?: number, curr: string = 'ZAR') => {
    if (amountCents === undefined || amountCents === null || amountCents <= 0) return '—';
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: curr || 'ZAR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amountCents / 100);
    } catch {
      return `${curr || 'ZAR'} ${(amountCents / 100).toFixed(2)}`;
    }
  };

  const formatDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr?: string | Date | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredBookings = pastBookings.filter((b: AnyFixMe) => {
    if (historyFilter === 'visits') return b.bookingType === 'VISIT';
    if (historyFilter === 'appointments') return b.bookingType === 'APPOINTMENT';
    return true;
  });

  return (
    <div className="w-80 lg:w-88 border-l border-border dark:border-dark-border bg-surface dark:bg-dark-card flex flex-col shrink-0 min-h-0 h-full overflow-hidden text-on-surface dark:text-zinc-200">
      {/* ── Top Header Bar ─────────────────────────────────────────────────── */}
      <div className="p-3.5 border-b border-border dark:border-dark-border flex items-center justify-between shrink-0 bg-surface-container-lowest dark:bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-primary dark:text-sky-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-outline dark:text-zinc-400">
            Customer Dossier
          </h4>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => refetch()}
            className="p-1 rounded-lg text-outline hover:text-on-surface dark:hover:text-white hover:bg-surface-container dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Refresh Dossier"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          </button>
          {customer?.id && onOpenCustomerDrawer && (
            <button
              onClick={() => onOpenCustomerDrawer(customer.id)}
              className="p-1 rounded-lg text-outline hover:text-on-surface dark:hover:text-white hover:bg-surface-container dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Open Full Customer CRM Drawer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-outline hover:text-on-surface dark:hover:text-white hover:bg-surface-container dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Collapse Sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Scrollable Body ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-outline flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span>Loading customer details...</span>
          </div>
        ) : (
          <>
            {/* ── Blocked Alert Banner ────────────────────────────────────── */}
            {customer?.isBlocked && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold flex items-center justify-between gap-1.5 animate-in fade-in">
                <span className="flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
                  <ShieldAlert className="w-4 h-4 shrink-0" /> Blocked Client
                </span>
                <button
                  onClick={handleToggleBlock}
                  className="underline hover:no-underline text-[10px] cursor-pointer"
                >
                  Unblock
                </button>
              </div>
            )}

            {/* ── Identity & Contact Card ─────────────────────────────────── */}
            <div className="p-4 rounded-2xl bg-surface-container-low dark:bg-white/5 border border-border dark:border-dark-border relative">
              <div className="flex items-start gap-3.5">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-13 h-13 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-lg font-bold shadow-xs">
                    {initial}
                  </div>
                </div>

                {/* Identity Info or Inline Edit */}
                <div className="flex-1 min-w-0">
                  {isEditingContact ? (
                    <div className="space-y-2 animate-in fade-in">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-outline block mb-0.5">
                          Name
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Customer Name"
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-surface dark:bg-zinc-900 border border-border dark:border-dark-border text-on-surface dark:text-white focus:outline-hidden focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-outline block mb-0.5">
                          Email
                        </label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          placeholder="client@example.com"
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-surface dark:bg-zinc-900 border border-border dark:border-dark-border text-on-surface dark:text-white focus:outline-hidden focus:border-primary"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={handleSaveContact}
                          disabled={updateCustomerMutation.isPending}
                          className="flex-1 py-1 px-2 rounded-lg bg-primary text-white font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {updateCustomerMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Save className="w-3 h-3" />
                          )}
                          Save
                        </button>
                        <button
                          onClick={() => setIsEditingContact(false)}
                          className="py-1 px-2 rounded-lg bg-surface-container dark:bg-white/10 text-outline text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-sm text-on-surface dark:text-white truncate">
                          {displayName}
                        </h3>
                        <button
                          onClick={startEditing}
                          className="p-1 text-outline hover:text-on-surface dark:hover:text-white rounded-md cursor-pointer transition-colors"
                          title="Edit Customer Info"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Phone with copy */}
                      <div className="flex items-center gap-1.5 mt-1 font-mono text-xs text-outline">
                        <Phone className="w-3 h-3 shrink-0" />
                        <span className="truncate">{phone}</span>
                        <button
                          onClick={handleCopyPhone}
                          className="p-0.5 text-outline hover:text-primary transition-colors cursor-pointer"
                          title="Copy phone"
                        >
                          {copiedPhone ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      {/* Email */}
                      {customer?.email ? (
                        <p className="flex items-center gap-1.5 mt-0.5 text-xs text-outline truncate">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </p>
                      ) : (
                        <button
                          onClick={startEditing}
                          className="text-[11px] text-primary dark:text-sky-400 hover:underline mt-0.5 block cursor-pointer"
                        >
                          + Add Email
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Badges Bar */}
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/70 dark:border-dark-border/70 flex-wrap">

                {(stats?.totalBookings || 0) > 1 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Repeat Client ({stats.totalBookings}x)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    New Prospect
                  </span>
                )}

                {customer && (
                  <button
                    onClick={handleToggleBlock}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
                      customer.isBlocked
                        ? 'bg-red-500 text-white'
                        : 'text-outline hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                    }`}
                  >
                    {customer.isBlocked ? 'Blocked' : 'Block'}
                  </button>
                )}
              </div>

              {/* Quick Actions Call / CRM */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <a
                  href={`tel:${phone}`}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-surface-container dark:bg-white/10 hover:bg-surface-container-high text-on-surface dark:text-white transition-all border border-border dark:border-dark-border cursor-pointer active:scale-95 text-center"
                >
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  Call Customer
                </a>

                {customer?.id && onOpenCustomerDrawer ? (
                  <button
                    onClick={() => onOpenCustomerDrawer(customer.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-white transition-all shadow-xs cursor-pointer active:scale-95 text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open CRM
                  </button>
                ) : (
                  <button
                    onClick={startEditing}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-white transition-all shadow-xs cursor-pointer active:scale-95 text-center"
                  >
                    <User className="w-3.5 h-3.5" />
                    Save Contact
                  </button>
                )}
              </div>
            </div>

            {/* ── Active Ticket Today Status Card ─────────────────────────── */}
            {activeTicket ? (
              <div className="p-3.5 rounded-2xl bg-primary/10 dark:bg-primary/15 border border-primary/20 dark:border-primary/30 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary dark:text-sky-400 flex items-center gap-1">
                    <Ticket className="w-3 h-3" /> Active Queue Ticket
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                    {activeTicket.currentState}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black font-mono text-on-surface dark:text-white">
                    #{activeTicket.displayId}
                  </span>
                  <span className="text-xs text-on-surface-variant dark:text-zinc-300 font-medium">
                    {activeTicket.serviceName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-outline pt-1 border-t border-primary/15">
                  <span>{activeTicket.queueName} • {activeTicket.locationName}</span>
                  {onInspectVisit && (
                    <button
                      onClick={() => onInspectVisit(activeTicket.rawVisit)}
                      className="text-primary font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      View Ticket <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* ── FE-06: Send Payment Link via WhatsApp ─────────────── */}
                {activePaymentStep ? (
                  <div className="pt-2 border-t border-primary/20 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        Payment Required
                      </span>
                      {activePaymentStep.amountCharged && (
                        <span className="font-mono font-bold">
                          R{(activePaymentStep.amountCharged / 100).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        sendPaymentLinkMutation.mutate({
                          visitId: activeTicket.id,
                          visitStepId: activePaymentStep.id,
                        })
                      }
                      disabled={sendPaymentLinkMutation.isPending}
                      className="w-full py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      {sendPaymentLinkMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CreditCard className="w-3.5 h-3.5" />
                      )}
                      Send Payment Link via WhatsApp
                    </button>
                  </div>
                ) : (
                  <div className="pt-1.5 border-t border-primary/15">
                    <button
                      onClick={() =>
                        sendPaymentLinkMutation.mutate({
                          visitId: activeTicket.id,
                        })
                      }
                      disabled={sendPaymentLinkMutation.isPending}
                      className="w-full py-1.5 px-2 rounded-xl bg-surface-container dark:bg-white/10 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-outline text-[11px] font-semibold transition-all border border-border dark:border-dark-border flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {sendPaymentLinkMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CreditCard className="w-3.5 h-3.5" />
                      )}
                      Send Payment Link via WhatsApp
                    </button>
                  </div>
                )}
              </div>
            ) : upcomingAppointments.length > 0 ? (
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Upcoming Appointment
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                    {upcomingAppointments[0].status}
                  </span>
                </div>
                <p className="font-bold text-xs text-on-surface dark:text-white">
                  {upcomingAppointments[0].serviceName}
                </p>
                <p className="text-[11px] text-outline flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  {formatDate(upcomingAppointments[0].scheduledStart)} at {formatTime(upcomingAppointments[0].scheduledStart)}
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-surface-container-low dark:bg-white/5 border border-border dark:border-dark-border flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-surface-container dark:bg-white/10 flex items-center justify-center shrink-0 text-outline">
                    <Ticket className="w-4 h-4 opacity-70" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-on-surface-variant dark:text-zinc-300">
                      No Active Ticket Today
                    </p>
                    <p className="text-[10px] text-outline">Customer is not currently queued.</p>
                  </div>
                </div>
                <Link
                  href={`/dashboard/service-desk?new=true&phone=${encodeURIComponent(phone)}&name=${encodeURIComponent(customer?.name || '')}`}
                  className="px-2.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-colors shrink-0 cursor-pointer"
                  title="Queue or book this customer now"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Queue</span>
                </Link>
              </div>
            )}

            {/* ── 4 Insight Metric Tiles ──────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-2">
              {/* Total Bookings */}
              <div className="p-3 rounded-xl bg-surface-container-low dark:bg-white/5 border border-border dark:border-dark-border">
                <div className="text-[10px] uppercase font-bold text-outline tracking-wider flex items-center gap-1 mb-0.5">
                  <History className="w-3 h-3" /> Total Visits
                </div>
                <div className="text-base font-black text-on-surface dark:text-white">
                  {stats?.totalVisits || stats?.totalBookings || 0}
                </div>
                <div className="text-[10px] text-outline mt-0.5 truncate">
                  {stats?.completedCount !== undefined
                    ? `${stats.completedCount} Attended (${stats?.reliabilityRate ?? 0}%)`
                    : `${stats?.totalVisits || 0} Total`}
                </div>
              </div>

              {/* Total Spend */}
              <div className="p-3 rounded-xl bg-surface-container-low dark:bg-white/5 border border-border dark:border-dark-border">
                <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1 mb-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Total Spent
                </div>
                <div className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatCurrency(stats?.totalSpent, stats?.currency)}
                </div>
                <div className="text-[10px] text-outline mt-0.5 truncate">
                  {stats?.paidCount !== undefined ? `${stats.paidCount} Paid Visits` : 'Lifetime Spend'}
                </div>
              </div>

              {/* Customer Rating */}
              <div className="p-3 rounded-xl bg-surface-container-low dark:bg-white/5 border border-border dark:border-dark-border">
                <div className="text-[10px] uppercase font-bold text-amber-500 tracking-wider flex items-center gap-1 mb-0.5">
                  <Star className="w-3 h-3 fill-current" /> Rating
                </div>
                <div className="text-base font-black text-amber-500 flex items-baseline gap-1">
                  {stats?.avgRating ? `${stats.avgRating}` : '—'}
                  {stats?.avgRating && <span className="text-[10px] font-normal text-outline">/ 5.0</span>}
                </div>
                <div className="text-[10px] text-outline mt-0.5">
                  {stats?.totalReviews || 0} Reviews given
                </div>
              </div>

              {/* Preferred Location */}
              <div className="p-3 rounded-xl bg-surface-container-low dark:bg-white/5 border border-border dark:border-dark-border">
                <div className="text-[10px] uppercase font-bold text-outline tracking-wider flex items-center gap-1 mb-0.5">
                  <MapPin className="w-3 h-3" /> Location
                </div>
                <div className="text-xs font-bold text-on-surface dark:text-white truncate" title={stats?.preferredLocation}>
                  {stats?.preferredLocation || '—'}
                </div>
                <div className="text-[10px] text-outline mt-0.5">Primary Branch</div>
              </div>
            </div>

            {/* ── Past Bookings & Visits History ──────────────────────────── */}
            <div className="border border-border dark:border-dark-border rounded-2xl overflow-hidden bg-surface-container-low dark:bg-white/5">
              <button
                onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-surface-container/50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface dark:text-white">
                    Past Bookings & Visits
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-surface-container dark:bg-white/10 text-outline">
                    {pastBookings.length}
                  </span>
                </div>
                {isHistoryExpanded ? (
                  <ChevronUp className="w-4 h-4 text-outline" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-outline" />
                )}
              </button>

              {isHistoryExpanded && (
                <div className="p-3 pt-0 space-y-2.5">
                  {/* Filter Tabs */}
                  {pastBookings.length > 0 && (
                    <div className="flex gap-1 p-0.5 bg-surface dark:bg-zinc-900/80 rounded-xl border border-border dark:border-dark-border">
                      <button
                        onClick={() => setHistoryFilter('all')}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          historyFilter === 'all'
                            ? 'bg-primary text-white'
                            : 'text-outline hover:text-on-surface'
                        }`}
                      >
                        All ({pastBookings.length})
                      </button>
                      <button
                        onClick={() => setHistoryFilter('visits')}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          historyFilter === 'visits'
                            ? 'bg-primary text-white'
                            : 'text-outline hover:text-on-surface'
                        }`}
                      >
                        Visits
                      </button>
                      <button
                        onClick={() => setHistoryFilter('appointments')}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          historyFilter === 'appointments'
                            ? 'bg-primary text-white'
                            : 'text-outline hover:text-on-surface'
                        }`}
                      >
                        Appts
                      </button>
                    </div>
                  )}

                  {/* Booking list */}
                  {filteredBookings.length === 0 ? (
                    <div className="p-4 text-center text-xs text-outline bg-surface dark:bg-zinc-900/50 rounded-xl border border-dashed border-border dark:border-dark-border">
                      No bookings or visits found.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
                      {filteredBookings.map((b: AnyFixMe) => {
                        const isCompleted = b.currentState === 'COMPLETED';
                        const isCancelled =
                          b.currentState === 'CANCELLED' || b.currentState === 'NO_SHOW';

                        return (
                          <div
                            key={b.id}
                            onClick={() => b.rawVisit && onInspectVisit && onInspectVisit(b.rawVisit)}
                            className={`p-2.5 rounded-xl border border-border dark:border-dark-border bg-surface dark:bg-zinc-900/80 hover:border-primary/50 transition-all ${
                              b.rawVisit && onInspectVisit ? 'cursor-pointer hover:shadow-xs' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {b.ticketNumber && (
                                    <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded-md bg-primary/10 dark:bg-primary/20 text-primary dark:text-sky-400 shrink-0">
                                      #{b.ticketNumber}
                                    </span>
                                  )}
                                  <span className="font-bold text-xs text-on-surface dark:text-white truncate">
                                    {b.serviceName}
                                  </span>
                                </div>
                                <span className="text-[10px] text-outline flex items-center gap-1 mt-0.5">
                                  <Clock className="w-2.5 h-2.5 shrink-0" />
                                  {formatDate(b.date)} • {formatTime(b.date)}
                                </span>
                              </div>
                              <span
                                className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase shrink-0 ${
                                  isCompleted
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                    : isCancelled
                                    ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                                    : 'bg-primary/15 text-primary'
                                }`}
                              >
                                {b.currentState}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-outline mt-1.5 pt-1.5 border-t border-border/50 dark:border-dark-border/50">
                              <span className="truncate max-w-[130px]">{b.locationName}</span>
                              {b.amount > 0 ? (
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <span>{formatCurrency(b.amount, b.currency)}</span>
                                  {b.paymentMethod && (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-surface-container dark:bg-white/10 uppercase font-sans font-semibold text-outline">
                                      {b.paymentMethod}
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-[10px] text-outline opacity-70">Free / Unpaid</span>
                              )}
                            </div>

                            {/* Show cancellation or no-show reason */}
                            {b.cancelReason && (
                              <p className="text-[10px] text-red-500/90 dark:text-red-400/90 mt-1 italic leading-tight">
                                Note: {b.cancelReason}
                              </p>
                            )}

                            {/* Customer Rating & Feedback Quote */}
                            {b.rating && (
                              <div className="mt-1.5 p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px]">
                                <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                                  {Array.from({ length: b.rating }).map((_, i) => (
                                    <Star key={i} className="w-2.5 h-2.5 fill-current" />
                                  ))}
                                  <span className="ml-1 text-[9px] text-amber-600 dark:text-amber-400">
                                    {b.rating}/5
                                  </span>
                                </div>
                                {b.feedback && (
                                  <p className="text-zinc-600 dark:text-zinc-300 italic mt-0.5 text-[10px]">
                                    &ldquo;{b.feedback}&rdquo;
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Customer Reviews & Feedback Section ──────────────────────── */}
            <div className="border border-border dark:border-dark-border rounded-2xl overflow-hidden bg-surface-container-low dark:bg-white/5">
              <button
                onClick={() => setIsReviewsExpanded(!isReviewsExpanded)}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-surface-container/50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface dark:text-white">
                    Reviews & Feedback
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-surface-container dark:bg-white/10 text-outline">
                    {reviews.length}
                  </span>
                </div>
                {isReviewsExpanded ? (
                  <ChevronUp className="w-4 h-4 text-outline" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-outline" />
                )}
              </button>

              {isReviewsExpanded && (
                <div className="p-3 pt-0 space-y-2">
                  {reviews.length === 0 ? (
                    <div className="p-4 text-center text-xs text-outline bg-surface dark:bg-zinc-900/50 rounded-xl border border-dashed border-border dark:border-dark-border">
                      No ratings or reviews submitted yet.
                    </div>
                  ) : (
                    reviews.map((r: AnyFixMe, idx: number) => (
                      <div
                        key={r.id || idx}
                        className="p-2.5 rounded-xl border border-border dark:border-dark-border bg-surface dark:bg-zinc-900/80 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {Array.from({ length: r.rating || 5 }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-current" />
                            ))}
                          </div>
                          <span className="text-[10px] text-outline font-mono">
                            {formatDate(r.date)}
                          </span>
                        </div>
                        {r.feedback && (
                          <p className="text-xs text-on-surface dark:text-zinc-200 italic">
                            &ldquo;{r.feedback}&rdquo;
                          </p>
                        )}
                        <p className="text-[10px] text-outline font-medium">
                          {r.serviceName} • {r.locationName}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* ── Internal Staff Notes ────────────────────────────────────── */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low dark:bg-white/5 border border-border dark:border-dark-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1.5">
                  <Edit3 className="w-3 h-3" /> Staff Notes & Preferences
                </span>
                <button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes || updateCustomerMutation.isPending}
                  className="text-[11px] font-bold text-primary dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {isSavingNotes ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3" />
                  )}
                  Save Note
                </button>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setLocalNotes(e.target.value)}
                placeholder="e.g. Prefers afternoon bookings, allergic to penicillin, speaks Hindi/English..."
                rows={3}
                className="w-full text-xs p-2.5 rounded-xl bg-surface dark:bg-zinc-900 border border-border dark:border-dark-border text-on-surface dark:text-white placeholder:text-outline focus:outline-hidden focus:border-primary resize-none"
              />
            </div>

            {/* ── WhatsApp Channel Meta (Bottom) ─────────────────────────── */}
            <div className="p-3 rounded-2xl bg-surface-container-low dark:bg-white/5 border border-border dark:border-dark-border text-[11px] text-outline space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Channel
                </span>
                <span className="font-semibold text-on-surface-variant dark:text-zinc-300">
                  {conversationMeta?.channel || 'WhatsApp Cloud'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>First Contact</span>
                <span className="font-mono text-on-surface-variant dark:text-zinc-300">
                  {formatDate(conversationMeta?.firstContactAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Last Activity</span>
                <span className="font-mono text-on-surface-variant dark:text-zinc-300">
                  {formatDate(conversationMeta?.lastMessageAt)} {formatTime(conversationMeta?.lastMessageAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Messages</span>
                <span className="font-mono font-bold text-on-surface-variant dark:text-zinc-300">
                  {conversationMeta?.totalMessages || 0}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
