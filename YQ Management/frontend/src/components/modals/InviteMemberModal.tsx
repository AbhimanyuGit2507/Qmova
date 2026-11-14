import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { fetchApi } from '../../lib/api';
import { toast } from 'sonner';
import { usePlan } from "../../hooks/usePlan";
import {
  X, Mail, Shield, Users, ChevronRight, Loader2, Copy, MessageSquare, User as UserIcon,
  MapPin, LayoutDashboard, Check, Briefcase, ExternalLink, Monitor,
} from 'lucide-react';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_OPTIONS = [
  {
    id: 'STAFF',
    label: 'Staff Specialist',
    badge: 'On-Ground',
    description: 'On-ground service fulfiller (doctors, nurses, chefs, barbers, waiters). Performs services and uses My Desk or a tablet kiosk.',
    icon: UserIcon,
    color: '#10B981',
  },
  {
    id: 'MANAGER',
    label: 'Manager (Front Desk / Operator)',
    badge: 'Reception',
    description: 'Service Desk & Reception operator. Manages walk-ins, triage queues, appointments, and scans customer boarding passes.',
    icon: Users,
    color: '#0891B2',
  },
  {
    id: 'ADMIN',
    label: 'Admin',
    badge: 'Lead',
    description: 'Full workspace administration. Configures locations, services, desk templates, team access, and billing.',
    icon: Shield,
    color: '#7C3AED',
  },
];

