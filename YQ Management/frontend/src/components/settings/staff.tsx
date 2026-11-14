import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../lib/api';
import {
  Plus, Trash2, Shield, User as UserIcon, Loader2, AlertTriangle,
  MoreVertical, RotateCcw, CheckCircle, Clock, MapPin, Key,
  Briefcase, Monitor, Copy, ExternalLink, Filter, LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { InviteMemberModal } from '../modals/InviteMemberModal';
import { UserPermissionsModal } from '../modals/UserPermissionsModal';
import { JoinWorkspaceModal } from '../modals/JoinWorkspaceModal';
import { ConfirmModal } from '../modals/ConfirmModal';
import { usePlan } from '../../hooks/usePlan';
import { QuotaWarningBanner } from '../QuotaWarningBanner';

export type Member = {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  description?: string;
  title?: string;
  color?: string;
  role: string;
  status?: 'ACTIVE' | 'INVITED' | 'EXPIRED' | 'INACTIVE' | string;
  code?: string;
  isInvite?: boolean;
  expiresAt?: string;
  isOwner?: boolean;
  isKioskOnly?: boolean;
  staffId?: string | null;
  deskToken?: string | null;
  services?: { id: string; name: string }[];
  location?: { id: string; name: string } | null;
  capacity?: number;
  allowedLocationIds?: string[];
  allowedServiceIds?: string[];
  allowedPages?: string[];
};

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  OWNER: { label: 'Owner', color: '#D97706', bg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20' },
  ADMIN: { label: 'Admin', color: '#7C3AED', bg: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20' },
  SUPER_ADMIN: { label: 'Super Admin', color: '#EF4444', bg: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20' },
  MANAGER: { label: 'Manager (Front Desk)', color: '#0891B2', bg: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20' },
  STAFF: { label: 'Staff Specialist', color: '#10B981', bg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  ACTIVE: { label: 'Active', icon: <CheckCircle className="w-3 h-3" />, color: 'text-emerald-600 dark:text-emerald-400' },
  INVITED: { label: 'Invite Pending', icon: <Clock className="w-3 h-3" />, color: 'text-amber-600 dark:text-amber-400' },
  EXPIRED: { label: 'Invite Expired', icon: <AlertTriangle className="w-3 h-3" />, color: 'text-red-600 dark:text-red-400' },
  INACTIVE: { label: 'Inactive', icon: null, color: 'text-zinc-400' },
};

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_LABELS[role] || { label: role, bg: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, icon: null, color: 'text-zinc-400' };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function MemberAvatar({ name, email, role, color, isOwner }: { name?: string; email?: string; role: string; color?: string; isOwner?: boolean }) {
  const displayName = name || email || '?';
  const initial = displayName.charAt(0).toUpperCase();
  const cfg = ROLE_LABELS[role] || { color: '#6B7280' };
  return (
    <div className="relative shrink-0">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
        style={{ backgroundColor: color || cfg.color || '#6B7280' }}
      >
        {initial}
      </div>
      {isOwner && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center ring-2 ring-white dark:ring-zinc-900">
          <Shield className="w-2.5 h-2.5 text-white" />
        </div>
      )}
    </div>
  );
}

export default function StaffDirectory() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'manager' | 'staff' | 'invited'>('all');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<Member | null>(null);
  const [modalInitialStep, setModalInitialStep] = useState<1 | 2 | 3>(2);

  const plan = usePlan();
  const maxStaff = plan.limits?.maxMembers ?? 2;

  const isAdmin = user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  React.useEffect(() => {
    if (user && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, router, isAdmin]);

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ['staff'],
    queryFn: () => fetchApi('/users') as Promise<Member[]>,
    enabled: !!isAdmin,
    staleTime: 30000,
  });

  const { data: tenant } = useQuery({
    queryKey: ['tenant', 'me'],
    queryFn: () => fetchApi('/tenant/me').catch(() => null),
  });

  const deskTemplates: any[] = tenant?.staffViewLayout?.templates || [];
  const assignments: Record<string, string> = tenant?.staffViewLayout?.assignments || {};

  const deleteMember = useMutation({
    mutationFn: (id: string) => fetchApi(`/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
      toast.success('Removed successfully');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to remove'),
  });

  const resendMutation = useMutation({
    mutationFn: (id: string) => fetchApi(`/users/resend-invite/${id}`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Invitation renewed with fresh timer!');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to resend'),
  });

  const assignTemplateMutation = useMutation({
    mutationFn: async ({ staffId, templateId }: { staffId: string; templateId: string }) => {
      const nextAssignments = { ...assignments };
      if (!templateId) {
        delete nextAssignments[staffId];
      } else {
        nextAssignments[staffId] = templateId;
      }
      const updatedSvl = {
        version: 2,
        templates: deskTemplates,
        assignments: nextAssignments,
      };
      await fetchApi(`/tenant/${tenant.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ staffViewLayout: updatedSvl }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'me'] });
      toast.success('Station layout updated');
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to assign station layout'),
  });

  const handleCopyDesk = (token: string) => {
    const url = `${window.location.origin}/staff-desk/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Station kiosk URL copied to clipboard');
  };

  const handleOpenModal = (member: Member, step: 1 | 2 | 3 = 2) => {
    setUserToEdit(member);
    setModalInitialStep(step);
    setPermissionsModalOpen(true);
  };

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      if (filterRole === 'admin') return m.role === 'ADMIN' || m.role === 'OWNER' || m.role === 'SUPER_ADMIN';
      if (filterRole === 'manager') return m.role === 'MANAGER';
      if (filterRole === 'staff') return m.role === 'STAFF';
      if (filterRole === 'invited') return m.isInvite;
      return true;
    });
  }, [members, filterRole]);

  const counts = useMemo(() => {
    return {
      all: members.length,
      admin: members.filter(m => m.role === 'ADMIN' || m.role === 'OWNER' || m.role === 'SUPER_ADMIN').length,
      manager: members.filter(m => m.role === 'MANAGER').length,
      staff: members.filter(m => m.role === 'STAFF').length,
      invited: members.filter(m => m.isInvite).length,
    };
  }, [members]);

  const myOwnership = members.find(m => m.id === user?.userId && m.isOwner);

  return (
    <div className="space-y-6">
      {/* JOIN WORKSPACE HERO BANNER */}
      <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-border dark:border-dark-border p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-sm text-on-surface dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Have an Invite Code?
            </h3>
            <p className="text-xs text-on-surface-variant dark:text-zinc-400 mt-1 max-w-xl">
              If you inadvertently started a trial workspace instead of joining an existing team, enter the 8-character invite code to switch immediately.
            </p>
          </div>
          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 h-8 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-xl transition-colors border border-primary/20 shrink-0"
          >
            Join Workspace
          </button>
        </div>
      </div>

      {/* TEAM DIRECTORY HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-on-surface dark:text-white">Workspace Members & On-Ground Staff</h2>
          <p className="text-xs text-on-surface-variant dark:text-zinc-400 mt-0.5">
            Unified team hub — manage admins, reception managers, and on-ground specialists with station links
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end shrink-0 mr-1">
            <span className="text-xs font-semibold text-on-surface dark:text-white mb-1">
              {members.length} of {maxStaff > 0 ? maxStaff : 'Unlimited'} Seats Used
            </span>
            <div className="w-28 h-1.5 bg-surface-container-low dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: maxStaff > 0 ? `${Math.min((members.length / maxStaff) * 100, 100)}%` : '100%' }}
              />
            </div>
          </div>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            disabled={maxStaff > 0 && members.length >= maxStaff}
            className={`flex items-center gap-1.5 px-3.5 h-9 text-white text-xs font-semibold rounded-xl transition-colors shrink-0 ${
              maxStaff > 0 && members.length >= maxStaff
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-500'
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            <Plus className="w-4 h-4" /> Add Team Member
          </button>
        </div>
      </div>

      <QuotaWarningBanner 
        resourceType="staff" 
        frozenCount={plan.frozenCounts?.members || 0} 
        limit={maxStaff} 
      />

      {/* FILTER PILLS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setFilterRole('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
            filterRole === 'all'
              ? 'bg-primary text-white'
              : 'bg-surface-container dark:bg-zinc-800/80 text-on-surface-variant dark:text-zinc-400 hover:text-on-surface'
          }`}
        >
          All Members <span className="text-[10px] px-1 rounded-full bg-black/10 dark:bg-white/10">{counts.all}</span>
        </button>
        <button
          onClick={() => setFilterRole('staff')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
            filterRole === 'staff'
              ? 'bg-emerald-600 text-white'
              : 'bg-surface-container dark:bg-zinc-800/80 text-on-surface-variant dark:text-zinc-400 hover:text-on-surface'
          }`}
        >
          On-Ground Staff <span className="text-[10px] px-1 rounded-full bg-black/10 dark:bg-white/10">{counts.staff}</span>
        </button>
        <button
          onClick={() => setFilterRole('manager')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
            filterRole === 'manager'
              ? 'bg-cyan-600 text-white'
              : 'bg-surface-container dark:bg-zinc-800/80 text-on-surface-variant dark:text-zinc-400 hover:text-on-surface'
          }`}
        >
          Front Desk (Managers) <span className="text-[10px] px-1 rounded-full bg-black/10 dark:bg-white/10">{counts.manager}</span>
        </button>
        <button
          onClick={() => setFilterRole('admin')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
            filterRole === 'admin'
              ? 'bg-purple-600 text-white'
              : 'bg-surface-container dark:bg-zinc-800/80 text-on-surface-variant dark:text-zinc-400 hover:text-on-surface'
          }`}
        >
          Admins & Owners <span className="text-[10px] px-1 rounded-full bg-black/10 dark:bg-white/10">{counts.admin}</span>
        </button>
        {counts.invited > 0 && (
          <button
            onClick={() => setFilterRole('invited')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
              filterRole === 'invited'
                ? 'bg-amber-600 text-white'
                : 'bg-surface-container dark:bg-zinc-800/80 text-on-surface-variant dark:text-zinc-400 hover:text-on-surface'
            }`}
          >
            Invites Pending <span className="text-[10px] px-1 rounded-full bg-black/10 dark:bg-white/10">{counts.invited}</span>
          </button>
        )}
      </div>

      {/* MEMBER DIRECTORY LIST */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-12 bg-surface-container-lowest dark:bg-zinc-800/40 rounded-2xl border border-dashed border-border dark:border-dark-border">
          <UserIcon className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
          <p className="font-semibold text-sm text-on-surface dark:text-white">No team members match this filter</p>
          <p className="text-xs text-on-surface-variant dark:text-zinc-400 mt-0.5">Invite new team members or adjust the active filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMembers.map((member) => {
            const isSelf = member.id === user?.userId;
            const staffId = member.staffId || member.id;
            const assignedTemplateId = assignments[staffId] || assignments[member.id];
            const deskToken = member.deskToken;

            return (
              <div
                key={member.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-white dark:bg-zinc-800/60 rounded-2xl border border-border dark:border-dark-border hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm"
              >
                {/* Left: Avatar + Identity */}
                <div className="flex items-start gap-3 min-w-0">
                  <MemberAvatar
                    name={member.name}
                    email={member.email}
                    role={member.role}
                    color={member.color}
                    isOwner={member.isOwner}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-on-surface dark:text-white truncate">
                        {member.name || member.email || 'Team Specialist'}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-semibold">(you)</span>
                      )}
                      <RoleBadge role={member.role} />
                      <StatusBadge status={member.status || 'ACTIVE'} />
                      {member.isKioskOnly && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-600">
                          Kiosk Station
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant dark:text-zinc-400 flex-wrap">
                      {member.email && (
                        <span className="font-mono text-[11px] text-zinc-500">{member.email}</span>
                      )}
                      {member.title && (
                        <span className="font-medium text-zinc-600 dark:text-zinc-300">
                          {member.title}
                        </span>
                      )}
                      {member.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-zinc-400" />
                          {member.location.name}
                        </span>
                      )}
                    </div>

                    {/* Assigned Services Tags */}
                    {member.services && member.services.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <Briefcase className="w-3 h-3 text-zinc-400" />
                        {member.services.map((srv) => (
                          <span
                            key={srv.id}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-surface-container dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-300 border border-border dark:border-dark-border"
                          >
                            {srv.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle / Right: Station Layout & Direct Desk Link */}
                <div className="flex items-center gap-3 self-end lg:self-center flex-wrap shrink-0">
                  {/* Station Layout Assignment Dropdown */}
                  {member.role === 'STAFF' && deskTemplates.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <LayoutDashboard className="w-3.5 h-3.5 text-zinc-400" />
                      <select
                        value={assignedTemplateId || ''}
                        onChange={(e) => assignTemplateMutation.mutate({ staffId, templateId: e.target.value })}
                        className="text-xs bg-surface-container dark:bg-zinc-700/50 border border-border dark:border-dark-border rounded-lg px-2.5 py-1.5 text-on-surface dark:text-white outline-none focus:border-primary"
                        title="Station layout template displayed on staff desk"
                      >
                        <option value="">Default Station Layout</option>
                        {deskTemplates.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Kiosk Desk Link Button */}
                  {deskToken && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyDesk(deskToken)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border dark:border-dark-border bg-surface-container-low dark:bg-zinc-800 text-xs font-semibold text-on-surface dark:text-zinc-200 hover:bg-surface-container dark:hover:bg-zinc-700 transition-colors"
                        title="Copy Station Kiosk URL for tablets or monitors"
                      >
                        <Copy className="w-3 h-3 text-primary" />
                        <span>Kiosk Link</span>
                      </button>
                      <a
                        href={`/staff-desk/${deskToken}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg border border-border dark:border-dark-border bg-surface-container-low dark:bg-zinc-800 text-xs text-on-surface dark:text-zinc-200 hover:bg-surface-container dark:hover:bg-zinc-700 transition-colors"
                        title="Open Station Desk in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                      </a>
                    </div>
                  )}

                  {/* Pending Invite Actions */}
                  {member.isInvite && (
                    <div className="flex items-center gap-1.5">
                      {member.status === 'EXPIRED' && (
                        <button
                          onClick={() => resendMutation.mutate(member.id)}
                          disabled={resendMutation.isPending}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" /> Resend
                        </button>
                      )}
                      <button
                        onClick={() => setMemberToDelete(member)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors"
                        title="Cancel Invitation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Active Member Action Buttons */}
                  {!member.isInvite && (
                    <div className="flex items-center gap-1">
                      {isAdmin && !member.isOwner && !member.isKioskOnly && (
                        <button
                          onClick={() => handleOpenModal(member, 2)}
                          className="p-1.5 rounded-lg hover:bg-surface-container-low dark:hover:bg-white/10 text-outline transition-colors"
                          title="Manage Permissions & Scopes"
                        >
                          <Shield className="w-4 h-4 text-primary" />
                        </button>
                      )}
                      {!isSelf && !member.isOwner && (
                        <button
                          onClick={() => setMemberToDelete(member)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors"
                          title="Remove from Team"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />

      <JoinWorkspaceModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />

      <ConfirmModal
        isOpen={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onConfirm={() => {
          if (memberToDelete) {
            deleteMember.mutate(memberToDelete.id);
            setMemberToDelete(null);
          }
        }}
        title={memberToDelete?.isInvite ? 'Cancel Invitation' : 'Remove Team Member'}
        description={`Are you sure you want to remove ${memberToDelete?.name || memberToDelete?.email || 'this member'}? Their desk station access and login privileges will be revoked immediately.`}
        confirmText="Remove Member"
        variant="danger"
        isLoading={deleteMember.isPending}
      />

      {permissionsModalOpen && userToEdit && (
        <UserPermissionsModal
          isOpen={permissionsModalOpen}
          onClose={() => { setPermissionsModalOpen(false); setUserToEdit(null); }}
          userToEdit={userToEdit}
          initialStep={modalInitialStep}
          isCurrentUserOwner={!!myOwnership}
          currentUserId={user?.userId}
        />
      )}
    </div>
  );
}
