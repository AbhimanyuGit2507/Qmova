import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../lib/api';
import {
  Plus, Trash2, Loader2, MapPin, Briefcase, Edit2, ToggleLeft, ToggleRight,
  LayoutDashboard, Monitor, Copy, ExternalLink, Zap,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { ProviderModal } from '../modals/ProviderModal';
import { ConfirmModal } from '../modals/ConfirmModal';

import type { Staff } from '@yq/shared';

type Provider = Staff & {
  services?: { id: string; name: string }[];
  location?: { id: string; name: string };
};

function ProviderAvatar({ name, color }: { name: string; color?: string | null }) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 bg-primary"
      style={color ? { backgroundColor: color } : undefined}
    >
      {initial}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'ACTIVE';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

export default function ProvidersSettings() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [providerToDelete, setProviderToDelete] = useState<{ id: string; name: string } | null>(null);
    
  const isAdmin = user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const canManageProviders = isAdmin || user?.role === 'MANAGER';

  React.useEffect(() => {
    if (user && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, router, isAdmin]);

  const { data: providers = [], isLoading: isProvidersLoading } = useQuery<Provider[]>({
    queryKey: ['staffList'],
    queryFn: () => fetchApi('/staff') as Promise<Provider[]>,
    enabled: !!(isAdmin || canManageProviders),
    staleTime: 30000,
  });

          const deleteProviderMutation = useMutation({
    mutationFn: (id: string) => fetchApi(`/staff/${id}`, { method: 'DELETE' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['staffList'] }); toast.success('Provider removed'); },
    onError: (e: Error) => toast.error(e.message || 'Failed to remove provider'),
  });

  const toggleProviderStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetchApi(`/staff/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['staffList'] }); toast.success('Provider updated'); },
    onError: (e: Error) => toast.error(e.message || 'Failed to update'),
  });

  const { data: tenant } = useQuery({
    queryKey: ['tenant', 'me'],
    queryFn: () => fetchApi('/tenant/me').catch(() => null),
  });

  const svl = tenant?.staffViewLayout;
  const templates: any[] = svl?.version === 2 ? svl.templates || [] : [];
  const assignments: Record<string, string> = svl?.version === 2 ? svl.assignments || {} : {};

  const assignTemplateMutation = useMutation({
    mutationFn: async ({ staffId, templateId }: { staffId: string; templateId: string }) => {
      const updatedAssignments = { ...assignments };
      if (!templateId) {
        delete updatedAssignments[staffId];
      } else {
        updatedAssignments[staffId] = templateId;
      }
      const updatedSvl = {
        version: 2,
        templates,
        assignments: updatedAssignments,
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
    onError: (e: any) => toast.error(e?.message || 'Failed to update station layout'),
  });

  const generateDeskTokenMutation = useMutation({
    mutationFn: (id: string) => fetchApi(`/staff/${id}/desk-token`, { method: 'POST' }),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['staffList'] });
      if (res?.deskToken) {
        const url = `${window.location.origin}/staff-desk/${res.deskToken}`;
        navigator.clipboard.writeText(url);
        toast.success('Desk link generated and copied to clipboard!');
      }
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to generate desk link'),
  });

          
  return (
    <div className="space-y-6">
      {/* PROVIDERS SECTION */}
      {/* PROVIDERS TAB */}
      <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-on-surface dark:text-white">On-Ground Staff</h3>
              <p className="text-xs text-on-surface-variant dark:text-zinc-400 mt-0.5">
                Bookable on-ground workers (doctors, nurses, waiters, etc.) linked to your services
              </p>
            </div>
            {canManageProviders && (
              <button
                onClick={() => { setEditingProvider(null); setIsProviderModalOpen(true); }}
                className="flex items-center gap-2 px-4 h-9 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Staff Member
              </button>
            )}
          </div>

          {isProvidersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-12 bg-surface-container-lowest dark:bg-zinc-800/50 rounded-2xl border border-dashed border-border dark:border-dark-border">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold text-on-surface dark:text-white">No on-ground staff yet</p>
              <p className="text-sm text-on-surface-variant dark:text-zinc-400 mt-1">Add bookable staff members to enable appointment scheduling</p>
              {canManageProviders && (
                <button
                  onClick={() => { setEditingProvider(null); setIsProviderModalOpen(true); }}
                  className="mt-4 px-4 h-9 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-xl transition-colors inline-flex items-center gap-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add First Staff Member
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {(providers as Provider[]).map((provider) => (
                <div
                  key={provider.id}
                  className="flex items-center gap-3 p-3.5 bg-white dark:bg-zinc-800/50 rounded-xl border border-border dark:border-dark-border hover:bg-surface-container-lowest dark:hover:bg-zinc-800 transition-colors"
                >
                  <ProviderAvatar name={provider.name} color={provider.color} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-on-surface dark:text-white">{provider.name}</span>
                      {provider.title && (
                        <span className="text-xs text-on-surface-variant dark:text-zinc-400">{provider.title}</span>
                      )}
                      <StatusBadge status={provider.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {provider.services && provider.services.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-on-surface-variant dark:text-zinc-500">
                          <Briefcase className="w-3 h-3" />
                          {provider.services.slice(0, 3).map(s => s.name).join(', ')}
                          {provider.services.length > 3 && <span>+{provider.services.length - 3} more</span>}
                        </div>
                      )}
                      {provider.location && (
                        <div className="flex items-center gap-1 text-xs text-on-surface-variant dark:text-zinc-500">
                          <MapPin className="w-3 h-3" />
                          {provider.location.name}
                        </div>
                      )}
                    </div>
                    {/* Station Layout & Kiosk Link controls */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {templates.length > 0 && (
                        <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-border dark:border-dark-border text-xs">
                          <LayoutDashboard className="w-3 h-3 text-primary shrink-0" />
                          <span className="text-zinc-400 text-[11px]">Station:</span>
                          <select
                            value={assignments[provider.id] || ''}
                            onChange={(e) => assignTemplateMutation.mutate({ staffId: provider.id, templateId: e.target.value })}
                            disabled={!canManageProviders || assignTemplateMutation.isPending}
                            className="bg-transparent font-medium text-on-surface dark:text-white outline-none cursor-pointer text-xs"
                          >
                            <option value="" className="dark:bg-zinc-900">Default Layout</option>
                            {templates.map((tpl: any) => (
                              <option key={tpl.id} value={tpl.id} className="dark:bg-zinc-900">{tpl.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {provider.deskToken ? (
                        <div className="flex items-center gap-1.5 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-lg px-2 py-1">
                          <Monitor className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">Desk Kiosk</span>
                          <button
                            type="button"
                            onClick={() => {
                              const url = `${window.location.origin}/staff-desk/${provider.deskToken}`;
                              navigator.clipboard.writeText(url);
                              toast.success(`Desk link for ${provider.name} copied!`);
                            }}
                            title="Copy Kiosk URL"
                            className="p-0.5 text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={`/staff-desk/${provider.deskToken}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open Station Desk"
                            className="p-0.5 text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        canManageProviders && (
                          <button
                            type="button"
                            onClick={() => generateDeskTokenMutation.mutate(provider.id)}
                            disabled={generateDeskTokenMutation.isPending}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-border dark:border-dark-border transition-colors"
                          >
                            <Zap className="w-3 h-3 text-amber-500" />
                            <span>Enable Desk Link</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                  {canManageProviders && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleProviderStatus.mutate({
                          id: provider.id,
                          status: provider.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                        })}
                        className={`p-1.5 rounded-lg transition-colors ${
                          provider.status === 'ACTIVE'
                            ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                            : 'text-zinc-400 hover:bg-surface-container-low dark:hover:bg-white/10'
                        }`}
                        title={provider.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      >
                        {provider.status === 'ACTIVE' ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => { setEditingProvider(provider); setIsProviderModalOpen(true); }}
                        className="p-1.5 rounded-lg hover:bg-surface-container-low dark:hover:bg-white/10 text-outline transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setProviderToDelete({ id: provider.id, name: provider.name })}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-400 transition-colors"
                        title="Remove provider"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      {/* Modals */}
      <ProviderModal
        isOpen={isProviderModalOpen}
        onClose={() => { setIsProviderModalOpen(false); setEditingProvider(null); }}
        provider={editingProvider}
      />

      <ConfirmModal
        isOpen={!!providerToDelete}
        onClose={() => setProviderToDelete(null)}
        onConfirm={() => {
          if (providerToDelete) {
            deleteProviderMutation.mutate(providerToDelete.id);
            setProviderToDelete(null);
          }
        }}
        title="Remove Staff Member"
        description={`Are you sure you want to remove ${providerToDelete?.name}?`}
        confirmText="Remove"
        variant="danger"
        isLoading={deleteProviderMutation.isPending}
      />
    </div>
  );
}