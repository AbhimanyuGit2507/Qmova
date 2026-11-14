import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi, getBackendUrl } from '../../lib/api';
import { getTenantUrl, slugify } from '../../lib/utils';
import { useAuth } from '../AuthContext';
import { toast } from 'sonner';
import {
  Star, Calendar, Building2, RefreshCw, Trash2, ExternalLink,
  CheckCircle2, AlertCircle, ChevronDown, Loader2, Globe, BookOpen,
  Copy, Check, Search, MousePointerClick, Link as LinkIcon, Sparkles, Info,
  ShieldCheck, MessageSquare, ArrowRight, MapPin, QrCode, Smartphone,
  CheckCheck, HelpCircle, X
} from 'lucide-react';

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface GoogleIntegration {
  id: string;
  email: string;
  tokenExpiry: string | null;
  hasRefreshToken?: boolean;
  isRevoked?: boolean;
  isExpired?: boolean;
  createdAt: string;
}

interface LocationSetting {
  id: string;
  name: string;
  googleIntegrationId: string | null;
  googlePlaceId: string | null;
  googleCalendarId: string | null;
}

interface GoogleCalendarItem {
  id: string;
  summary: string;
  primary?: boolean;
  isScopeLimited?: boolean;
  isExpired?: boolean;
  notice?: string;
  warning?: string;
}

// ─── Reusable Copy Button ───────────────────────────────────────────────────

function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-sm active:scale-95 shrink-0"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

// ─── Account Status Badge ───────────────────────────────────────────────────

function TokenStatusBadge({
  tokenExpiry,
  hasRefreshToken,
  isRevoked,
  isExpired,
}: {
  tokenExpiry: string | null;
  hasRefreshToken?: boolean;
  isRevoked?: boolean;
  isExpired?: boolean;
}) {
  if (isRevoked || (tokenExpiry && new Date(tokenExpiry).getTime() === 0)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        Token Revoked
      </span>
    );
  }
  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Session Expired
      </span>
    );
  }
  if (hasRefreshToken || !tokenExpiry || new Date(tokenExpiry).getTime() > Date.now()) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Connected & Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      Refresh Needed
    </span>
  );
}

// ─── Calendar Picker ────────────────────────────────────────────────────────

