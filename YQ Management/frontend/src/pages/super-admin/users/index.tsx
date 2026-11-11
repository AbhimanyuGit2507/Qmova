import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import SuperAdminLayout from '../../../components/SuperAdminLayout';
import { fetchApi } from '../../../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  Sparkles,
  ShieldCheck,
  KeyRound,
  Trash2,
  UserPlus,
  Copy,
  ExternalLink,
  Loader2,
  CheckCircle2,
  X,
  Filter,
  Building2,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ConfirmModal } from '../../../components/modals/ConfirmModal';

export default function SuperAdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'demo' | 'standard'>('all');
  const [selectedRole, setSelectedRole] = useState('ALL');

  // Modals state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  const [newUserForm, setNewUserForm] = useState({
    tenantId: '',
    name: '',
    email: '',
    password: '',
    role: 'OWNER',
    isDemo: true,
    demoDays: 30,
  });

  // Fetch all users
  const { data: users, isLoading } = useQuery({
    queryKey: ['super-admin-all-users', search, filterMode, selectedRole],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (selectedRole !== 'ALL') params.append('role', selectedRole);
      if (filterMode === 'demo') params.append('isDemo', 'true');
      if (filterMode === 'standard') params.append('isDemo', 'false');
      return fetchApi(`/super-admin/users?${params.toString()}`);
    },
  });

  // Fetch tenants for provisioning dropdown
  const { data: tenantsList } = useQuery({
    queryKey: ['super-admin-tenants-list'],
    queryFn: () => fetchApi('/super-admin/tenants'),
    enabled: showAddUserModal,
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (data: any) =>
      fetchApi('/super-admin/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (res: any) => {
      toast.success(`Account provisioned successfully${res.isDemo ? ' (Demo mode active with 123456 bypass)' : ''}`);
      setShowAddUserModal(false);
      queryClient.invalidateQueries({ queryKey: ['super-admin-all-users'] });
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
      queryClient.invalidateQueries({ queryKey: ['super-admin-all-users'] });
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
      queryClient.invalidateQueries({ queryKey: ['super-admin-all-users'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update password'),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) =>
      fetchApi(`/super-admin/users/${userId}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('User account removed');
      setUserToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['super-admin-all-users'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to remove user account'),
  });

  const allUsersList = users || [];
  const totalCount = allUsersList.length;
  const demoCount = allUsersList.filter((u: any) => u.isDemo).length;

  return (
    <SuperAdminLayout>
      <Head>
        <title>Account & Demo Management | Qmova Super Admin</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Users className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account & Demo Management</h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
              Provision tenant accounts, set passwords, and grant zero-OTP demo access without modifying codebase.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setNewUserForm({
                tenantId: tenantsList?.[0]?.id || '',
                name: '',
                email: '',
                password: `Demo#${Math.floor(1000 + Math.random() * 9000)}`,
                role: 'OWNER',
                isDemo: true,
                demoDays: 30,
              });
              setShowAddUserModal(true);
            }}
            className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Provision New Account
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Total Users</span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">
              {totalCount}
            </div>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">Across all registered businesses</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Demo Accounts</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-900 dark:text-amber-300 mt-2">
              {demoCount}
            </div>
            <p className="text-[11px] text-amber-700/70 dark:text-amber-400/70 mt-1">Direct login + 123456 OTP bypass active</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Standard 2FA</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">
              {totalCount - demoCount}
            </div>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">Standard email OTP required</p>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by email, name, or business..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-xl bg-gray-100 dark:bg-zinc-900 p-1 border border-gray-200 dark:border-zinc-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                All Accounts
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('demo')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  filterMode === 'demo'
                    ? 'bg-amber-500 text-black font-bold shadow-xs'
                    : 'text-amber-600 dark:text-amber-400 hover:text-amber-700'
                }`}
              >
                <Sparkles className="w-3 h-3" /> Demo Mode ({demoCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('standard')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filterMode === 'standard'
                    ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Standard
              </button>
            </div>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="h-10 px-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-xs font-semibold text-gray-700 dark:text-zinc-300 outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="OWNER">Owner</option>
              <option value="MANAGER">Manager</option>
              <option value="STAFF">Staff</option>
              <option value="RECEPTIONIST">Receptionist</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-zinc-400">
              <thead className="bg-gray-50 dark:bg-white/5 text-xs font-bold uppercase tracking-wider border-b border-gray-200 dark:border-white/10 text-gray-900 dark:text-zinc-200">
                <tr>
                  <th className="px-6 py-4">User & Email</th>
                  <th className="px-6 py-4">Business / Tenant</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Access Mode</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-zinc-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                      Loading platform accounts...
                    </td>
                  </tr>
                ) : allUsersList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-zinc-500">
                      No accounts found matching your query.
                    </td>
                  </tr>
                ) : (
                  allUsersList.map((u: any) => {
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
                          {u.tenant ? (
                            <Link
                              href={`/super-admin/tenants/${u.tenant.id}`}
                              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                            >
                              <Building2 className="w-3.5 h-3.5" />
                              <span>{u.tenant.name}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </Link>
                          ) : (
                            <span className="text-xs text-gray-400">Global / None</span>
                          )}
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
                                <span>Demo Mode</span>
                              </div>
                              <div className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1 flex items-center gap-2">
                                <span>OTP bypass: <strong className="text-zinc-700 dark:text-zinc-300 font-mono">123456</strong></span>
                                {u.demoExpiresAt ? (
                                  <span className={isExpired ? 'text-rose-500 font-bold' : 'text-zinc-400'}>
                                    • {isExpired ? 'Expired' : `Expires ${format(new Date(u.demoExpiresAt), 'MMM d')}`}
                                  </span>
                                ) : (
                                  <span>• Permanent</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Standard 2FA
                              </span>
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
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1 cursor-pointer ${
                                isDemo
                                  ? 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                  : 'text-amber-600 dark:text-amber-400 hover:text-amber-700 border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30'
                              }`}
                              title={isDemo ? 'Disable demo bypass' : 'Enable zero-friction demo mode'}
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
                              className="p-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              title="Set or change password"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setUserToDelete(u)}
                              className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Delete account"
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
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">Provision Platform Account</h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">Assign credentials to any tenant business</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newUserForm.tenantId) return toast.error('Please select a target business');
                if (!newUserForm.email.trim()) return toast.error('Email is required');
                if (!newUserForm.password.trim()) return toast.error('Password is required');
                createUserMutation.mutate(newUserForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  Target Business / Tenant
                </label>
                <select
                  required
                  value={newUserForm.tenantId}
                  onChange={(e) => setNewUserForm({ ...newUserForm, tenantId: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Select a business...</option>
                  {(tenantsList || []).map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.subdomain})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  Full Name / Contact Person
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Principal Sonette / Chef Marcus"
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
                  placeholder="e.g. demo-client@example.com"
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
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
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
                      Direct password login without requiring an OTP code. In addition, universal passcode <code className="font-bold">123456</code> is accepted for any OTP screen.
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
                  className="px-4 py-2.5 text-xs font-bold border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
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
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
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
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
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
                  className="px-4 py-2.5 text-xs font-bold border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  className="px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
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

