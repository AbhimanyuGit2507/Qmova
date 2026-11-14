import React from 'react';
import { Check, X, Minus } from 'lucide-react';

type Permission = true | false | 'partial'; // true=full, false=none, 'partial'=limited

interface FeatureRow {
  category: string;
  features: {
    label: string;
    description?: string;
    owner: Permission;
    admin: Permission;
    manager: Permission;
    staff: Permission;
  }[];
}

const FEATURE_MATRIX: FeatureRow[] = [
  {
    category: 'Billing & Ownership',
    features: [
      { label: 'View billing & invoices', owner: true, admin: true, manager: false, staff: false },
      { label: 'Manage subscription', owner: true, admin: true, manager: false, staff: false },
      { label: 'Transfer ownership', owner: true, admin: false, manager: false, staff: false },
      { label: 'Delete business account', owner: true, admin: false, manager: false, staff: false },
    ],
  },
  {
    category: 'Team & Specialists',
    features: [
      { label: 'View unified team members', owner: true, admin: true, manager: true, staff: false },
      { label: 'Invite Admin members', description: 'Invite team leads as Admin', owner: true, admin: true, manager: false, staff: false },
      { label: 'Invite Front Desk & Staff Specialists', description: 'Managers can add on-ground specialists', owner: true, admin: true, manager: 'partial', staff: false },
      { label: 'Remove team members', owner: true, admin: true, manager: 'partial', staff: false },
      { label: 'Change member roles', owner: true, admin: true, manager: false, staff: false },
      { label: 'Configure desk templates for staff', owner: true, admin: true, manager: false, staff: false },
    ],
  },
  {
    category: 'My Desk & Station Kiosks',
    features: [
      { label: 'Access My Desk workspace (/dashboard/my-desk)', owner: true, admin: true, manager: true, staff: true },
      { label: 'Dedicated Tablet Kiosk station (/staff-desk/[token])', owner: true, admin: true, manager: true, staff: true },
      { label: 'Design Staff View templates (Staff View Builder)', owner: true, admin: true, manager: false, staff: false },
      { label: 'Fulfill queue visits & add clinical notes', owner: true, admin: true, manager: true, staff: true },
    ],
  },
  {
    category: 'Service Desk & Reception',
    features: [
      { label: 'Operate Service Desk (/dashboard/service-desk)', owner: true, admin: true, manager: true, staff: false },
      { label: 'Scan visitor boarding passes (QR Scanner)', owner: true, admin: true, manager: true, staff: 'partial' },
      { label: 'Walk-in triage & client check-in', owner: true, admin: true, manager: true, staff: false },
      { label: 'Manage live customer queues', owner: true, admin: true, manager: true, staff: 'partial' },
    ],
  },
  {
    category: 'Appointments & Calendars',
    features: [
      { label: 'View all appointments', owner: true, admin: true, manager: true, staff: 'partial' },
      { label: 'Create / reschedule appointments', owner: true, admin: true, manager: true, staff: 'partial' },
      { label: 'Cancel appointments', owner: true, admin: true, manager: true, staff: 'partial' },
    ],
  },
  {
    category: 'Analytics & Reports',
    features: [
      { label: 'View operational analytics', owner: true, admin: true, manager: true, staff: false },
      { label: 'Export reports', owner: true, admin: true, manager: true, staff: false },
      { label: 'View revenue analytics', owner: true, admin: true, manager: false, staff: false },
    ],
  },
  {
    category: 'Settings & Integrations',
    features: [
      { label: 'View workspace settings', owner: true, admin: true, manager: 'partial', staff: false },
      { label: 'Manage locations & operating hours', owner: true, admin: true, manager: false, staff: false },
      { label: 'Manage services & pricing', owner: true, admin: true, manager: false, staff: false },
      { label: 'WhatsApp & communication integrations', owner: true, admin: true, manager: false, staff: false },
    ],
  },
];

const COLUMNS = [
  { key: 'owner', label: 'Owner', badgeClass: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20' },
  { key: 'admin', label: 'Admin', badgeClass: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20' },
  { key: 'manager', label: 'Manager (Front Desk)', badgeClass: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20' },
  { key: 'staff', label: 'Staff Specialist', badgeClass: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' },
] as const;

function PermIcon({ value }: { value: Permission }) {
  if (value === true) return <Check className="w-4 h-4 text-emerald-500" />;
  if (value === false) return <X className="w-4 h-4 text-outline opacity-40" />;
  return (
    <span title="Limited — depends on assigned scope">
      <Minus className="w-4 h-4 text-amber-500" />
    </span>
  );
}

export function RolesTable() {
  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-on-surface-variant dark:text-zinc-400">
        <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Full access</span>
        <span className="flex items-center gap-1.5"><Minus className="w-3.5 h-3.5 text-amber-500" /> Assigned scope only</span>
        <span className="flex items-center gap-1.5"><X className="w-3.5 h-3.5 text-outline opacity-50" /> No access</span>
      </div>

      {/* Role header cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
        {COLUMNS.map(col => (
          <div key={col.key} className={`rounded-xl p-3.5 text-center ${col.badgeClass}`}>
            <div className="font-bold text-sm">{col.label}</div>
            <div className="text-[11px] text-on-surface-variant dark:text-zinc-400 mt-1 leading-snug">
              {col.key === 'owner' && 'Workspace creator, billing & root ownership'}
              {col.key === 'admin' && 'Locations, services, templates & operations lead'}
              {col.key === 'manager' && 'Service Desk, live triage & QR boarding pass scanner'}
              {col.key === 'staff' && 'My Desk, station kiosk tablet & service fulfiller'}
            </div>
          </div>
        ))}
      </div>

      {/* Permission matrix */}
      <div className="border border-border dark:border-dark-border rounded-xl overflow-hidden shadow-sm">
        {FEATURE_MATRIX.map((section) => (
          <div key={section.category}>
            {/* Category row */}
            <div className="bg-surface-container dark:bg-zinc-800/80 px-4 py-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant dark:text-zinc-400">
                {section.category}
              </span>
            </div>

            {/* Feature rows */}
            <div className="divide-y divide-border dark:divide-dark-border">
              {section.features.map(f => (
                <div
                  key={f.label}
                  className="grid grid-cols-2 md:grid-cols-4 items-center px-4 py-3 bg-white dark:bg-zinc-900/60 hover:bg-surface-container-lowest dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="col-span-2 md:col-span-1 pr-2 mb-2 md:mb-0">
                    <p className="text-xs font-medium text-on-surface dark:text-white">{f.label}</p>
                    {f.description && (
                      <p className="text-[10px] text-zinc-400 mt-0.5">{f.description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-around col-span-2 md:col-span-3">
                    <div className="flex flex-col items-center gap-0.5 w-16">
                      <span className="text-[10px] text-zinc-400 md:hidden font-semibold">Owner</span>
                      <PermIcon value={f.owner} />
                    </div>
                    <div className="flex flex-col items-center gap-0.5 w-16">
                      <span className="text-[10px] text-zinc-400 md:hidden font-semibold">Admin</span>
                      <PermIcon value={f.admin} />
                    </div>
                    <div className="flex flex-col items-center gap-0.5 w-16">
                      <span className="text-[10px] text-zinc-400 md:hidden font-semibold">Manager</span>
                      <PermIcon value={f.manager} />
                    </div>
                    <div className="flex flex-col items-center gap-0.5 w-16">
                      <span className="text-[10px] text-zinc-400 md:hidden font-semibold">Staff</span>
                      <PermIcon value={f.staff} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