function CalendarPicker({
  integrationId,
  value,
  onChange,
  onReauth,
}: {
  integrationId: string;
  value: string;
  onChange: (val: string) => void;
  onReauth: () => void;
}) {
  const { data: calendars = [], isLoading, error } = useQuery<GoogleCalendarItem[]>({
    queryKey: ['google-calendars', integrationId],
    queryFn: () => fetchApi(`/integrations/google/calendars/${integrationId}`),
    enabled: !!integrationId,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 h-11 px-3.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-white/10 text-sm text-zinc-400">
        <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading Google calendars…
      </div>
    );
  }

  const noticeItem = calendars.find((c) => c.notice || c.isScopeLimited);
  const warningItem = calendars.find((c) => c.warning || c.isExpired);
  const warningMsg = warningItem?.warning || (error as any)?.message;

  return (
    <div className="space-y-2">
      <div className="relative">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-sm font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all appearance-none pr-10"
        >
          <option value="">⭐ Primary — Primary Calendar (Default)</option>
          {calendars
            .filter((cal) => cal.id !== 'primary')
            .map((cal) => (
              <option key={cal.id} value={cal.id}>
                {cal.summary}
              </option>
            ))}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {noticeItem?.notice && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-xl text-xs text-blue-800 dark:text-blue-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>{noticeItem.notice}</span>
          </div>
          <button
            type="button"
            onClick={onReauth}
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
          >
            Reconnect
          </button>
        </div>
      )}

      {warningMsg && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{warningMsg}</span>
          </div>
          <button
            type="button"
            onClick={onReauth}
            className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline shrink-0"
          >
            Re-authorize
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function GoogleBusinessSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [enableSmartReviews, setEnableSmartReviews] = useState(false);
  const [reviewWaitThresholdMins, setReviewWaitThresholdMins] = useState(15);
  const [locations, setLocations] = useState<LocationSetting[]>([]);
  const [disconnectConfirm, setDisconnectConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedLocationSlug, setSelectedLocationSlug] = useState<string>('all');
  const [mounted, setMounted] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['google-business-settings'],
    queryFn: () => fetchApi('/integrations/google/business-profile'),
  });

  useEffect(() => {
    if (settings) {
      setEnableSmartReviews(settings.tenant?.enableSmartReviews || false);
      setReviewWaitThresholdMins(settings.tenant?.reviewWaitThresholdMins || 15);
      setLocations(JSON.parse(JSON.stringify(settings.locations || [])));
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) =>
      fetchApi('/integrations/google/business-profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-business-settings'] });
      toast.success('Google Suite settings updated successfully.');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const disconnectMutation = useMutation({
    mutationFn: (integrationId: string) =>
      fetchApi(`/integrations/google/${integrationId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-business-settings'] });
      toast.success('Google account unlinked.');
      setDisconnectConfirm(null);
    },
    onError: () => toast.error('Failed to disconnect account'),
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettingsMutation.mutateAsync({
        enableSmartReviews,
        reviewWaitThresholdMins,
        locations: locations.map((l) => ({
          id: l.id,
          googleIntegrationId: l.googleIntegrationId || null,
          googlePlaceId: l.googlePlaceId || null,
          googleCalendarId: l.googleCalendarId || null,
        })),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLocationChange = (index: number, field: string, value: string) => {
    const updated = [...locations];
    (updated[index] as any)[field] = value;
    if (field === 'googleIntegrationId') {
      updated[index].googleCalendarId = null;
    }
    setLocations(updated);
  };

  const integrations: GoogleIntegration[] = settings?.googleIntegrations || [];
  const tenantSubdomain: string = settings?.tenant?.subdomain || user?.tenant?.subdomain || '';

  const getBookingUrlForSlug = (slug?: string) => {
    if (!mounted || !tenantSubdomain) return '';
    if (!slug || slug === 'all') {
      return getTenantUrl(tenantSubdomain, '/booking');
    }
    return getTenantUrl(tenantSubdomain, `/booking/${slug}`);
  };

  const bookingUrl = getBookingUrlForSlug(selectedLocationSlug);
  const isGoogleConnected = integrations.length > 0;
  const userLoggedInWithGoogle = Boolean(user?.email && user.email.includes('@'));

  const handleConnectGoogle = () => {
    window.location.href = `${getBackendUrl()}/auth/google?intent=link_tenant`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-zinc-500">Loading Google Suite settings…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">

      {/* ── Top Hero: Google Workspace Hub ─────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-950 to-black rounded-3xl p-8 border border-white/10 text-white shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-red-500 via-amber-400 to-emerald-500" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md border border-white/15">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <path d="M21.35 11.1H12.18v2.73h5.96c-.59 3.4-3.56 5.14-5.96 5.14C8.37 19 5 15.97 5 12S8.2 4.73 12.2 4.73c2.31 0 3.69 1.02 4.59 1.97L18.91 4.6C17.25 2.92 15 2 12.2 2 6.42 2 2 6.8 2 12s4.16 10 10.25 10C17.6 22 22 18.33 22 12.91c0-1.15-.15-1.81-.65-1.81z" fill="#4285F4" />
              </svg>
              Google Workspace & Maps Suite
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Calendar Sync, Smart Reviews & Google Booking
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Connect your business Google Account to synchronize appointment bookings with Google Calendar, 
              automatically harvest 5-star Google Reviews via WhatsApp, and place a 1-click booking link on Google Maps.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleConnectGoogle}
              className="flex items-center gap-2.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.35 11.1H12.18v2.73h5.96c-.59 3.4-3.56 5.14-5.96 5.14C8.37 19 5 15.97 5 12S8.2 4.73 12.2 4.73c2.31 0 3.69 1.02 4.59 1.97L18.91 4.6C17.25 2.92 15 2 12.2 2 6.42 2 2 6.8 2 12s4.16 10 10.25 10C17.6 22 22 18.33 22 12.91c0-1.15-.15-1.81-.65-1.81z" />
              </svg>
              {isGoogleConnected ? 'Add Another Google Account' : 'Connect Google Account'}
            </button>
          </div>
        </div>
      </div>

      {/* ── CARD 1: Connected Google Accounts (Foundation) ────────────────── */}
      <div className="bg-card dark:bg-zinc-900 border border-border dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-inner">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.35 11.1H12.18v2.73h5.96c-.59 3.4-3.56 5.14-5.96 5.14C8.37 19 5 15.97 5 12S8.2 4.73 12.2 4.73c2.31 0 3.69 1.02 4.59 1.97L18.91 4.6C17.25 2.92 15 2 12.2 2 6.42 2 2 6.8 2 12s4.16 10 10.25 10C17.6 22 22 18.33 22 12.91c0-1.15-.15-1.81-.65-1.81z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface dark:text-white">Connected Google Accounts</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Manage connected identities used for calendar events and smart reviews</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConnectGoogle}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary dark:text-primary rounded-xl text-xs font-bold transition-all"
          >
            + Connect New
          </button>
        </div>

        <div className="p-6 space-y-4">
          {integrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-2xl p-6">
              <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                <Building2 className="w-6 h-6 opacity-60" />
              </div>
              <h3 className="text-sm font-bold text-on-surface dark:text-white mb-1">No Google account connected</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-4">
                Connect your Google account to automatically mirror Qmova appointment bookings to Google Calendar and unlock Smart WhatsApp reviews.
              </p>
              <button
                type="button"
                onClick={handleConnectGoogle}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary/90 transition-all"
              >
                Connect Google Account Now
              </button>
            </div>
          ) : (
            integrations.map((integration) => (
              <div
                key={integration.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-border dark:border-white/10 rounded-2xl gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-md">
                    {integration.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-bold text-on-surface dark:text-white">{integration.email}</span>
                      <TokenStatusBadge
                        tokenExpiry={integration.tokenExpiry}
                        hasRefreshToken={integration.hasRefreshToken}
                        isRevoked={integration.isRevoked}
                        isExpired={integration.isExpired}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <Check className="w-3 h-3" /> Calendar Sync Enabled
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                        <Star className="w-3 h-3" /> Smart Reviews Ready
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  {(integration.isRevoked || integration.isExpired) && (
                    <button
                      type="button"
                      onClick={handleConnectGoogle}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Re-authorize
                    </button>
                  )}

                  {disconnectConfirm === integration.id ? (
                    <div className="flex items-center gap-2 bg-red-500/10 p-1.5 rounded-xl border border-red-500/20">
                      <span className="text-xs font-medium text-red-600 dark:text-red-400 pl-1.5">Disconnect?</span>
                      <button
                        type="button"
                        onClick={() => disconnectMutation.mutate(integration.id)}
                        disabled={disconnectMutation.isPending}
                        className="px-2.5 py-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {disconnectMutation.isPending ? 'Removing…' : 'Yes, Remove'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDisconnectConfirm(null)}
                        className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDisconnectConfirm(integration.id)}
                      className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                      title="Disconnect Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── CARD 2: Google Calendar Real-Time Sync ─────────────────────────── */}
      <div className="bg-card dark:bg-zinc-900 border border-border dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-border dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-inner">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface dark:text-white">Google Calendar 2-Way Sync</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Map branch locations to your Google Calendar to push appointment bookings live</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {locations.length === 0 ? (
            <p className="text-xs text-zinc-400 italic">No locations configured in your workspace.</p>
          ) : (
            locations.map((loc, index) => {
              const hasIntegration = Boolean(loc.googleIntegrationId);
              return (
                <div
                  key={loc.id}
                  className="p-5 bg-zinc-50/60 dark:bg-zinc-800/40 border border-border dark:border-white/10 rounded-2xl space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <span className="text-sm font-bold text-on-surface dark:text-white">{loc.name}</span>
                    </div>
                    {hasIntegration ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                        <CheckCheck className="w-3.5 h-3.5" /> Sync Active
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400 font-medium">Sync Paused</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                        Google Account
                      </label>
                      <select
                        value={loc.googleIntegrationId || ''}
                        onChange={(e) => handleLocationChange(index, 'googleIntegrationId', e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-sm font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                      >
                        <option value="">— No calendar sync —</option>
                        {integrations.map((int) => (
                          <option key={int.id} value={int.id}>
                            {int.email}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                        Target Google Calendar
                      </label>
                      {hasIntegration ? (
                        <CalendarPicker
                          integrationId={loc.googleIntegrationId!}
                          value={loc.googleCalendarId || ''}
                          onChange={(val) => handleLocationChange(index, 'googleCalendarId', val)}
                          onReauth={handleConnectGoogle}
                        />
                      ) : (
                        <div className="h-11 flex items-center px-3.5 bg-zinc-100/60 dark:bg-zinc-800/30 border border-dashed border-zinc-200 dark:border-white/10 rounded-xl text-xs text-zinc-400">
                          Select a Google account to configure calendar
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── CARD 3: Smart Review Shield (WhatsApp + Google Maps) ───────────── */}
      <div className="bg-card dark:bg-zinc-900 border border-border dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-border dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-inner">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-on-surface dark:text-white">Smart Google Review Shield</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  Reputation Protector
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Automatically request Google Reviews on WhatsApp from happy customers while routing negative feedback privately
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="smartReviewsToggle"
              type="button"
              role="switch"
              aria-checked={enableSmartReviews}
              onClick={() => setEnableSmartReviews(!enableSmartReviews)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                enableSmartReviews ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                  enableSmartReviews ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Visual Interactive Explanation of the Review Shield */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-border dark:border-white/10 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs">
                1
              </div>
              <h3 className="text-xs font-bold text-on-surface dark:text-white">Service Completed</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                When a customer visit or appointment is marked Complete, Qmova triggers an automated post-visit check.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-border dark:border-white/10 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs">
                2
              </div>
              <h3 className="text-xs font-bold text-on-surface dark:text-white">WhatsApp Rating Prompt</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Customer receives a friendly message: <em>"How was your visit today? Reply 1 to 5 ⭐"</em>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-emerald-500/10 border border-amber-500/20 rounded-2xl space-y-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-xs">
                3
              </div>
              <h3 className="text-xs font-bold text-on-surface dark:text-white">The Reputation Shield</h3>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                <strong>4–5 Stars:</strong> Directly sent Google Review link.<br />
                <strong>1–3 Stars:</strong> Routed privately to management to protect your public rating!
              </p>
            </div>
          </div>

          {/* Settings: Threshold + Place ID */}
          {enableSmartReviews && (
            <div className="space-y-6 pt-4 border-t border-border dark:border-white/10">
              {/* Wait Time Threshold Slider */}
              <div className="p-5 bg-zinc-50 dark:bg-zinc-800/40 border border-border dark:border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-on-surface dark:text-white">Wait Time Protection Filter</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Only ask for reviews if the customer was served promptly.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-card dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-border dark:border-white/10 text-sm font-bold text-primary">
                    <span>{reviewWaitThresholdMins}</span>
                    <span className="text-xs text-zinc-400 font-normal">minutes</span>
                  </div>
                </div>

                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={reviewWaitThresholdMins}
                  onChange={(e) => setReviewWaitThresholdMins(Number(e.target.value))}
                  className="w-full accent-primary h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg cursor-pointer"
                />

                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic">
                  💡 If a customer experienced an unusual delay (waited over {reviewWaitThresholdMins} minutes), review harvesting is automatically skipped to prevent negative public reviews.
                </p>
              </div>

              {/* Per-Location Place IDs */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Google Place IDs & Review Links
                  </h3>
                  <a
                    href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline"
                  >
                    Google Place ID Finder <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {locations.map((loc, index) => {
                  const placeId = loc.googlePlaceId?.trim();
                  const testReviewUrl = placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : '';

                  return (
                    <div
                      key={loc.id}
                      className="p-4 bg-zinc-50/70 dark:bg-zinc-800/40 border border-border dark:border-white/10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-2.5 min-w-[140px]">
                        <MapPin className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm font-bold text-on-surface dark:text-white truncate">{loc.name}</span>
                      </div>

                      <div className="flex-1 flex flex-col sm:flex-row items-center gap-2 w-full">
                        <input
                          type="text"
                          placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4"
                          value={loc.googlePlaceId || ''}
                          onChange={(e) => handleLocationChange(index, 'googlePlaceId', e.target.value)}
                          className="w-full h-10 px-3.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />

                        {testReviewUrl ? (
                          <a
                            href={testReviewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all shrink-0 whitespace-nowrap"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Test Review Modal ↗
                          </a>
                        ) : (
                          <span className="text-[11px] text-zinc-400 shrink-0 px-2">Place ID required</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CARD 4: Google Maps & Search Booking Button ────────────────────── */}
      <div className="bg-card dark:bg-zinc-900 border border-border dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-border dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-inner">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface dark:text-white">Google Maps & Search "Book Now" Button</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Add a direct appointment booking link to your Google Business Profile listing</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Benefit explanation */}
          <div className="flex gap-3.5 p-4 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-2xl text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">What customers see on Google Search & Maps:</span> When local customers search for your venue or service, Google presents a prominent <strong>"Book an appointment"</strong> or <strong>"Book online"</strong> button that opens your Qmova live booking flow.
            </div>
          </div>

          {/* Booking URLs & Selectors */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                Direct Booking Links
              </span>
              {locations.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedLocationSlug('all')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all ${
                      selectedLocationSlug === 'all'
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-white'
                    }`}
                  >
                    All Branches
                  </button>
                  {locations.map((loc) => {
                    const slug = slugify(loc.name);
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => setSelectedLocationSlug(slug)}
                        className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all ${
                          selectedLocationSlug === slug
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-white'
                        }`}
                      >
                        {loc.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-border dark:border-white/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="font-mono text-xs text-primary font-bold break-all select-all flex-1">
                {bookingUrl || 'https://...'}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <CopyButton value={bookingUrl} label="Copy Link" />
                {bookingUrl && (
                  <a
                    href={bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Preview ↗
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* 3-Step Setup Guide */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              3-Step Google Business Profile Setup (Takes 60 seconds)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-border dark:border-white/10 rounded-2xl space-y-1.5">
                <div className="text-xs font-bold text-primary">Step 1</div>
                <h4 className="text-xs font-bold text-on-surface dark:text-white">Open Google Business</h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Go to <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">business.google.com</a> and select your venue location.
                </p>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-border dark:border-white/10 rounded-2xl space-y-1.5">
                <div className="text-xs font-bold text-primary">Step 2</div>
                <h4 className="text-xs font-bold text-on-surface dark:text-white">Click "Edit Profile"</h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Navigate to <strong>"Booking links"</strong> (or <strong>"Website"</strong> under Contact info).
                </p>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-border dark:border-white/10 rounded-2xl space-y-1.5">
                <div className="text-xs font-bold text-primary">Step 3</div>
                <h4 className="text-xs font-bold text-on-surface dark:text-white">Paste URL & Save</h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Paste your copied Qmova URL and click Save. Google displays the booking button within hours!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Save Action Bar ────────────────────────────────────────── */}
      <div className="sticky bottom-6 z-20 flex items-center justify-between p-4 bg-zinc-900/90 dark:bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl text-white">
        <div className="flex items-center gap-2 pl-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-medium text-zinc-300">
            Save your calendar mappings, smart review thresholds, and place IDs.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Saving changes…' : 'Save Google Suite Settings'}
          </button>
        </div>
      </div>

    </div>
  );
}