const DASHBOARD_PAGES = [
  { id: 'service-desk', label: 'Service Desk', icon: '🎫' },
  { id: 'queues', label: 'Queues', icon: '🔢' },
  { id: 'check-in', label: 'Scanner', icon: '📷' },
  { id: 'appointments', label: 'Appointments', icon: '📅' },
  { id: 'people', label: 'People', icon: '👥' },
  { id: 'journeys', label: 'Journeys', icon: '🗺️' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
];

export function InviteMemberModal({ isOpen, onClose }: InviteMemberModalProps) {
  const queryClient = useQueryClient();
  const plan = usePlan();

  // State
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Role, 2: Details & Scope, 3: Result
  const [selectedRole, setSelectedRole] = useState('STAFF');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [isKioskOnly, setIsKioskOnly] = useState(false);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedPages, setSelectedPages] = useState<string[]>(['service-desk', 'queues', 'check-in']);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [inviteResult, setInviteResult] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedDeskLink, setCopiedDeskLink] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => fetchApi('/location') as Promise<any[]>,
    enabled: isOpen,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => fetchApi('/service') as Promise<any[]>,
    enabled: isOpen,
  });

  const { data: tenant } = useQuery({
    queryKey: ['tenant', 'me'],
    queryFn: () => fetchApi('/tenant/me').catch(() => null),
    enabled: isOpen,
  });

  const deskTemplates: any[] = tenant?.staffViewLayout?.templates || [];

  const inviteMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => fetchApi('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      setInviteResult(res);
      setStep(3);
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to add team member'),
  });

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isKioskOnly && !email.trim()) {
      toast.error('Email is required for platform login');
      return;
    }

    inviteMutation.mutate({
      email: isKioskOnly ? (email.trim() || undefined) : email.trim(),
      name: name.trim() || undefined,
      title: title.trim() || undefined,
      phone: phone.trim() || undefined,
      role: selectedRole,
      allowedLocationIds: selectedRole === 'ADMIN' ? [] : selectedLocationIds,
      allowedServiceIds: selectedRole === 'STAFF' ? selectedServiceIds : [],
      allowedPages: selectedRole === 'ADMIN' ? [] : (selectedRole === 'STAFF' ? ['my-desk'] : selectedPages),
      makeBookable: selectedRole === 'STAFF',
      isKioskOnly: selectedRole === 'STAFF' ? isKioskOnly : false,
      templateId: selectedTemplateId || undefined,
    });
  };

  const handleSendEmail = async () => {
    if (!inviteResult?.inviteCode) return;
    setSendingEmail(true);
    try {
      await fetchApi('/users/send-invite-email', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), code: inviteResult.inviteCode, role: selectedRole }),
      });
      toast.success('Invitation email sent via Brevo!');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCopyLink = () => {
    if (!inviteResult?.inviteUrl) return;
    navigator.clipboard.writeText(inviteResult.inviteUrl);
    setCopiedLink(true);
    toast.success('Invite link copied!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyDeskLink = () => {
    const token = inviteResult?.deskToken || inviteResult?.staff?.deskToken;
    if (!token) return;
    const deskUrl = `${window.location.origin}/staff-desk/${token}`;
    navigator.clipboard.writeText(deskUrl);
    setCopiedDeskLink(true);
    toast.success('Kiosk station link copied!');
    setTimeout(() => setCopiedDeskLink(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!inviteResult?.inviteUrl) return;
    const roleLabel = ROLE_OPTIONS.find(r => r.id === selectedRole)?.label || selectedRole;
    const text = encodeURIComponent(
      `You've been invited to join our team on Qmova as ${roleLabel}.\n\nClick here to join: ${inviteResult.inviteUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const togglePage = (pageId: string) => {
    setSelectedPages(prev =>
      prev.includes(pageId) ? prev.filter(p => p !== pageId) : [...prev, pageId]
    );
  };

  const toggleLocation = (locId: string) => {
    setSelectedLocationIds(prev =>
      prev.includes(locId) ? prev.filter(l => l !== locId) : [...prev, locId]
    );
  };

  const toggleService = (srvId: string) => {
    setSelectedServiceIds(prev =>
      prev.includes(srvId) ? prev.filter(s => s !== srvId) : [...prev, srvId]
    );
  };

  const currentRole = ROLE_OPTIONS.find(r => r.id === selectedRole);

  const resetState = () => {
    setStep(1);
    setEmail('');
    setName('');
    setTitle('');
    setPhone('');
    setIsKioskOnly(false);
    setSelectedLocationIds([]);
    setSelectedServiceIds([]);
    setSelectedTemplateId('');
    setInviteResult(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg border border-border dark:border-dark-border overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-dark-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-on-surface dark:text-white text-sm">Add Team Member</h2>
              <p className="text-xs text-on-surface-variant dark:text-zinc-400">Step {step} of 3</p>
            </div>
          </div>
          <button onClick={() => { onClose(); resetState(); }} className="p-1.5 rounded-lg hover:bg-surface-container-low dark:hover:bg-white/10 text-outline transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step progress */}
        <div className="flex px-6 py-3 gap-2 shrink-0">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-1 rounded-full flex-1 transition-colors ${s <= step ? 'bg-primary' : 'bg-surface-container dark:bg-zinc-700'}`}
            />
          ))}
        </div>

        <div className="px-6 pb-6 overflow-y-auto">
          {plan.isAtMemberLimit && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2">
              <span>Staff limit reached ({plan.limits.maxMembers} members on current plan).</span>
              <a href="/dashboard/settings/billing" className="font-semibold underline hover:text-amber-900 shrink-0">Upgrade Plan</a>
            </div>
          )}

          {/* STEP 1: Choose Role */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-on-surface dark:text-white mb-2">What role will they have?</p>
              {ROLE_OPTIONS.map(role => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedRole === role.id
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-border dark:border-dark-border hover:border-primary/40 hover:bg-surface-container-lowest dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${role.color}20` }}>
                      <role.icon className="w-4 h-4" style={{ color: role.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-on-surface dark:text-white">{role.label}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-surface-container dark:bg-zinc-800 text-zinc-500">{role.badge}</span>
                        {selectedRole === role.id && <Check className="w-3.5 h-3.5 text-primary ml-auto" />}
                      </div>
                      <p className="text-xs text-on-surface-variant dark:text-zinc-400 mt-1 leading-relaxed">{role.description}</p>
                    </div>
                  </div>
                </button>
              ))}
              <button
                onClick={() => setStep(2)}
                disabled={plan.isAtMemberLimit}
                className="w-full mt-4 h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue as {currentRole?.label.split(' ')[0]}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Details & Scope */}
          {step === 2 && (
            <form onSubmit={handleSendInvite} className="space-y-4">
              {/* Optional Name & Title for Staff / Specialists */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant dark:text-zinc-400 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={selectedRole === 'STAFF' ? 'e.g. Dr. Sarah Smith' : 'e.g. Alex Johnson'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-dark-border bg-white dark:bg-zinc-800 text-on-surface dark:text-white outline-none focus:border-primary transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant dark:text-zinc-400 uppercase tracking-wider mb-1">
                    Specialist Title / Station
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder={selectedRole === 'STAFF' ? 'e.g. General Physician / Chef' : 'e.g. Front Desk Operator'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-dark-border bg-white dark:bg-zinc-800 text-on-surface dark:text-white outline-none focus:border-primary transition-colors text-sm"
                  />
                </div>
              </div>

              {/* Login Method for Staff: Email vs Dedicated Tablet Kiosk */}
              {selectedRole === 'STAFF' && (
                <div className="p-3.5 rounded-xl border border-border dark:border-dark-border bg-surface-container-lowest dark:bg-zinc-800/40 space-y-2">
                  <span className="text-xs font-semibold text-on-surface dark:text-white block">Station Setup Mode</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsKioskOnly(false)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        !isKioskOnly
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border dark:border-dark-border text-on-surface-variant dark:text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-xs mb-0.5">
                        <Mail className="w-3.5 h-3.5" /> Platform Login
                      </div>
                      <p className="text-[11px] opacity-80">Logs into dashboard via email</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsKioskOnly(true)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        isKioskOnly
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border dark:border-dark-border text-on-surface-variant dark:text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-xs mb-0.5">
                        <Monitor className="w-3.5 h-3.5" /> Tablet Kiosk Only
                      </div>
                      <p className="text-[11px] opacity-80">Instant station link (no password)</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Email Address */}
              {(!isKioskOnly || selectedRole !== 'STAFF') && (
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant dark:text-zinc-400 uppercase tracking-wider mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-dark-border bg-white dark:bg-zinc-800 text-on-surface dark:text-white outline-none focus:border-primary transition-colors text-sm"
                  />
                </div>
              )}

              {/* Desk Layout Template assignment for Staff */}
              {selectedRole === 'STAFF' && deskTemplates.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <LayoutDashboard className="w-3.5 h-3.5" /> Station Desk Template
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={e => setSelectedTemplateId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-dark-border bg-white dark:bg-zinc-800 text-on-surface dark:text-white outline-none focus:border-primary text-sm"
                  >
                    <option value="">Default Station Layout</option>
                    {deskTemplates.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.layout?.length || 0} widgets)</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Services fulfilled by Staff */}
              {selectedRole === 'STAFF' && services.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" /> Assigned Services (Customers can book this specialist)
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 border border-border dark:border-dark-border rounded-xl">
                    {services.map((srv: any) => (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => toggleService(srv.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          selectedServiceIds.includes(srv.id)
                            ? 'bg-primary border-primary text-white'
                            : 'border-border dark:border-dark-border text-on-surface-variant dark:text-zinc-400 hover:border-primary/40'
                        }`}
                      >
                        {srv.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Location scope */}
              {selectedRole !== 'ADMIN' && locations.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Location Access
                    <span className="text-zinc-400 font-normal normal-case ml-1">(leave empty = all locations)</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {locations.map((loc: any) => (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => toggleLocation(loc.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          selectedLocationIds.includes(loc.id)
                            ? 'bg-primary border-primary text-white'
                            : 'border-border dark:border-dark-border text-on-surface-variant dark:text-zinc-400 hover:border-primary/40'
                        }`}
                      >
                        {loc.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Manager dashboard pages */}
              {selectedRole === 'MANAGER' && (
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard Permissions
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {DASHBOARD_PAGES.map(page => (
                      <button
                        key={page.id}
                        type="button"
                        onClick={() => togglePage(page.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-left ${
                          selectedPages.includes(page.id)
                            ? 'bg-primary/10 border-primary/40 text-primary'
                            : 'border-border dark:border-dark-border text-on-surface-variant dark:text-zinc-400 hover:border-primary/30'
                        }`}
                      >
                        <span>{page.icon}</span> {page.label}
                        {selectedPages.includes(page.id) && <Check className="w-3 h-3 ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 h-10 rounded-xl border border-border dark:border-dark-border text-sm font-semibold text-on-surface dark:text-white hover:bg-surface-container-low dark:hover:bg-white/5 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={inviteMutation.isPending || (!isKioskOnly && !email) || plan.isAtMemberLimit}
                  className="flex-1 h-10 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {inviteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {isKioskOnly ? 'Create Kiosk Station' : 'Create & Invite'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Result / Share */}
          {step === 3 && inviteResult && (
            <div className="space-y-4">
              {/* If kiosk station or deskToken available */}
              {(isKioskOnly || inviteResult.deskToken || inviteResult.staff?.deskToken) && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-center">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mx-auto mb-2 text-emerald-600 dark:text-emerald-400">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">Station Kiosk Ready!</h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 max-w-sm mx-auto">
                    Open this station link on any tablet, mobile screen, or workstation. No password required.
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <button
                      onClick={handleCopyDeskLink}
                      className="px-3.5 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" /> {copiedDeskLink ? 'Copied Desk Link!' : 'Copy Desk Link'}
                    </button>
                    <a
                      href={`/staff-desk/${inviteResult.deskToken || inviteResult.staff?.deskToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 h-8 rounded-lg border border-emerald-600/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-600/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open Station
                    </a>
                  </div>
                </div>
              )}

              {inviteResult.status === 'USER_ADDED' && !isKioskOnly ? (
                <div className="text-center py-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-2 text-emerald-600 dark:text-emerald-400">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-on-surface dark:text-white text-sm mb-1">Member Added!</h3>
                  <p className="text-xs text-on-surface-variant dark:text-zinc-400">
                    <strong className="font-mono text-on-surface dark:text-white">{email}</strong> was added to your workspace as <strong>{currentRole?.label}</strong>.
                  </p>
                </div>
              ) : !isKioskOnly && (
                <>
                  <div className="text-center pb-1">
                    <h3 className="font-bold text-on-surface dark:text-white text-sm mb-0.5">Invitation Created</h3>
                    <p className="text-xs text-on-surface-variant dark:text-zinc-400">
                      Share this invitation so <strong className="font-mono text-on-surface dark:text-white">{email}</strong> can join your team.
                    </p>
                    {inviteResult.inviteCode && (
                      <div className="mt-2 inline-flex items-center gap-2 bg-surface-container dark:bg-zinc-800 border border-border dark:border-dark-border rounded-xl px-3 py-1.5">
                        <span className="text-xs text-zinc-400">Code:</span>
                        <span className="font-mono font-bold text-base text-primary tracking-widest">{inviteResult.inviteCode}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleSendEmail}
                      disabled={sendingEmail}
                      className="w-full flex items-center justify-between px-4 h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-all disabled:opacity-50 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Mail className="w-4 h-4" />
                        <span>Send Invitation Email</span>
                      </div>
                      {sendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">Brevo</span>}
                    </button>

                    <button
                      onClick={handleWhatsApp}
                      className="w-full flex items-center justify-between px-4 h-11 rounded-xl bg-[#25D366] hover:bg-[#1DA851] text-white font-semibold transition-all text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <MessageSquare className="w-4 h-4" />
                        <span>Share via WhatsApp</span>
                      </div>
                      <span className="bg-black/20 px-2 py-0.5 rounded-full text-[10px]">Instant</span>
                    </button>

                    <button
                      onClick={handleCopyLink}
                      className="w-full flex items-center justify-between px-4 h-11 rounded-xl border border-border dark:border-dark-border bg-surface-container-low dark:bg-zinc-800 text-on-surface dark:text-white font-semibold transition-all text-xs"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <Copy className="w-3.5 h-3.5 shrink-0 text-outline" />
                        <span className="font-mono truncate text-zinc-400">{inviteResult.inviteUrl}</span>
                      </div>
                      <span className="text-primary font-bold shrink-0 ml-2">{copiedLink ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </>
              )}

              <button
                onClick={() => {
                  onClose();
                  resetState();
                }}
                className="w-full h-10 mt-2 rounded-xl border border-border dark:border-dark-border text-xs font-semibold text-on-surface dark:text-white hover:bg-surface-container-low dark:hover:bg-white/5 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
