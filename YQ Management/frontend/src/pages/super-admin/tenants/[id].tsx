import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { createPortal } from 'react-dom';
import SuperAdminLayout from '../../../components/SuperAdminLayout';
import { fetchApi } from '../../../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, CreditCard, Users, Activity, AlertCircle, Clock,
  CheckCircle2, XCircle, Settings, Store, MapPin, Check, X, ShieldAlert,
  Zap, Layers, Sliders, Crown, Info, ChevronDown, ChevronRight,
  RefreshCw, Send, Target, Workflow, Sparkles, Loader2, ExternalLink,
  KeyRound, Plus, Trash2, UserPlus, ShieldCheck, Copy
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ConfirmModal } from '../../../components/modals/ConfirmModal';

// ── Reusable sub-components ───────────────────────────────────────────────────

function LimitRow({
  label, planVal, customVal, unit = '', onChange, onClear, editing, presets = []
}: {
  label: string; planVal: any; customVal: any; unit?: string;
  onChange: (v: number | null) => void; onClear: () => void; editing: boolean;
  presets?: { label: string; value: number | null }[];
}) {
  const effective = customVal ?? planVal;
  const hasOverride = customVal !== undefined && customVal !== null;

  return (
    <div className="py-4 border-b border-gray-100 dark:border-white/5 last:border-0 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {label}
            {hasOverride && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20 flex items-center gap-1 uppercase tracking-wider">
                <Crown className="w-3 h-3" /> Override
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
            Plan default: {planVal === null || planVal === undefined
              ? <span className="text-emerald-500 font-semibold">∞ Unlimited</span>
              : `${planVal.toLocaleString()}${unit}`}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                placeholder={planVal === null ? '∞' : String(planVal)}
                defaultValue={customVal ?? ''}
                className="w-28 h-9 px-3 text-sm rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
              />
              {hasOverride && (
                <button
                  type="button"
                  onClick={onClear}
                  className="p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl text-rose-500 transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20"
                  title="Remove override"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className={`text-base font-extrabold ${hasOverride ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
              {effective === null || effective === undefined
                ? <span className="text-emerald-500 font-black">∞ Unlimited</span>
                : `${Number(effective).toLocaleString()}${unit}`}
            </div>
          )}
        </div>
      </div>

      {editing && presets.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-zinc-500 mr-1">Presets:</span>
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(p.value)}
              className="px-2.5 py-1 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-zinc-300 transition-colors border border-gray-200 dark:border-white/5 font-medium"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FeatureToggleRow({ label, desc, planVal, customVal, onChange, editing }: any) {
  const effective = customVal !== undefined ? customVal : planVal;
  const hasOverride = customVal !== undefined;

  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-gray-100 dark:border-white/5 last:border-0 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          {label}
          {hasOverride && (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20 flex items-center gap-1 uppercase tracking-wider">
              <Crown className="w-3 h-3" /> Override
            </span>
          )}
        </div>
        <div className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{desc}</div>
      </div>
      <div className="shrink-0">
        {editing ? (
          <select
            value={customVal === undefined ? '' : String(customVal)}
            onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value === 'true')}
            className="h-9 px-3 text-xs rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none font-medium"
          >
            <option value="">Plan default ({String(planVal ?? 'false')})</option>
            <option value="true">Enabled (Override)</option>
            <option value="false">Disabled (Override)</option>
          </select>
        ) : (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            effective
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20'
              : 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-zinc-400 border border-gray-200 dark:border-white/5'
          }`}>
            {effective ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-gray-400" />}
            {effective ? 'Enabled' : 'Disabled'}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SuperAdminTenantDetail() {
  const router = useRouter();
  const { id } = router.query;
  const queryClient = useQueryClient();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['super-admin-tenant', id],
    queryFn: () => fetchApi(`/super-admin/tenants/${id}`),
    enabled: !!id,
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'subscription' | 'settings' | 'enterprise'>(
    (router.query.tab as any) || 'overview'
  );
  const [showAssignPlanModal, setShowAssignPlanModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [billingInterval, setBillingInterval] = useState('MONTHLY');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [showCancelPlanConfirm, setShowCancelPlanConfirm] = useState(false);
  const [showDeleteTenantConfirm, setShowDeleteTenantConfirm] = useState(false);

  // Enterprise state
  const [editingLimits, setEditingLimits] = useState(false);
  const [pendingLimits, setPendingLimits] = useState<any>({});
  const [pendingFeatures, setPendingFeatures] = useState<any>({});
  const [limitsNote, setLimitsNote] = useState('');
  const [showBlueprintDrawer, setShowBlueprintDrawer] = useState(false);
  const [blueprintDrawerMode, setBlueprintDrawerMode] = useState<'push' | 'apply'>('apply');
  const [selectedBlueprintId, setSelectedBlueprintId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [pushCustomName, setPushCustomName] = useState('');
  const [expandedBlueprint, setExpandedBlueprint] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    name: '', subdomain: '', supportEmail: '', supportPhone: '',
    whatsappConnected: false, chatbotEnabled: false,
    enableSmartReviews: false, autonomousEnabled: false,
  });

  useEffect(() => {
    if (tenant) {
      setEditForm({
        name: tenant.name || '',
        subdomain: tenant.subdomain || '',
        supportEmail: tenant.supportEmail || '',
        supportPhone: tenant.supportPhone || '',
        whatsappConnected: !!tenant.whatsappConnected,
        chatbotEnabled: !!tenant.chatbotEnabled,
        enableSmartReviews: !!tenant.enableSmartReviews,
        autonomousEnabled: !!tenant.autonomousEnabled,
      });
    }
  }, [tenant]);

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['super-admin-plans', 'ACTIVE'],
    queryFn: () => fetchApi('/super-admin/plans?status=ACTIVE'),
  });

  const { data: effectiveLimits, isLoading: limitsLoading, refetch: refetchLimits } = useQuery({
    queryKey: ['super-admin-effective-limits', id],
    queryFn: () => fetchApi(`/super-admin/tenants/${id}/effective-limits`),
    enabled: !!id,
  });

  const { data: blueprints, isLoading: blueprintsLoading } = useQuery({
    queryKey: ['super-admin-blueprints'],
    queryFn: () => fetchApi('/super-admin/blueprints'),
    enabled: !!id,
  });

  // Preselect first blueprint & first service if available
  useEffect(() => {
    if (blueprints && blueprints.length > 0 && !selectedBlueprintId) {
      setSelectedBlueprintId(blueprints[0].id);
    }
  }, [blueprints, selectedBlueprintId]);

  useEffect(() => {
    if (tenant?.services && tenant.services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(tenant.services[0].id);
    }
  }, [tenant, selectedServiceId]);

  // User & Demo Account Management Modals State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'OWNER',
    isDemo: true,
    demoDays: 30,
  });

  const [newPasswordValue, setNewPasswordValue] = useState('');

  const createUserMutation = useMutation({
    mutationFn: (data: any) =>
      fetchApi('/super-admin/users', {
        method: 'POST',
        body: JSON.stringify({ ...data, tenantId: id }),
      }),
    onSuccess: (res: any) => {
      toast.success(`Account provisioned successfully${res.isDemo ? ' (Demo mode active with 123456 bypass)' : ''}`);
      setShowAddUserModal(false);
      setNewUserForm({
        name: '',
        email: '',
        password: '',
        role: 'OWNER',
        isDemo: true,
        demoDays: 30,
      });
      queryClient.invalidateQueries({ queryKey: ['super-admin-tenant', id] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create user account'),
  });

  const toggleDemoMutation = useMutation({
    mutationFn: ({ userId, isDemo, demoDays }: any) =>
      fetchApi(`/super-admin/users/${userId}/toggle-demo`, {
        method: 'PATCH',
        body: JSON.stringify({ isDemo, demoDays }),
      }),
    onSuccess: (_, vars) => {
      toast.success(
        vars.isDemo
          ? 'Switched to Demo Account (Direct login + 123456 bypass enabled)'
          : 'Switched to Standard Account (Standard OTP enabled)',
      );
      queryClient.invalidateQueries({ queryKey: ['super-admin-tenant', id] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update demo status'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, password }: any) =>
      fetchApi(`/super-admin/users/${userId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      }),
    onSuccess: () => {
      toast.success('Password updated successfully');
      setShowResetPasswordModal(false);
      setSelectedUserForPassword(null);
      setNewPasswordValue('');
      queryClient.invalidateQueries({ queryKey: ['super-admin-tenant', id] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update password'),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) =>
      fetchApi(`/super-admin/users/${userId}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('User account removed');
      setUserToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['super-admin-tenant', id] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to remove user account'),
  });

  // Mutations
  const assignPlanMutation = useMutation({
    mutationFn: (data: any) =>
      fetchApi(`/super-admin/tenants/${id}/assign-plan`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success('Plan assigned successfully');
      setShowAssignPlanModal(false);
      queryClient.invalidateQueries({ queryKey: ['super-admin-tenant', id] });
    },
    onError: () => toast.error('Failed to assign plan'),
  });

  const cancelPlanMutation = useMutation({
    mutationFn: () => fetchApi(`/super-admin/tenants/${id}/cancel-plan`, { method: 'POST' }),
    onSuccess: () => {
      toast.success('Plan cancelled');
      queryClient.invalidateQueries({ queryKey: ['super-admin-tenant', id] });
    },
    onError: () => toast.error('Failed to cancel plan'),
  });

  const extendSubscriptionMutation = useMutation({
    mutationFn: (days: number) =>
      fetchApi(`/super-admin/tenants/${id}/extend-subscription`, {
        method: 'POST',
        body: JSON.stringify({ days }),
      }),
    onSuccess: () => {
      toast.success('Subscription extended successfully');
      queryClient.invalidateQueries({ queryKey: ['super-admin-tenant', id] });
    },
    onError: () => toast.error('Failed to extend subscription'),
  });

  const syncLimitsMutation = useMutation({
    mutationFn: () =>
      fetchApi(`/super-admin/tenants/${id}/sync-limits`, {
        method: 'POST',
      }),
    onSuccess: () => {
      toast.success('Workspace limits synchronized with plan!');
      queryClient.invalidateQueries({ queryKey: ['super-admin-tenant', id] });
    },
    onError: () => toast.error('Failed to sync limits'),
  });

  const deleteTenantMutation = useMutation({
    mutationFn: (tenantId: string) => fetchApi(`/super-admin/tenants/${tenantId}`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Business removed'); router.push('/super-admin/tenants'); },
    onError: () => toast.error('Failed to remove business'),
  });

  const updateTenantMutation = useMutation({
    mutationFn: (data: any) =>
      fetchApi(`/super-admin/tenants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success('Settings updated');
      queryClient.invalidateQueries({ queryKey: ['super-admin-tenant', id] });
    },
    onError: () => toast.error('Failed to update settings'),
  });

  const setCustomLimitsMutation = useMutation({
    mutationFn: (dto: any) =>
      fetchApi(`/super-admin/tenants/${id}/custom-limits`, { method: 'PATCH', body: JSON.stringify(dto) }),
    onSuccess: () => {
      toast.success('Enterprise limits saved');
      setEditingLimits(false);
      setPendingLimits({});
      setPendingFeatures({});
      setLimitsNote('');
      queryClient.invalidateQueries({ queryKey: ['super-admin-effective-limits', id] });
      refetchLimits();
    },
    onError: () => toast.error('Failed to save limits'),
  });

  const pushBlueprintMutation = useMutation({
    mutationFn: ({ blueprintId, name }: any) =>
      fetchApi(`/super-admin/blueprints/${blueprintId}/push-to-tenant`, {
        method: 'POST',
        body: JSON.stringify({ tenantId: id, name }),
      }),
    onSuccess: () => {
      toast.success('Blueprint pushed to tenant library');
      setShowBlueprintDrawer(false);
      queryClient.invalidateQueries({ queryKey: ['super-admin-blueprints'] });
    },
    onError: () => toast.error('Failed to push blueprint'),
  });

  const applyBlueprintMutation = useMutation({
    mutationFn: ({ blueprintId, serviceId }: any) =>
      fetchApi(`/super-admin/tenants/${id}/apply-blueprint`, {
        method: 'POST',
        body: JSON.stringify({ blueprintId, serviceId }),
      }),
    onSuccess: () => {
      toast.success('Blueprint applied — white-glove setup complete!');
      setShowBlueprintDrawer(false);
    },
    onError: () => toast.error('Failed to apply blueprint'),
  });

  const handleCancelPlan = () => {
    setShowCancelPlanConfirm(true);
  };
  const handleDelete = () => {
    setShowDeleteTenantConfirm(true);
  };
  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateTenantMutation.mutate(editForm);
  };

  const handleSaveLimits = () => {
    const dto: any = {};
    if (pendingLimits.maxVisits !== undefined) dto.maxVisits = pendingLimits.maxVisits;
    if (pendingLimits.maxServices !== undefined) {
      dto.maxServices = pendingLimits.maxServices;
      dto.maxQueues = pendingLimits.maxServices;
    }
    if (pendingLimits.maxLocations !== undefined) dto.maxLocations = pendingLimits.maxLocations;
    if (pendingLimits.maxStaff !== undefined) dto.maxStaff = pendingLimits.maxStaff;
    if (Object.keys(pendingFeatures).length > 0) dto.customFeatures = pendingFeatures;
    if (limitsNote) dto.note = limitsNote;
    setCustomLimitsMutation.mutate(dto);
  };

  const isEnterprise = effectiveLimits?.source === 'enterprise_override';
  const TABS = ['overview', 'users', 'subscription', 'settings', 'enterprise'] as const;

  if (isLoading) {
    return (
      <SuperAdminLayout pageTitle="Business Details" pageSubtitle="Loading...">
        <Head><title>Business Details | Super Admin</title></Head>
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-12">
          <div className="h-10 w-48 bg-gray-200 dark:bg-white/5 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white dark:bg-zinc-950 rounded-3xl border border-gray-200 dark:border-white/10 animate-pulse" />)}
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  if (!tenant) {
    return (
      <SuperAdminLayout pageTitle="Business Not Found" pageSubtitle="Does not exist">
        <Head><title>Not Found | Super Admin</title></Head>
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 dark:text-zinc-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Business Not Found</h2>
          <Link href="/super-admin/tenants" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-all">
            <ArrowLeft className="w-4 h-4" /> Back to Businesses
          </Link>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout pageTitle={tenant.name} pageSubtitle="Advanced business management and telemetry">
      <Head><title>{tenant.name} | Super Admin</title></Head>

      <div className="w-full mx-auto space-y-6 pb-12">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-950/80 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Link
              href="/super-admin/tenants"
              className="p-2.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl text-gray-400 dark:text-zinc-500 transition-colors border border-gray-200 dark:border-white/5"
              title="Back to Businesses"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">{tenant.name}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  tenant.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                  tenant.subscriptionStatus === 'TRIAL' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                  'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  {tenant.subscriptionStatus}
                </span>
                {isEnterprise && (
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center gap-1.5 shadow-md shadow-amber-500/25">
                    <Crown className="w-3.5 h-3.5" /> Enterprise Fleet
                  </span>
                )}
              </div>
              <p className="text-gray-500 dark:text-zinc-400 mt-1 font-mono text-xs flex items-center gap-2 flex-wrap">
                <span>ID: {tenant.id}</span>
                <span>•</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{tenant.subdomain}.qmova.com</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => toast.info('Impersonation requires a secure token exchange endpoint.')}
              className="px-4 py-2.5 bg-gray-900 dark:bg-white/10 hover:bg-gray-800 dark:hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 border border-white/10"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Login as Business
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 border-b border-gray-200 dark:border-white/10 overflow-x-auto no-scrollbar pb-px">
          {TABS.map(tab => {
            const icons: Record<string, React.ReactNode> = {
              overview: <Activity className="w-4 h-4" />,
              users: <Users className="w-4 h-4" />,
              subscription: <CreditCard className="w-4 h-4" />,
              settings: <Settings className="w-4 h-4" />,
              enterprise: <Crown className="w-4 h-4 text-amber-500" />,
            };
            const isTabActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-4 text-sm font-bold capitalize transition-all border-b-2 whitespace-nowrap flex items-center gap-2 rounded-t-xl ${
                  isTabActive
                    ? tab === 'enterprise'
                      ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5'
                      : 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5'
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-white/5'
                }`}
              >
                {icons[tab]}
                <span>{tab}</span>
                {tab === 'enterprise' && isEnterprise && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Total Customers', val: tenant._count?.customers || 0, color: 'text-blue-500' },
                { label: 'Total Visits', val: tenant._count?.visits || 0, color: 'text-emerald-500' },
                { label: 'Active Queues', val: tenant._count?.queues || 0, color: 'text-indigo-500' },
                { label: 'Services', val: tenant._count?.services || 0, color: 'text-purple-500' },
                { label: 'Staff Members', val: tenant._count?.staffMembers || 0, color: 'text-amber-500' },
                { label: 'Appointments', val: tenant._count?.appointments || 0, color: 'text-rose-500' },
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">{stat.label}</div>
                  <div className={`text-3xl font-black ${stat.color}`}>{stat.val.toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-500" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Physical Locations</h2>
              </div>
              <table className="w-full text-left text-sm text-gray-600 dark:text-zinc-400">
                <thead className="bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-zinc-200 font-bold uppercase tracking-wider text-xs border-b border-gray-200 dark:border-white/10">
                  <tr>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Address</th>
                    <th className="px-6 py-4">Timezone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {(!tenant.locations || tenant.locations.length === 0) ? (
                    <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400 dark:text-zinc-500">No locations configured.</td></tr>
                  ) : tenant.locations.map((loc: any) => (
                    <tr key={loc.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center gap-2"><Store className="w-4 h-4 text-gray-400" />{loc.name}</td>
                      <td className="px-6 py-4 text-gray-500">{loc.address || 'No address'}</td>
                      <td className="px-6 py-4 font-mono text-xs">{loc.timezone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/10 rounded-3xl flex items-center justify-between">
              <div>
                <h3 className="font-bold text-rose-900 dark:text-rose-400 flex items-center gap-2"><AlertCircle className="w-5 h-5" />Danger Zone</h3>
                <p className="text-sm text-rose-700 dark:text-rose-300 mt-1">Permanently remove this business and all associated data.</p>
              </div>
              <button onClick={handleDelete} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition-transform active:scale-95 shadow-sm">Delete Tenant</button>
            </div>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === 'users' && (() => {
          const usersList = tenant.users || [];
          const demoCount = usersList.filter((u: any) => u.isDemo).length;

          return (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-gray-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <Users className="w-5 h-5 text-indigo-500" />
                      <h2 className="text-base font-bold text-gray-900 dark:text-white">Tenant User Accounts & Access</h2>
                      <div className="flex items-center gap-1.5 ml-2">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300">
                          {usersList.length} User{usersList.length === 1 ? '' : 's'}
                        </span>
                        {demoCount > 0 && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500" /> {demoCount} Demo Mode
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                      Manage login credentials, set passwords, and enable zero-friction demo mode (instant login + 123456 OTP bypass).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setNewUserForm({
                        name: '',
                        email: '',
                        password: `Demo#${Math.floor(1000 + Math.random() * 9000)}`,
                        role: 'OWNER',
                        isDemo: true,
                        demoDays: 30,
                      });
                      setShowAddUserModal(true);
                    }}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" /> Provision New Account
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600 dark:text-zinc-400">
                    <thead className="bg-gray-50 dark:bg-white/5 text-xs font-bold uppercase tracking-wider border-b border-gray-200 dark:border-white/10 text-gray-900 dark:text-zinc-200">
                      <tr>
                        <th className="px-6 py-4">User / Email</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Access Mode</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {usersList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-gray-400 dark:text-zinc-500">
                            No users provisioned for this business yet. Click &ldquo;Provision New Account&rdquo; to create one.
                          </td>
                        </tr>
                      ) : (
                        usersList.map((u: any) => {
                          const isDemo = Boolean(u.isDemo);
                          const isExpired = isDemo && u.demoExpiresAt && new Date(u.demoExpiresAt) < new Date();
                          return (
                            <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                  <span>{u.name || 'Unnamed Account'}</span>
                                  {isDemo && (
                                    <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                      DEMO
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 font-mono mt-0.5 flex items-center gap-1.5">
                                  <span>{u.email}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(u.email);
                                      toast.success('Email copied to clipboard');
                                    }}
                                    className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded transition-colors"
                                    title="Copy email"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>

                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    u.role === 'SUPER_ADMIN'
                                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/10 dark:text-purple-400'
                                      : u.role === 'OWNER'
                                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400'
                                      : u.role === 'MANAGER'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-500/10 dark:text-gray-400'
                                  }`}
                                >
                                  {u.role.replace(/_/g, ' ')}
                                </span>
                              </td>

                              <td className="px-6 py-4">
                                {isDemo ? (
                                  <div>
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                      <span>Demo Account</span>
                                    </div>
                                    <div className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1 flex items-center gap-2">
                                      <span>OTP bypass: <strong className="text-zinc-700 dark:text-zinc-300 font-mono">123456</strong></span>
                                      {u.demoExpiresAt ? (
                                        <span className={isExpired ? 'text-rose-500 font-bold' : 'text-zinc-400'}>
                                          • {isExpired ? 'Expired' : `Expires ${format(new Date(u.demoExpiresAt), 'MMM d, yyyy')}`}
                                        </span>
                                      ) : (
                                        <span>• No Expiry</span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700">
                                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Standard Account
                                    </span>
                                    <div className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                                      Full 2FA OTP verification required
                                    </div>
                                  </div>
                                )}
                              </td>

                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleDemoMutation.mutate({
                                        userId: u.id,
                                        isDemo: !isDemo,
                                        demoDays: 30,
                                      })
                                    }
                                    disabled={toggleDemoMutation.isPending}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1 ${
                                      isDemo
                                        ? 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                        : 'text-amber-600 dark:text-amber-400 hover:text-amber-700 border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30'
                                    }`}
                                    title={isDemo ? 'Switch back to standard account' : 'Enable zero-friction demo mode'}
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    {isDemo ? 'Disable Demo' : 'Make Demo'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedUserForPassword(u);
                                      setNewPasswordValue('');
                                      setShowResetPasswordModal(true);
                                    }}
                                    className="p-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                    title="Set or reset account password"
                                  >
                                    <KeyRound className="w-4 h-4" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setUserToDelete(u)}
                                    className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                    title="Delete user account"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── SUBSCRIPTION TAB ── */}
        {activeTab === 'subscription' && (() => {
          const currentSub = tenant.subscription || tenant.subscriptions;
          const isComplimentary = Boolean(currentSub?.isComplimentary || (currentSub?.metadata as any)?.isFree || currentSub?.plan?.price === 0);
          const effectiveEnd = currentSub?.nextBillingDate || currentSub?.renewalDate || currentSub?.currentPeriodEnd;
          const daysRemaining = effectiveEnd ? Math.max(0, Math.ceil((new Date(effectiveEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

          return (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-gradient-to-br from-indigo-950/80 via-zinc-900/90 to-black border border-indigo-500/30 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        tenant.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        tenant.subscriptionStatus === 'TRIAL' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        {tenant.subscriptionStatus}
                      </span>

                      {currentSub && (
                        <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider border border-white/15">
                          {isComplimentary ? 'Complimentary Access' : `${currentSub.billingInterval || 'Monthly'} Billing`}
                        </span>
                      )}
                    </div>

                    <h3 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                      {currentSub?.plan?.name || 'No Active Plan'}
                      {currentSub?.plan?.name?.toLowerCase().includes('enterprise') && (
                        <Crown className="w-7 h-7 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]" />
                      )}
                    </h3>

                    <p className="text-zinc-300 text-sm mt-2 max-w-xl leading-relaxed">
                      {currentSub ? (
                        <>
                          {isComplimentary ? 'Granted with complimentary enterprise access. ' : `Standard paid subscription at ${currentSub.plan?.currency || 'ZAR'} ${Number((currentSub.plan?.price || 0) / 100).toFixed(2)} / ${currentSub.billingInterval || 'mo'}. `}
                          {effectiveEnd && (
                            <span>Active through <strong className="text-white">{format(new Date(effectiveEnd), 'MMMM d, yyyy')}</strong> ({daysRemaining} days remaining).</span>
                          )}
                        </>
                      ) : (
                        'Tenant currently has no active subscription assigned. Select a plan below.'
                      )}
                    </p>

                    {currentSub && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10 text-xs">
                        <div>
                          <span className="text-zinc-400 block mb-1">Period Started</span>
                          <span className="font-semibold text-white">
                            {currentSub.currentPeriodStart ? format(new Date(currentSub.currentPeriodStart), 'MMM d, yyyy') : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-400 block mb-1">Effective Expiry / Renewal</span>
                          <span className="font-semibold text-emerald-400">
                            {effectiveEnd ? format(new Date(effectiveEnd), 'MMM d, yyyy') : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-400 block mb-1">License Classification</span>
                          <span className="font-semibold text-indigo-300">
                            {isComplimentary ? 'Complimentary VIP / Internal' : 'Standard Commercial'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2.5 shrink-0 min-w-[220px]">
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Quick Extensions</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => extendSubscriptionMutation.mutate(30)}
                        disabled={extendSubscriptionMutation.isPending || !currentSub}
                        className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all border border-white/15"
                      >
                        +30 Days
                      </button>
                      <button
                        onClick={() => extendSubscriptionMutation.mutate(90)}
                        disabled={extendSubscriptionMutation.isPending || !currentSub}
                        className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all border border-white/15"
                      >
                        +90 Days
                      </button>
                      <button
                        onClick={() => extendSubscriptionMutation.mutate(365)}
                        disabled={extendSubscriptionMutation.isPending || !currentSub}
                        className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all border border-white/15"
                      >
                        +1 Year
                      </button>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => syncLimitsMutation.mutate()}
                        disabled={syncLimitsMutation.isPending || !currentSub}
                        className="flex-1 px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-xl text-xs font-bold transition-all border border-indigo-500/30 flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncLimitsMutation.isPending ? 'animate-spin' : ''}`} />
                        Sync Limits
                      </button>
                      <button
                        onClick={() => setShowAssignPlanModal(true)}
                        className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20"
                      >
                        Force Assign
                      </button>
                    </div>

                    {(tenant.subscriptionStatus === 'ACTIVE' || tenant.subscriptionStatus === 'TRIAL') && (
                      <button 
                        onClick={handleCancelPlan} 
                        disabled={cancelPlanMutation.isPending} 
                        className="w-full mt-1 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors border border-rose-500/20 font-medium disabled:opacity-50"
                      >
                        Revoke License Access
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center flex-wrap gap-3">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2"><CreditCard className="w-5 h-5 text-indigo-500" />Transaction History & Invoicing</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600 dark:text-zinc-400">
                    <thead className="bg-gray-50 dark:bg-white/5 text-xs font-bold uppercase tracking-wider border-b border-gray-200 dark:border-white/10 text-gray-900 dark:text-zinc-200">
                      <tr>
                        <th className="px-6 py-4">Transaction ID</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {(!tenant.transactions || tenant.transactions.length === 0) ? (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400 dark:text-zinc-500">
                          {isComplimentary ? 'No billing transactions recorded — tenant is active under a complimentary license.' : 'No payment history found.'}
                        </td></tr>
                      ) : tenant.transactions.map((tx: any) => (
                        <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-gray-500 break-all max-w-[150px] sm:max-w-none">{tx.id}</td>
                          <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{tx.currency} {Number((tx.amount || 0) / 100).toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              ['COMPLETE','SUCCEEDED'].includes(tx.status) ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400' :
                              ['PENDING','PROCESSING'].includes(tx.status) ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400' :
                              'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400'
                            }`}>{tx.status}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-sm">{tx.createdAt ? format(new Date(tx.createdAt), 'MMM d, yyyy h:mm a') : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── SETTINGS TAB ── */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <form onSubmit={handleUpdateSettings} className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6"><Settings className="w-5 h-5 text-indigo-500" />Platform Overrides & Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-1">Business Name</label>
                  <input type="text" required value={editForm.name} onChange={e => setEditForm(p => ({...p, name: e.target.value}))} className="w-full h-11 px-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-1">Subdomain Route</label>
                  <div className="flex">
                    <input type="text" required value={editForm.subdomain} onChange={e => setEditForm(p => ({...p, subdomain: e.target.value}))} className="w-full h-11 px-4 rounded-l-xl border border-r-0 border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                    <div className="h-11 px-4 flex items-center bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-r-xl text-gray-500 dark:text-zinc-400 font-mono text-sm">.qmova.com</div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-1">Support Email</label>
                  <input type="email" value={editForm.supportEmail} onChange={e => setEditForm(p => ({...p, supportEmail: e.target.value}))} className="w-full h-11 px-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-1">Support Phone</label>
                  <input type="text" value={editForm.supportPhone} onChange={e => setEditForm(p => ({...p, supportPhone: e.target.value}))} className="w-full h-11 px-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2 mb-4">Feature Toggles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {[
                  { id: 'whatsappConnected', label: 'WhatsApp Core Connected', desc: 'Is the Evolution API session paired?' },
                  { id: 'chatbotEnabled', label: 'AI Chatbot Auto-Replies', desc: 'Is the WhatsApp bot active?' },
                  { id: 'enableSmartReviews', label: 'Smart Google Reviews', desc: 'Automated NPS & review routing?' },
                  { id: 'autonomousEnabled', label: 'Fully Autonomous Mode', desc: 'Allows AI agents to act on behalf of staff' },
                ].map(toggle => (
                  <label key={toggle.id} className="flex items-start gap-3 p-4 border border-gray-200 dark:border-white/10 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <input type="checkbox" checked={editForm[toggle.id as keyof typeof editForm] as boolean} onChange={e => setEditForm(p => ({...p, [toggle.id]: e.target.checked}))} className="w-5 h-5 mt-0.5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">{toggle.label}</div>
                      <div className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{toggle.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-white/10">
                <button type="submit" disabled={updateTenantMutation.isPending} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium shadow-sm transition-transform active:scale-95">
                  {updateTenantMutation.isPending ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ENTERPRISE TAB (10/10 Overhaul)
           ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'enterprise' && (
          <div className="space-y-6 animate-in fade-in duration-200">

            {/* Enterprise Command Hero Card */}
            <div className={`relative rounded-3xl p-6 sm:p-8 border shadow-xl overflow-hidden transition-all ${
              isEnterprise
                ? 'bg-gradient-to-br from-amber-950/40 via-zinc-950 to-black border-amber-500/30'
                : 'bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-black border-white/10'
            }`}>
              {/* Radial ambient glow */}
              <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none ${isEnterprise ? 'bg-amber-500' : 'bg-indigo-500'}`} />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start sm:items-center gap-5 min-w-0 flex-1">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl shrink-0 ${
                    isEnterprise
                      ? 'bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-amber-500/25 ring-2 ring-amber-400/30'
                      : 'bg-white/10 text-zinc-400 border border-white/10'
                  }`}>
                    <Crown className="w-8 h-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                      <h2 className="text-2xl font-black text-white tracking-tight">
                        {isEnterprise ? 'Enterprise Fleet Account' : 'Standard Commercial Account'}
                      </h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isEnterprise
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-white/10 text-zinc-400 border border-white/10'
                      }`}>
                        {isEnterprise ? 'OVERRIDE ACTIVE' : 'PLAN CONSTRAINED'}
                      </span>
                    </div>
                    <p className="text-zinc-300 text-sm max-w-xl leading-relaxed">
                      {isEnterprise
                        ? `Enterprise overrides take absolute precedence over plan limits. ${Object.keys(effectiveLimits?.customOverrides || {}).length} custom quotas applied.${effectiveLimits?.note ? ` Note: "${effectiveLimits.note}"` : ''}`
                        : 'Standard tier tenant. Activate enterprise overrides below to grant custom quotas or deploy automated white-glove workflows.'
                      }
                    </p>
                    {effectiveLimits?.planName && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
                        <span>Base Subscription:</span>
                        <span className="font-semibold text-white px-2 py-0.5 rounded-md bg-white/10 border border-white/10">{effectiveLimits.planName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Action Buttons — ALWAYS visible and prominent */}
                <div className="shrink-0 flex items-center gap-3 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={() => setEditingLimits(true)}
                    className="px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black active:scale-95 hover:shadow-amber-500/20"
                  >
                    <Sliders className="w-4 h-4" />
                    {isEnterprise ? 'Edit Limits' : 'Activate Enterprise'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBlueprintDrawerMode('apply');
                      setShowBlueprintDrawer(true);
                    }}
                    className="px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white active:scale-95 shadow-indigo-500/25"
                  >
                    <Workflow className="w-4 h-4" />
                    White-Glove Setup
                  </button>
                </div>
              </div>
            </div>

            {/* Effective Limits Overview Cards (Responsive 4-column grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Monthly Visits', val: effectiveLimits?.effectiveLimits?.maxVisits, icon: <Activity className="w-5 h-5" />, key: 'maxVisits', accent: 'emerald' },
                { label: 'Services Allowed', val: effectiveLimits?.effectiveLimits?.maxServices, icon: <Layers className="w-5 h-5" />, key: 'maxServices', accent: 'indigo' },
                { label: 'Locations / Branches', val: effectiveLimits?.effectiveLimits?.maxLocations, icon: <MapPin className="w-5 h-5" />, key: 'maxLocations', accent: 'sky' },
                { label: 'Staff Member Seats', val: effectiveLimits?.effectiveLimits?.maxStaff, icon: <Users className="w-5 h-5" />, key: 'maxStaff', accent: 'amber' },
              ].map((item) => {
                const hasOverride = effectiveLimits?.customOverrides?.[item.key] !== undefined && effectiveLimits?.customOverrides?.[item.key] !== null;
                const isUnlimited = item.val === null || item.val === undefined;

                return (
                  <div
                    key={item.key}
                    className={`rounded-3xl p-5 border shadow-sm transition-all relative overflow-hidden flex flex-col justify-between ${
                      hasOverride
                        ? 'bg-amber-500/5 border-amber-500/30 dark:bg-amber-500/5'
                        : 'bg-white dark:bg-zinc-950 border-gray-200 dark:border-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2.5 rounded-2xl ${
                          item.accent === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' :
                          item.accent === 'indigo' ? 'bg-indigo-500/10 text-indigo-500' :
                          item.accent === 'sky' ? 'bg-sky-500/10 text-sky-500' :
                          'bg-amber-500/10 text-amber-500'
                        }`}>
                          {item.icon}
                        </div>
                        {hasOverride ? (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Crown className="w-3 h-3" /> Override
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                            Plan Default
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                        {item.label}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className={`text-3xl font-black tracking-tight ${
                        isUnlimited ? 'text-emerald-500' : hasOverride ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'
                      }`}>
                        {isUnlimited ? '∞' : item.val.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
                        {isUnlimited ? 'Unlimited Capacity' : `Cap: ${item.val.toLocaleString()} max`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Resource Limits Editor */}
            <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-900 dark:text-white">Custom Resource Limits</h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">Enterprise overrides take absolute precedence over plan-level limits</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {editingLimits ? (
                    <>
                      <button
                        type="button"
                        onClick={() => { setEditingLimits(false); setPendingLimits({}); setPendingFeatures({}); }}
                        className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors uppercase tracking-wider"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveLimits}
                        disabled={setCustomLimitsMutation.isPending}
                        className="px-5 py-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black rounded-xl transition-all shadow-md flex items-center gap-2 uppercase tracking-wider disabled:opacity-50"
                      >
                        {setCustomLimitsMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        {setCustomLimitsMutation.isPending ? 'Saving...' : 'Save Overrides'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingLimits(true)}
                      className="px-4 py-2 text-xs font-bold border border-gray-200 dark:border-white/10 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors flex items-center gap-2 uppercase tracking-wider"
                    >
                      <Sliders className="w-3.5 h-3.5 text-amber-500" /> Edit Overrides
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {limitsLoading ? (
                  <div className="space-y-4">{[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse" />)}</div>
                ) : (
                  <>
                    <LimitRow
                      label="Monthly Visit Quota"
                      planVal={effectiveLimits?.effectiveLimits?.maxVisits ?? null}
                      customVal={effectiveLimits?.customOverrides?.maxVisits}
                      unit=" visits"
                      editing={editingLimits}
                      onChange={(v) => setPendingLimits((p: any) => ({ ...p, maxVisits: v }))}
                      onClear={() => setPendingLimits((p: any) => ({ ...p, maxVisits: null }))}
                      presets={[
                        { label: '5,000', value: 5000 },
                        { label: '25,000', value: 25000 },
                        { label: '100,000', value: 100000 },
                        { label: '∞ Unlimited', value: null },
                      ]}
                    />
                    <LimitRow
                      label="Maximum Services"
                      planVal={effectiveLimits?.effectiveLimits?.maxServices ?? null}
                      customVal={effectiveLimits?.customOverrides?.maxServices}
                      unit=" services"
                      editing={editingLimits}
                      onChange={(v) => setPendingLimits((p: any) => ({ ...p, maxServices: v }))}
                      onClear={() => setPendingLimits((p: any) => ({ ...p, maxServices: null }))}
                      presets={[
                        { label: '5 Services', value: 5 },
                        { label: '20 Services', value: 20 },
                        { label: '50 Services', value: 50 },
                        { label: '∞ Unlimited', value: null },
                      ]}
                    />
                    <LimitRow
                      label="Maximum Locations"
                      planVal={effectiveLimits?.effectiveLimits?.maxLocations ?? null}
                      customVal={effectiveLimits?.customOverrides?.maxLocations}
                      unit=" locations"
                      editing={editingLimits}
                      onChange={(v) => setPendingLimits((p: any) => ({ ...p, maxLocations: v }))}
                      onClear={() => setPendingLimits((p: any) => ({ ...p, maxLocations: null }))}
                      presets={[
                        { label: '1 Branch', value: 1 },
                        { label: '5 Branches', value: 5 },
                        { label: '20 Branches', value: 20 },
                        { label: '∞ Unlimited', value: null },
                      ]}
                    />
                    <LimitRow
                      label="Maximum Staff Members"
                      planVal={effectiveLimits?.effectiveLimits?.maxStaff ?? null}
                      customVal={effectiveLimits?.customOverrides?.maxStaff}
                      unit=" staff"
                      editing={editingLimits}
                      onChange={(v) => setPendingLimits((p: any) => ({ ...p, maxStaff: v }))}
                      onClear={() => setPendingLimits((p: any) => ({ ...p, maxStaff: null }))}
                      presets={[
                        { label: '5 Staff', value: 5 },
                        { label: '25 Staff', value: 25 },
                        { label: '100 Staff', value: 100 },
                        { label: '∞ Unlimited', value: null },
                      ]}
                    />

                    {editingLimits && (
                      <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-2">
                          Audit Trail Note <span className="font-normal text-gray-400 lowercase">(internal admin reason)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Enterprise VIP contract signed, custom quote #8821"
                          value={limitsNote}
                          onChange={e => setLimitsNote(e.target.value)}
                          className="w-full h-11 px-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Feature Flag Overrides */}
            <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-white/10 flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-500">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">Enterprise Feature Flags</h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">Enable or disable specific features for this tenant beyond base plan entitlements</p>
                </div>
              </div>
              <div className="p-6">
                {[
                  { key: 'customBranding', label: 'Custom Branding & White-label', desc: 'Allows logo, custom colours, and removal of Qmova branding' },
                  { key: 'analyticsAdvanced', label: 'Advanced Telemetry & Analytics', desc: 'Historical data export, cohort reports, and performance attribution' },
                  { key: 'whatsappMultiChannel', label: 'Multi-Channel WhatsApp Core', desc: 'Multiple WhatsApp numbers / instances per business account' },
                  { key: 'prioritySupport', label: 'Priority Support SLA', desc: 'Routes account to dedicated emergency support queue' },
                  { key: 'apiAccess', label: 'Public REST API & Webhooks', desc: 'Direct programmatic access to API keys and outbound event hooks' },
                  { key: 'customDomain', label: 'Custom CNAME Domain Mapping', desc: 'e.g. queue.clientbrand.com as a custom branded endpoint' },
                ].map(feature => (
                  <FeatureToggleRow
                    key={feature.key}
                    label={feature.label}
                    desc={feature.desc}
                    planVal={effectiveLimits?.effectiveFeatures?.[feature.key]}
                    customVal={effectiveLimits?.customFeatureOverrides?.[feature.key] !== undefined
                      ? effectiveLimits.customFeatureOverrides[feature.key]
                      : pendingFeatures[feature.key]}
                    editing={editingLimits}
                    onChange={(v: any) => setPendingFeatures((p: any) => ({ ...p, [feature.key]: v }))}
                  />
                ))}
              </div>
            </div>

            {/* Workflow Blueprint Library */}
            <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500">
                    <Workflow className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-900 dark:text-white">Workflow Blueprint Library</h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">Push blueprints to tenant library or apply directly to a service (white-glove)</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setBlueprintDrawerMode('push'); setShowBlueprintDrawer(true); }}
                    className="px-3.5 py-2 text-xs font-bold border border-gray-200 dark:border-white/10 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors flex items-center gap-1.5 uppercase tracking-wider"
                  >
                    <Send className="w-3.5 h-3.5 text-indigo-500" /> Push to Library
                  </button>
                  <button
                    type="button"
                    onClick={() => { setBlueprintDrawerMode('apply'); setShowBlueprintDrawer(true); }}
                    className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 uppercase tracking-wider"
                  >
                    <Workflow className="w-3.5 h-3.5" /> ⚡ White-Glove Setup
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-white/5">
                {blueprintsLoading ? (
                  <div className="p-6 space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse" />)}</div>
                ) : !blueprints || blueprints.length === 0 ? (
                  <div className="p-12 text-center">
                    <Workflow className="w-10 h-10 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-zinc-400 text-sm">No blueprints found. Run the seed script to load global templates.</p>
                  </div>
                ) : blueprints.slice(0, 8).map((bp: any) => (
                  <div key={bp.id} className="hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors">
                    <button
                      type="button"
                      onClick={() => setExpandedBlueprint(expandedBlueprint === bp.id ? null : bp.id)}
                      className="w-full text-left px-6 py-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-3 h-3 rounded-full shrink-0 ${bp.tenantId ? 'bg-amber-500 shadow-sm shadow-amber-500/50' : 'bg-indigo-500 shadow-sm shadow-indigo-500/50'}`} />
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                            {bp.name}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              bp.tenantId ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                            }`}>
                              {bp.tenantId ? 'Custom' : 'Global'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 dark:text-zinc-500 truncate mt-0.5">{bp.description}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                          {bp._count?.steps || bp.steps?.length || 0} steps
                        </span>
                        {expandedBlueprint === bp.id ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>

                    {expandedBlueprint === bp.id && bp.steps && (
                      <div className="px-6 pb-5 pt-1">
                        <div className="bg-gray-50 dark:bg-white/3 rounded-2xl p-4 border border-gray-200 dark:border-white/5">
                          <div className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                            Step Progression Pipeline
                          </div>
                          <div className="space-y-2">
                            {bp.steps.map((step: any) => (
                              <div key={step.id} className="flex items-center gap-3 p-2 bg-white dark:bg-zinc-900/60 rounded-xl border border-gray-100 dark:border-white/5">
                                <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-bold flex items-center justify-center shrink-0">
                                  {step.stepOrder}
                                </div>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white flex-1 min-w-0">{step.name}</span>
                                {step.isOptional && <span className="text-xs text-gray-400 font-medium">(optional)</span>}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                  step.type === 'SERVICE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                                  step.type === 'CHECKPOINT' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                  step.type === 'PAYMENT' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                                  'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400'
                                }`}>
                                  {step.type}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-white/10">
                            <button
                              type="button"
                              onClick={() => { setSelectedBlueprintId(bp.id); setBlueprintDrawerMode('push'); setShowBlueprintDrawer(true); }}
                              className="flex-1 py-2 text-xs font-bold border border-gray-200 dark:border-white/10 text-gray-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-white/5 rounded-xl transition-colors flex items-center justify-center gap-1.5 uppercase tracking-wider"
                            >
                              <Send className="w-3.5 h-3.5 text-indigo-500" /> Push to Library
                            </button>
                            <button
                              type="button"
                              onClick={() => { setSelectedBlueprintId(bp.id); setBlueprintDrawerMode('apply'); setShowBlueprintDrawer(true); }}
                              className="flex-1 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors flex items-center justify-center gap-1.5 uppercase tracking-wider shadow-sm"
                            >
                              <Target className="w-3.5 h-3.5" /> ⚡ Apply to Service
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── ASSIGN PLAN MODAL (Portalled to document.body) ── */}
      {mounted && showAssignPlanModal && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assign Subscription Plan</h2>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Provision immediate tier entitlements and duration</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignPlanModal(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">Select Target Plan</label>
                {plansLoading ? (
                  <div className="h-12 bg-gray-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
                ) : (
                  <select
                    value={selectedPlanId}
                    onChange={e => setSelectedPlanId(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                  >
                    <option value="">-- Choose a plan --</option>
                    {plans?.map((plan: any) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} — {plan.currency} {Number((plan.price || 0) / 100).toFixed(2)} / {plan.billingInterval || 'month'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">Duration Presets</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[
                    { label: '30 Days', interval: 'MONTHLY', days: 30 },
                    { label: '90 Days', interval: 'CUSTOM', days: 90 },
                    { label: '1 Year', interval: 'YEARLY', days: 365 },
                    { label: 'Lifetime', interval: 'CUSTOM', days: 36500 },
                  ].map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setBillingInterval(preset.interval);
                        const targetDate = new Date(Date.now() + preset.days * 24 * 60 * 60 * 1000);
                        setCustomEndDate(targetDate.toISOString().split('T')[0]);
                      }}
                      className="px-3 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 rounded-xl text-xs font-semibold transition-colors border border-gray-200 dark:border-white/5"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1">Billing Interval Mode</label>
                    <select
                      value={billingInterval}
                      onChange={e => setBillingInterval(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                    >
                      <option value="MONTHLY">Monthly (30 Days)</option>
                      <option value="YEARLY">Yearly (365 Days)</option>
                      <option value="CUSTOM">Custom Specific Date</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1">Expiry / Renewal Date</label>
                    <input
                      type="date"
                      value={customEndDate || (() => {
                        const days = billingInterval === 'YEARLY' ? 365 : 30;
                        return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                      })()}
                      onChange={e => {
                        setBillingInterval('CUSTOM');
                        setCustomEndDate(e.target.value);
                      }}
                      className="w-full h-11 px-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFree}
                    onChange={e => setIsFree(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white block">Grant as Free / Complimentary License</span>
                    <span className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 block">
                      Waives payment mandates and activates full tier limits for internal, VIP, or trial accounts without auto-billing.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowAssignPlanModal(false)}
                className="px-5 py-2.5 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl font-medium transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedPlanId) {
                    const finalEndDate = customEndDate || (billingInterval === 'YEARLY'
                      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                    );
                    assignPlanMutation.mutate({
                      planId: selectedPlanId,
                      billingInterval,
                      customEndDate: finalEndDate,
                      isFree,
                    });
                  }
                }}
                disabled={!selectedPlanId || assignPlanMutation.isPending}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-all shadow-md shadow-indigo-600/20 text-sm flex items-center gap-2"
              >
                {assignPlanMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {assignPlanMutation.isPending ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── WHITE-GLOVE SETUP DRAWER (Portalled to document.body) ── */}
      {mounted && showBlueprintDrawer && createPortal(
        <div
          className="fixed inset-0 z-[120] flex justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowBlueprintDrawer(false)}
        >
          <div
            className="w-full max-w-xl h-full bg-white dark:bg-zinc-950 border-l border-gray-200 dark:border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Pinned Header */}
            <div className="px-6 py-5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-950">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                  blueprintDrawerMode === 'apply'
                    ? 'bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-amber-500/20'
                    : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-500/20'
                }`}>
                  {blueprintDrawerMode === 'apply' ? <Zap className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-gray-900 dark:text-white truncate">
                    {blueprintDrawerMode === 'apply' ? '⚡ White-Glove Service Configuration' : 'Push Blueprint to Library'}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                    {blueprintDrawerMode === 'apply'
                      ? `Deploy automated journey directly to ${tenant.name}'s service`
                      : `Clone blueprint to ${tenant.name}'s private template library`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBlueprintDrawer(false)}
                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Segmented Mode Control */}
            <div className="px-6 pt-4 shrink-0">
              <div className="grid grid-cols-2 p-1.5 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setBlueprintDrawerMode('apply')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                    blueprintDrawerMode === 'apply'
                      ? 'bg-amber-500 text-black shadow-sm font-black'
                      : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Target className="w-4 h-4" /> ⚡ Apply to Service (White-Glove)
                </button>
                <button
                  type="button"
                  onClick={() => setBlueprintDrawerMode('push')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                    blueprintDrawerMode === 'push'
                      ? 'bg-indigo-600 text-white shadow-sm font-black'
                      : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Send className="w-4 h-4" /> 📦 Push to Library
                </button>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {/* Notice Callout */}
              {blueprintDrawerMode === 'apply' ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <strong className="font-bold text-amber-900 dark:text-amber-200 block mb-0.5">White-Glove Deployment:</strong>
                    This replaces the existing workflow on the selected service with a comprehensive, multi-step customer journey. The tenant can immediately use it and customize steps anytime.
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-start gap-3">
                  <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <strong className="font-bold text-indigo-900 dark:text-indigo-200 block mb-0.5">Library Ingestion:</strong>
                    Adds a private, editable clone to this tenant's template library. The global system blueprint remains untouched.
                  </div>
                </div>
              )}

              {/* Step 1: Select Blueprint */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-zinc-300">
                    Step 1: Select Workflow Blueprint
                  </label>
                  <span className="text-[11px] text-gray-400 dark:text-zinc-500">
                    {blueprints?.length || 0} templates available
                  </span>
                </div>

                {blueprintsLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse" />)}</div>
                ) : !blueprints || blueprints.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-gray-300 dark:border-zinc-800 rounded-2xl text-gray-400">
                    No blueprints found.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                    {blueprints.map((bp: any) => {
                      const isSelected = selectedBlueprintId === bp.id;
                      return (
                        <div
                          key={bp.id}
                          onClick={() => setSelectedBlueprintId(bp.id)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-amber-500/10 border-amber-500 dark:bg-amber-500/10 dark:border-amber-500 ring-2 ring-amber-500/20'
                              : 'bg-white dark:bg-zinc-900/60 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                              isSelected
                                ? 'border-amber-500 bg-amber-500 text-black'
                                : 'border-gray-300 dark:border-zinc-700'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-bold text-sm text-gray-900 dark:text-white">{bp.name}</span>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  bp.tenantId
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                                }`}>
                                  {bp.tenantId ? 'Custom' : 'Global'}
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-zinc-500 ml-auto font-bold">
                                  {bp._count?.steps || bp.steps?.length || 0} steps
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">{bp.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 2: Target Service (Apply mode) */}
              {blueprintDrawerMode === 'apply' && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-zinc-300">
                      Step 2: Select Target Service
                    </label>
                    <span className="text-[11px] text-gray-400 dark:text-zinc-500">
                      {tenant.services?.length || 0} services configured
                    </span>
                  </div>

                  {!tenant.services || tenant.services.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-gray-300 dark:border-zinc-800 rounded-2xl text-gray-400 text-sm">
                      No services found for this tenant. The tenant must create at least one service before applying a white-glove blueprint.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                      {tenant.services.map((svc: any) => {
                        const isSelected = selectedServiceId === svc.id;
                        return (
                          <div
                            key={svc.id}
                            onClick={() => setSelectedServiceId(svc.id)}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                              isSelected
                                ? 'bg-amber-500/10 border-amber-500 dark:bg-amber-500/10 dark:border-amber-500 ring-2 ring-amber-500/20'
                                : 'bg-white dark:bg-zinc-900/60 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              isSelected
                                ? 'border-amber-500 bg-amber-500 text-black'
                                : 'border-gray-300 dark:border-zinc-700'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-gray-900 dark:text-white truncate">{svc.name}</div>
                              <div className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5 flex items-center gap-2">
                                {svc.location?.name && <span>📍 {svc.location.name}</span>}
                                {svc.queues && svc.queues.length > 0 && <span>• {svc.queues.length} queue(s)</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2 (Push Mode): Optional Custom Name */}
              {blueprintDrawerMode === 'push' && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-2">
                    Custom Template Name <span className="font-normal text-gray-400 lowercase">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Leave blank to use original blueprint title"
                    value={pushCustomName}
                    onChange={e => setPushCustomName(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
              )}
            </div>

            {/* Pinned Bottom Actions */}
            <div className="p-6 border-t border-gray-200 dark:border-white/10 flex items-center gap-3 shrink-0 bg-white dark:bg-zinc-950">
              <button
                type="button"
                onClick={() => setShowBlueprintDrawer(false)}
                className="px-5 py-3 text-xs font-bold uppercase tracking-wider border border-gray-200 dark:border-white/10 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-colors"
              >
                Cancel
              </button>

              {blueprintDrawerMode === 'apply' ? (
                <button
                  type="button"
                  onClick={() => applyBlueprintMutation.mutate({ blueprintId: selectedBlueprintId, serviceId: selectedServiceId })}
                  disabled={!selectedBlueprintId || !selectedServiceId || applyBlueprintMutation.isPending}
                  className="flex-1 py-3 px-5 text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-black rounded-2xl transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
                >
                  {applyBlueprintMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {applyBlueprintMutation.isPending ? 'Deploying Journey...' : '⚡ Apply Workflow (White-Glove)'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => pushBlueprintMutation.mutate({ blueprintId: selectedBlueprintId, name: pushCustomName || undefined })}
                  disabled={!selectedBlueprintId || pushBlueprintMutation.isPending}
                  className="flex-1 py-3 px-5 text-xs font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                >
                  {pushBlueprintMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {pushBlueprintMutation.isPending ? 'Pushing to Library...' : '📦 Push to Tenant Library'}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={showCancelPlanConfirm}
        onClose={() => setShowCancelPlanConfirm(false)}
        onConfirm={async () => {
          await cancelPlanMutation.mutateAsync();
          setShowCancelPlanConfirm(false);
        }}
        title="Cancel Active Plan"
        description="Are you sure you want to cancel this tenant's active subscription plan?"
        confirmText="Cancel Plan"
        variant="warning"
        isLoading={cancelPlanMutation.isPending}
      />

      <ConfirmModal
        isOpen={showDeleteTenantConfirm}
        onClose={() => setShowDeleteTenantConfirm(false)}
        onConfirm={async () => {
          await deleteTenantMutation.mutateAsync(id as string);
          setShowDeleteTenantConfirm(false);
        }}
        title="Permanently Delete Tenant"
        description="Are you sure you want to permanently delete this tenant? All data, services, users, and queues will be completely erased. This CANNOT be undone."
        confirmText="Permanently Delete"
        variant="danger"
        isLoading={deleteTenantMutation.isPending}
      />

      {/* ── Provision User Modal ── */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">Provision New Account</h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">Add credentials for {tenant.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newUserForm.email.trim()) return toast.error('Email is required');
                if (!newUserForm.password.trim()) return toast.error('Password is required');
                createUserMutation.mutate(newUserForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  Full Name / Contact Person
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sonette (Principal) or Store Manager"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  Email Address (Login Identity)
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. client@example.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                    Account Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const gen = `Demo#${Math.floor(1000 + Math.random() * 9000)}`;
                      setNewUserForm({ ...newUserForm, password: gen });
                    }}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    🎲 Generate Password
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter login password"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl font-mono border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  Assigned Platform Role
                </label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="OWNER">Owner (Full Business Control)</option>
                  <option value="MANAGER">Manager (Operations & Service Settings)</option>
                  <option value="STAFF">Staff (Desk & Queue Terminal Operator)</option>
                  <option value="RECEPTIONIST">Receptionist (Intake & Kiosk Supervisor)</option>
                  <option value="DOCTOR">Doctor / Specialist</option>
                  <option value="NURSE">Nurse / Triage Officer</option>
                </select>
              </div>

              {/* Demo Mode Toggle Box */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newUserForm.isDemo}
                    onChange={(e) => setNewUserForm({ ...newUserForm, isDemo: e.target.checked })}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Mark as Demo Account (Zero-OTP Friction)
                    </div>
                    <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                      Enables direct password login with no OTP required. In addition, universal passcode <code className="font-bold">123456</code> is accepted for any OTP step.
                    </p>
                  </div>
                </label>

                {newUserForm.isDemo && (
                  <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-900 dark:text-amber-300">Demo Validity Period:</span>
                    <select
                      value={newUserForm.demoDays}
                      onChange={(e) => setNewUserForm({ ...newUserForm, demoDays: Number(e.target.value) })}
                      className="px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-zinc-800 text-xs font-medium text-amber-950 dark:text-amber-200 outline-none"
                    >
                      <option value={7}>7 Days Trial</option>
                      <option value={14}>14 Days Trial</option>
                      <option value={30}>30 Days Trial</option>
                      <option value={90}>90 Days Extended</option>
                      <option value={0}>Unlimited / Permanent</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2.5 text-xs font-bold border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {createUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {createUserMutation.isPending ? 'Provisioning...' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ── */}
      {showResetPasswordModal && selectedUserForPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">Change Account Password</h3>
                  <p className="text-xs text-gray-500 font-mono">{selectedUserForPassword.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowResetPasswordModal(false);
                  setSelectedUserForPassword(null);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newPasswordValue.trim()) return toast.error('Password cannot be empty');
                resetPasswordMutation.mutate({
                  userId: selectedUserForPassword.id,
                  password: newPasswordValue.trim(),
                });
              }}
              className="space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                    New Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const gen = `Demo#${Math.floor(1000 + Math.random() * 9000)}`;
                      setNewPasswordValue(gen);
                    }}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    🎲 Generate Password
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter new password"
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl font-mono border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetPasswordModal(false);
                    setSelectedUserForPassword(null);
                  }}
                  className="px-4 py-2.5 text-xs font-bold border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  className="px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {resetPasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {resetPasswordMutation.isPending ? 'Saving...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirm Modal */}
      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={async () => {
          if (!userToDelete) return;
          await deleteUserMutation.mutateAsync(userToDelete.id);
        }}
        title="Remove User Account"
        description={`Are you sure you want to remove the account for "${userToDelete?.email}"? This user will no longer be able to log in.`}
        confirmText="Remove Account"
        variant="danger"
        isLoading={deleteUserMutation.isPending}
      />
    </SuperAdminLayout>
  );
}
