import React, { useState, useEffect } from 'react';
import { Save, Loader2, KeyRound, ShieldCheck } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { fetchApi } from '../../lib/api';
import { toast } from 'sonner';
import PhoneInput from '../PhoneInput';

export default function ProfileSettingsPage() {
  const { user, refetch } = useAuth();
  const [language, setLanguage] = useState('en');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');

  // Password & Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user?.personalSettings?.language) {
      setLanguage(user.personalSettings.language);
    }
    if (user?.personalSettings?.notificationsEnabled !== undefined) {
      setNotificationsEnabled(user.personalSettings.notificationsEnabled);
    }
    if (user?.personalSettings?.fullName) {
      setFullName(user.personalSettings.fullName);
    }
    if (user?.personalSettings?.phone) {
      setPhone(user.personalSettings.phone);
    }
    if (user?.personalSettings?.location) {
      setLocation(user.personalSettings.location);
    }
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const savePersonalSettings = async () => {
    setSavingPersonal(true);
    try {
      await fetchApi('/auth/personal-settings', {
        method: 'PATCH',
        body: JSON.stringify({
          language,
          notificationsEnabled,
          fullName,
          phone,
          location,
        }),
      });

      await refetch();
      toast.success('Profile settings saved successfully');
    } catch (err: AnyFixMe) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      await fetchApi('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: currentPassword || undefined,
          newPassword,
        }),
      });
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = fullName
    ? fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : email
    ? email.substring(0, 2).toUpperCase()
    : 'OP';

  return (
    <div className="space-y-8 mb-8">
      {/* ── User Avatar & Identity Header ── */}
      <div className="bg-card dark:bg-dark-card rounded-[24px] border border-border dark:border-dark-border shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-center gap-6">
        <div className="w-20 h-20 rounded-3xl bg-linear-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white font-extrabold text-2xl shadow-xl flex items-center justify-center shrink-0 border-2 border-white/20 select-none">
          {initials}
        </div>
        <div className="text-center sm:text-left min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-xl font-bold text-on-surface dark:text-white truncate">
              {fullName || user?.name || email.split('@')[0] || 'User Profile'}
            </h2>
            <span className="inline-flex self-center sm:self-auto items-center px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider border border-primary/25">
              {user?.role || 'Staff'}
            </span>
          </div>
          <p className="text-xs font-mono text-on-surface-variant dark:text-zinc-400 mt-1">
            {email}
          </p>
          <p className="text-xs text-outline mt-1">
            Account ID: <span className="font-mono">{user?.id?.substring(0, 8)}...</span>
          </p>
        </div>
      </div>

      {/* ── Personal Profile Card ── */}
      <div className="bg-card dark:bg-dark-card rounded-[24px] border border-border dark:border-dark-border shadow-sm p-8 relative overflow-hidden">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              <h2 className="font-headline-md text-headline-md text-on-surface dark:text-white tracking-tight font-semibold">Personal Profile</h2>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant dark:text-outline">Update your contact details and application preferences.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block font-label-caps text-label-caps text-on-surface-variant dark:text-outline mb-2 uppercase tracking-wide">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-[44px] bg-white dark:bg-zinc-900 border border-border dark:border-dark-border rounded-lg px-4 font-body-md text-body-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-shadow text-on-surface dark:text-white"
                placeholder="Jane Doe"
              />
            </div>
            
            <div>
              <label className="block font-label-caps text-label-caps text-on-surface-variant dark:text-outline mb-2 uppercase tracking-wide">Email Address</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full h-[44px] bg-surface-container-low dark:bg-zinc-800/50 border border-border dark:border-white/5 rounded-lg px-4 font-body-md text-body-md text-outline cursor-not-allowed"
              />
              <p className="text-[12px] text-outline mt-2">Email cannot be changed.</p>
            </div>
            
            <div>
              <label className="block font-label-caps text-label-caps text-on-surface-variant dark:text-outline mb-2 uppercase tracking-wide">Phone Number</label>
              <div className="h-[44px] rounded-lg bg-white dark:bg-zinc-900 border border-border dark:border-dark-border focus-within:ring-1 focus-within:ring-primary focus-within:border-primary overflow-hidden">
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  className="w-full h-full !border-none !bg-transparent px-4 font-body-md text-on-surface dark:text-white"
                  placeholder="234 567 8900"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block font-label-caps text-label-caps text-on-surface-variant dark:text-outline mb-2 uppercase tracking-wide">Location / City</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full h-[44px] bg-white dark:bg-zinc-900 border border-border dark:border-dark-border rounded-lg px-4 font-body-md text-body-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-shadow text-on-surface dark:text-white"
                placeholder="New York, NY"
              />
            </div>

            <div>
              <label className="block font-label-caps text-label-caps text-on-surface-variant dark:text-outline mb-2 uppercase tracking-wide">Interface Language</label>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-[44px] bg-white dark:bg-zinc-900 border border-border dark:border-dark-border rounded-lg px-4 font-body-md text-body-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-shadow text-on-surface dark:text-white appearance-none"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="ar">العربية</option>
                  <option value="hi">हिन्दी</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
              </div>
            </div>

            <div>
              <label className="block font-label-caps text-label-caps text-on-surface-variant dark:text-outline mb-2 uppercase tracking-wide">Preferences</label>
              <label className="flex items-center gap-3 cursor-pointer p-4 bg-white dark:bg-zinc-900 border border-border dark:border-dark-border rounded-xl hover:border-outline transition-colors h-[72px]">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="w-5 h-5 text-primary border-border rounded focus:ring-primary bg-surface-container-low dark:bg-black/50"
                />
                <div className="flex flex-col justify-center">
                  <span className="font-body-md text-on-surface dark:text-white font-medium leading-none">In-App Notifications</span>
                  <span className="text-[12px] text-outline mt-1 leading-none">Alerts when queues update.</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border dark:border-dark-border flex justify-end">
          <button
            onClick={savePersonalSettings}
            disabled={savingPersonal}
            className="h-[44px] px-6 bg-primary hover:bg-primary-container text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {savingPersonal ? <Loader2 strokeWidth={1.5} className="w-5 h-5 animate-spin" /> : <Save strokeWidth={1.5} className="w-5 h-5" />}
            Save Profile
          </button>
        </div>
      </div>

      {/* ── Password & Security Card ── */}
      <div className="bg-card dark:bg-dark-card rounded-[24px] border border-border dark:border-dark-border shadow-sm p-8 relative overflow-hidden">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              <h2 className="font-headline-md text-headline-md text-on-surface dark:text-white tracking-tight font-semibold">Password & Security</h2>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant dark:text-outline">Update your login password to keep your account secure.</p>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="max-w-2xl space-y-5">
          <div>
            <label className="block font-label-caps text-label-caps text-on-surface-variant dark:text-outline mb-2 uppercase tracking-wide">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full h-[44px] bg-white dark:bg-zinc-900 border border-border dark:border-dark-border rounded-lg px-4 font-body-md text-body-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-shadow text-on-surface dark:text-white"
              placeholder="••••••••••••"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-label-caps text-label-caps text-on-surface-variant dark:text-outline mb-2 uppercase tracking-wide">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-[44px] bg-white dark:bg-zinc-900 border border-border dark:border-dark-border rounded-lg px-4 font-body-md text-body-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-shadow text-on-surface dark:text-white"
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label className="block font-label-caps text-label-caps text-on-surface-variant dark:text-outline mb-2 uppercase tracking-wide">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-[44px] bg-white dark:bg-zinc-900 border border-border dark:border-dark-border rounded-lg px-4 font-body-md text-body-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-shadow text-on-surface dark:text-white"
                placeholder="Re-enter new password"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={savingPassword || !newPassword}
              className="h-[44px] px-6 bg-primary hover:bg-primary-container text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {savingPassword ? <Loader2 strokeWidth={1.5} className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
