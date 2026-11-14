import React, { useState } from 'react';
import {
  ShieldAlert,
  Trash2,
  Loader2,
  ShieldCheck,
  Laptop,
  Smartphone,
  Tablet,
  LogOut,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Globe,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi, getBackendUrl } from '../../lib/api';
import { toast } from 'sonner';

interface DeviceSession {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceInfo?: {
    browser?: string;
    os?: string;
    deviceType?: 'desktop' | 'mobile' | 'tablet';
    clientName?: string;
    raw?: string;
  };
  lastActiveAt: string;
  createdAt: string;
  isCurrentSession: boolean;
}

interface SecurityOverview {
  userId: string;
  email: string;
  role: string;
  hasPassword: boolean;
  googleConnected: boolean;
  googleEmail: string | null;
  activeDeviceCount: number;
  maxAllowedDevices: number;
  isDeviceCapReached: boolean;
  twoFactorEnabled: boolean;
  twoFactorMethod: string;
}

export default function SecuritySettings() {
  const queryClient = useQueryClient();

  // State
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [showRevokeOthersConfirm, setShowRevokeOthersConfirm] = useState(false);
  const [isRevokingOthers, setIsRevokingOthers] = useState(false);

  const [showDisconnectGoogleConfirm, setShowDisconnectGoogleConfirm] = useState(false);
  const [isDisconnectingGoogle, setIsDisconnectingGoogle] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Queries
  const { data: userProfile } = useQuery<any>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await fetchApi<any>('/auth/me');
      return res || null;
    },
  });

  const { data: securityOverview } = useQuery<SecurityOverview | null>({
    queryKey: ['auth', 'security-overview'],
    queryFn: async () => {
      const res = await fetchApi<SecurityOverview>('/auth/security-overview');
      return res || null;
    },
  });

  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery<DeviceSession[]>({
    queryKey: ['auth', 'sessions'],
    queryFn: async () => {
      const res = await fetchApi<DeviceSession[]>('/auth/sessions');
      return Array.isArray(res) ? res : [];
    },
  });

  const maxAllowedDevices = 2;
  const activeDeviceCount = sessions.length;
  const isCapReached = activeDeviceCount >= maxAllowedDevices;

  // Mutations
  const revokeSessionMutation = useMutation({
    mutationFn: (id: string) => fetchApi(`/auth/sessions/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Device session revoked successfully.');
      queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'security-overview'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to revoke device session.');
    },
  });

  const handleRevokeAllOtherSessions = async () => {
    setIsRevokingOthers(true);
    try {
      await fetchApi('/auth/sessions/revoke-others', { method: 'POST' });
      toast.success('Signed out from all other devices.');
      queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'security-overview'] });
      setShowRevokeOthersConfirm(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to revoke other sessions.');
    } finally {
      setIsRevokingOthers(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await fetchApi('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: currentPassword || undefined,
          newPassword,
        }),
      });
      toast.success('Password updated successfully!');
      setShowChangePasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      queryClient.invalidateQueries({ queryKey: ['auth', 'security-overview'] });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    setIsDisconnectingGoogle(true);
    try {
      await fetchApi('/auth/google/disconnect', { method: 'POST' });
      toast.success('Google account disconnected successfully.');
      setShowDisconnectGoogleConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['auth', 'security-overview'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to disconnect Google account.');
    } finally {
      setIsDisconnectingGoogle(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') return;
    setIsDeletingAccount(true);
    try {
      const res: any = await fetchApi('/users/me', { method: 'DELETE' });
      toast.success(res?.message || 'Account deleted successfully.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete account.');
      setIsDeletingAccount(false);
    }
  };

  const getDeviceIcon = (deviceType?: string) => {
    if (deviceType === 'mobile') return <Smartphone className="w-5 h-5" />;
    if (deviceType === 'tablet') return <Tablet className="w-5 h-5" />;
    return <Laptop className="w-5 h-5" />;
  };

  const userEmail = securityOverview?.email || userProfile?.email || '';
  const isGoogleConnected = securityOverview?.googleConnected ?? Boolean(userProfile?.googleId);
  const googleAccountEmail = securityOverview?.googleEmail || userProfile?.email;

  return (
    <div className="bg-card dark:bg-dark-card rounded-[24px] border border-border dark:border-dark-border shadow-sm p-6 sm:p-8 relative overflow-hidden mb-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-border dark:border-dark-border">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              admin_panel_settings
            </span>
            <h2 className="font-headline-md text-headline-md text-on-surface dark:text-white tracking-tight font-semibold">
              Security & Access Control
            </h2>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant dark:text-zinc-400">
            Active device limit, two-factor authentication, connected accounts, and workspace access rules.
          </p>
        </div>

        {/* Global Security Health Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold self-start md:self-auto">
          <ShieldCheck className="w-4 h-4" />
          <span>Strict 2-Device Policy Enforced</span>
        </div>
      </div>

      {/* 2-Device Concurrency & Active Sessions */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Laptop className="w-5 h-5 text-primary" />
              <h3 className="font-headline-sm text-lg font-bold text-on-surface dark:text-white">
                Active Devices & Sessions ({activeDeviceCount} of {maxAllowedDevices})
              </h3>
            </div>
            <p className="text-xs text-on-surface-variant dark:text-zinc-400 mt-1">
              For security, each account is strictly restricted to a maximum of <strong>2 concurrent devices</strong>.
              Signing into a 3rd device automatically evicts and revokes the oldest session.
            </p>
          </div>

          {sessions.length > 1 && (
            <button
              onClick={() => setShowRevokeOthersConfirm(true)}
              className="h-9 px-3.5 rounded-xl border border-border dark:border-zinc-700 bg-surface dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold text-on-surface dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-2 shrink-0 self-start sm:self-auto shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out All Other Devices
            </button>
          )}
        </div>

        {/* Device Capacity Progress Indicator */}
        <div className="p-4 rounded-2xl bg-surface-container-low dark:bg-zinc-900/60 border border-border dark:border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-on-surface dark:text-zinc-300">
              {isCapReached ? (
                <span className="text-amber-500 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> 2 of 2 Device Slots In Use (Maximum Limit Reached)
                </span>
              ) : (
                <span className="text-emerald-500 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 1 of 2 Device Slots In Use (1 Slot Available)
                </span>
              )}
            </span>
            <span className="text-zinc-500 font-mono text-[11px]">
              Concurrency Limit: {maxAllowedDevices} Devices
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isCapReached ? 'bg-amber-500' : 'bg-primary'
              }`}
              style={{ width: `${Math.min((activeDeviceCount / maxAllowedDevices) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-surface-bright dark:bg-zinc-900 rounded-2xl border border-border dark:border-dark-border divide-y divide-border dark:divide-dark-border overflow-hidden">
          {isLoadingSessions ? (
            <div className="p-8 flex items-center justify-center gap-2 text-zinc-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              Loading authenticated devices...
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No active device sessions found.
            </div>
          ) : (
            sessions.map((session) => {
              const devName =
                session.deviceInfo?.clientName ||
                (session.deviceInfo?.browser && session.deviceInfo?.os
                  ? `${session.deviceInfo.browser} on ${session.deviceInfo.os}`
                  : session.userAgent || 'Web Browser Session');

              const deviceType = session.deviceInfo?.deviceType || 'desktop';

              return (
                <div
                  key={session.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 gap-4 hover:bg-surface-container-lowest dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        session.isCurrentSession
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {getDeviceIcon(deviceType)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-sm text-on-surface dark:text-white">
                          {devName}
                        </h4>
                        {session.isCurrentSession && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px] tracking-wider uppercase border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Current Device
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[11px] font-medium capitalize">
                          {deviceType}
                        </span>
                      </div>

                      <p className="text-xs text-on-surface-variant dark:text-zinc-400 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
                        <span>IP: {session.ipAddress || 'Internal Network'}</span>
                        <span>•</span>
                        <span>
                          Last active:{' '}
                          {new Date(session.lastActiveAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center sm:self-center self-end shrink-0">
                    {session.isCurrentSession ? (
                      <span className="text-xs text-zinc-400 italic px-2">Active session</span>
                    ) : (
                      <button
                        onClick={() => revokeSessionMutation.mutate(session.id)}
                        disabled={revokeSessionMutation.isPending}
                        className="h-8 px-3 rounded-lg bg-zinc-100 hover:bg-red-50 text-zinc-600 hover:text-red-600 dark:bg-zinc-800 dark:hover:bg-red-950/40 dark:text-zinc-300 dark:hover:text-red-400 text-xs font-semibold transition-colors disabled:opacity-50 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5"
                      >
                        {revokeSessionMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <LogOut className="w-3 h-3" />
                        )}
                        Revoke Access
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Two-Factor Authentication (2FA) */}
      <section className="space-y-4">
        <div className="border-b border-border dark:border-dark-border pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="font-headline-sm text-lg font-bold text-on-surface dark:text-white">
              Two-Factor Authentication (2FA)
            </h3>
          </div>
          <p className="text-xs text-on-surface-variant dark:text-zinc-400 mt-1">
            Verification codes are required whenever signing in from a new or untrusted browser.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-surface-bright dark:bg-zinc-900 border border-border dark:border-dark-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm text-on-surface dark:text-white">
                Email Verification Code (OTP)
              </h4>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold uppercase tracking-wider border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> Enabled & Enforced
              </span>
            </div>
            <p className="text-xs text-on-surface-variant dark:text-zinc-400 max-w-xl">
              One-time cryptographic verification codes (OTP) are automatically sent to{' '}
              <strong className="text-on-surface dark:text-white">{userEmail}</strong> when logging in.
            </p>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-500 dark:text-zinc-400 shrink-0">
            Protected Delivery Channel
          </div>
        </div>
      </section>

      {/* Authentication & Connected Accounts */}
      <section className="space-y-4">
        <div className="border-b border-border dark:border-dark-border pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            <h3 className="font-headline-sm text-lg font-bold text-on-surface dark:text-white">
              Sign-In Methods & Connected Accounts
            </h3>
          </div>
          <p className="text-xs text-on-surface-variant dark:text-zinc-400 mt-1">
            Manage your password and external Single Sign-On (SSO) credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Password Card */}
          <div className="p-6 rounded-2xl bg-surface-bright dark:bg-zinc-900 border border-border dark:border-dark-border flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-on-surface dark:text-white">
                    Password Authentication
                  </h4>
                  <p className="text-xs text-on-surface-variant dark:text-zinc-400">
                    {securityOverview?.hasPassword ? 'Password is set and active' : 'No password set (Google SSO only)'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed pt-1">
                Use a strong, unique password with at least 6 characters. Passwords are securely hashed with bcrypt.
              </p>
            </div>

            <button
              onClick={() => setShowChangePasswordModal(true)}
              className="h-10 px-4 rounded-xl bg-surface dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-border dark:border-zinc-700 text-xs font-semibold text-on-surface dark:text-white transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <KeyRound className="w-4 h-4 text-primary" />
              {securityOverview?.hasPassword ? 'Change Password' : 'Set Account Password'}
            </button>
          </div>

          {/* Google OAuth Card */}
          <div className="p-6 rounded-2xl bg-surface-bright dark:bg-zinc-900 border border-border dark:border-dark-border flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-zinc-200 dark:border-zinc-700">
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-on-surface dark:text-white">Google SSO</h4>
                    {isGoogleConnected ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                        Connected
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-semibold">
                        Not Linked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant dark:text-zinc-400 truncate max-w-[200px]">
                    {isGoogleConnected ? googleAccountEmail : 'Enable one-click Google login'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed pt-1">
                Enables Single Sign-On using your verified Google credentials for seamless access across devices.
              </p>
            </div>

            {isGoogleConnected ? (
              <button
                onClick={() => setShowDisconnectGoogleConfirm(true)}
                className="h-10 px-4 rounded-xl bg-surface dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/30 border border-border dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center justify-center gap-2"
              >
                Disconnect Google Account
              </button>
            ) : (
              <a
                href={`${getBackendUrl()}/auth/google?intent=link_user`}
                className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Connect Google Account
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="space-y-4">
        <div className="border-b border-red-500/20 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <h3 className="font-headline-sm text-lg font-bold text-red-600 dark:text-red-400">
              Danger Zone
            </h3>
          </div>
          <p className="text-xs text-on-surface-variant dark:text-zinc-400 mt-1">
            Irreversible actions regarding account ownership and workspace deletion.
          </p>
        </div>

        <div className="bg-red-500/5 dark:bg-red-500/10 rounded-2xl p-6 border border-red-500/20 space-y-4">
          <div>
            <h4 className="font-semibold text-sm text-red-600 dark:text-red-400">
              Delete Account & Offboard Workspace
            </h4>
            <p className="text-xs text-on-surface-variant dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Permanently delete your account. If you are the owner of this workspace, all tenant data, queues, visits,
              and team configurations will be completely erased from the database.
            </p>
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Account
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-surface dark:bg-zinc-900 border border-red-500/30 space-y-3 max-w-xl">
              <p className="text-xs text-on-surface dark:text-zinc-300">
                This action cannot be undone. Type <span className="font-bold text-red-500 font-mono">DELETE</span> below to confirm:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="DELETE"
                  className="flex-1 h-9 px-3 rounded-lg bg-surface-container-low dark:bg-zinc-800 border border-red-300 dark:border-red-900/60 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="h-9 px-3 rounded-lg border border-border dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={deleteInput !== 'DELETE' || isDeletingAccount}
                    onClick={handleDeleteAccount}
                    className="h-9 px-4 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isDeletingAccount && <Loader2 className="w-3 h-3 animate-spin" />}
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-on-surface dark:text-white">
                  {securityOverview?.hasPassword ? 'Change Password' : 'Set Account Password'}
                </h3>
              </div>
              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="text-zinc-400 hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {securityOverview?.hasPassword && (
                <div>
                  <label className="block text-xs font-semibold text-on-surface dark:text-zinc-300 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low dark:bg-zinc-800 border border-border dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-on-surface dark:text-zinc-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low dark:bg-zinc-800 border border-border dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface dark:text-zinc-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low dark:bg-zinc-800 border border-border dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isChangingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke All Others Confirmation Modal */}
      {showRevokeOthersConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-500">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-on-surface dark:text-white">
                Sign Out All Other Devices?
              </h3>
            </div>
            <p className="text-xs text-on-surface-variant dark:text-zinc-400 leading-relaxed">
              This will immediately terminate all active sessions on other computers, phones, or browsers.
              You will remain logged in on this current device.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRevokeOthersConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeAllOtherSessions}
                disabled={isRevokingOthers}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isRevokingOthers && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Sign Out Others
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disconnect Google Confirmation Modal */}
      {showDisconnectGoogleConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-500">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-on-surface dark:text-white">
                Disconnect Google Account?
              </h3>
            </div>
            <p className="text-xs text-on-surface-variant dark:text-zinc-400 leading-relaxed">
              You will no longer be able to log in with Google Single Sign-On (SSO). You will need to use your email and
              password to sign in.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDisconnectGoogleConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnectGoogle}
                disabled={isDisconnectingGoogle}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDisconnectingGoogle && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
