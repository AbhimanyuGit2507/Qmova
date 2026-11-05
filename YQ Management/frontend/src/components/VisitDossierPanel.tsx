import React from 'react';
import { X, User, Phone, Calendar, Clock, ExternalLink, MapPin, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { fetchApi } from '../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Props {
  visit: AnyFixMe;
  onClose: () => void;
  onOpenFull?: (visit: AnyFixMe) => void;
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  CONFIRMED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  SERVING: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  CANCELLED: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-900/40 dark:text-zinc-400',
  PENDING_APPROVAL: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  CHECKED_IN: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
  WAITING: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  NO_SHOW: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-900/40 dark:text-zinc-400',
  MISSED: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-900/40 dark:text-zinc-400',
};

function formatTimeStr(dateStr?: string | Date | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return format(d, 'h:mm a');
}

function formatDateTimeStr(dateStr?: string | Date | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return format(d, 'MMM d, yyyy · h:mm a');
}

export function VisitDossierPanel({ visit, onClose, onOpenFull }: Props) {
  const queryClient = useQueryClient();

  const name = visit.customer?.name || visit.customerName || 'Walk-in Customer';
  const phone = visit.customer?.phone || visit.phone || null;
  const email = visit.customer?.email || null;
  const service = visit.service?.name || null;
  const location = visit.location?.name || visit.service?.location?.name || null;
  const status = visit.status || visit.currentState || 'SCHEDULED';
  const isAppointment = visit._type === 'Appointment';
  const tags = visit.tags || visit.customer?.tags || [];

  // Actual duration computation
  const serviceStartTime = visit.serviceStart;
  const serviceEndTime = visit.completedAt || visit.serviceEnd;
  const actualDurationMins = serviceStartTime && serviceEndTime
    ? Math.max(0, Math.round((new Date(serviceEndTime).getTime() - new Date(serviceStartTime).getTime()) / 60000))
    : null;

  // Wait time = arrival → service start
  const arrivalTime = visit.checkInTime || visit.waitingStart || visit.actualArrival;
  const waitMins = arrivalTime && serviceStartTime
    ? Math.max(0, Math.round((new Date(serviceStartTime).getTime() - new Date(arrivalTime).getTime()) / 60000))
    : null;

  // Scheduled duration
  const scheduledDurationMins = visit.scheduledStart && visit.scheduledEnd
    ? Math.round((new Date(visit.scheduledEnd).getTime() - new Date(visit.scheduledStart).getTime()) / 60000)
    : null;

  // Timeline events
  const timelineEvents = [
    { label: isAppointment ? 'Appointment Booked' : 'Walk-in Created', time: visit.scheduledStart || visit.createdAt, active: true },
    { label: 'Arrived / Checked In', time: arrivalTime, active: !!arrivalTime },
    { label: 'Service Started', time: serviceStartTime, active: !!serviceStartTime },
    { label: 'Completed', time: serviceEndTime, active: !!serviceEndTime },
  ];

  const checkInMutation = useMutation({
    mutationFn: () =>
      visit._type === 'Appointment'
        ? fetchApi(`/visit/checkin-appointment/${visit.id}`, { method: 'POST' })
        : fetchApi(`/visit/${visit.id}/checkin`, { method: 'POST' }),
    onSuccess: () => {
      toast.success('Checked in successfully');
      queryClient.invalidateQueries({ queryKey: ['schedule-view'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
    onError: () => toast.error('Check-in failed'),
  });

  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.SCHEDULED;
  const canCheckIn = ['SCHEDULED', 'CONFIRMED', 'PENDING_APPROVAL'].includes(status);

  return (
    <div className="w-72 xl:w-80 shrink-0 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-2xl overflow-hidden flex flex-col shadow-lg transition-all duration-200">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border dark:border-dark-border flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${statusColor}`}>
              {status.replace(/_/g, ' ')}
            </span>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-medium">
              {isAppointment ? '📅 Appt' : '🚶 Walk-in'}
            </span>
          </div>
          <h3 className="font-bold text-sm text-on-surface dark:text-white truncate">{name}</h3>
          {phone && (
            <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
              <Phone className="w-3 h-3 shrink-0" />
              {phone}
            </p>
          )}
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Key info */}
        <div className="px-4 py-3 border-b border-border dark:border-dark-border space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
            <span className="text-on-surface dark:text-white font-medium">{formatDateTimeStr(visit.scheduledStart || visit.createdAt)}</span>
          </div>
          {service && (
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3.5 h-3.5 shrink-0 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-primary" /></div>
              <span className="text-on-surface-variant">{service}</span>
            </div>
          )}
          {location && (
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
              <span className="text-on-surface-variant">{location}</span>
            </div>
          )}
          {visit.staff && (
            <div className="flex items-center gap-2 text-xs">
              <User className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
              <span className="text-on-surface-variant">Staff: <span className="font-medium text-on-surface dark:text-white">{visit.staff.name}</span></span>
            </div>
          )}
          {email && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-on-surface-variant w-3.5 h-3.5 shrink-0 text-center leading-none">@</span>
              <span className="text-on-surface-variant truncate">{email}</span>
            </div>
          )}
        </div>

        {/* Duration stats */}
        {(actualDurationMins !== null || waitMins !== null || scheduledDurationMins !== null) && (
          <div className="px-4 py-3 border-b border-border dark:border-dark-border">
            <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Duration Stats</p>
            <div className="grid grid-cols-3 gap-1.5">
              {scheduledDurationMins !== null && (
                <div className="bg-surface-container-low dark:bg-white/5 rounded-xl p-2 text-center">
                  <p className="text-sm font-bold text-on-surface dark:text-white tabular-nums">{scheduledDurationMins}m</p>
                  <p className="text-[9px] text-on-surface-variant uppercase tracking-wide mt-0.5">Booked</p>
                </div>
              )}
              {actualDurationMins !== null && (
                <div className={`rounded-xl p-2 text-center ${scheduledDurationMins && actualDurationMins > scheduledDurationMins * 1.2 ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30'}`}>
                  <p className={`text-sm font-bold tabular-nums ${scheduledDurationMins && actualDurationMins > scheduledDurationMins * 1.2 ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>{actualDurationMins}m</p>
                  <p className="text-[9px] text-on-surface-variant uppercase tracking-wide mt-0.5">Actual</p>
                </div>
              )}
              {waitMins !== null && (
                <div className="bg-sky-50 dark:bg-sky-950/30 rounded-xl p-2 text-center">
                  <p className="text-sm font-bold text-sky-700 dark:text-sky-300 tabular-nums">{waitMins}m</p>
                  <p className="text-[9px] text-on-surface-variant uppercase tracking-wide mt-0.5">Wait</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Visit Timeline */}
        <div className="px-4 py-3 border-b border-border dark:border-dark-border">
          <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">Visit Timeline</p>
          <div className="relative">
            <div className="absolute left-[8px] top-3 bottom-3 w-px bg-border dark:bg-dark-border" />
            <div className="space-y-3">
              {timelineEvents.map((event, i) => (
                <div key={i} className="relative flex items-start gap-3 pl-6">
                  <div className={`absolute left-0 top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                    event.active && event.time
                      ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-500/30'
                      : event.active
                      ? 'bg-primary border-primary shadow-sm shadow-primary/30'
                      : 'bg-card dark:bg-dark-card border-border dark:border-dark-border'
                  }`}>
                    {event.active && event.time && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-medium leading-tight ${event.active && event.time ? 'text-on-surface dark:text-white' : 'text-on-surface-variant opacity-40'}`}>
                      {event.label}
                    </p>
                    <p className={`text-[10px] mt-0.5 tabular-nums ${event.time ? 'text-on-surface-variant' : 'text-on-surface-variant opacity-30'}`}>
                      {event.time ? formatTimeStr(event.time) : 'Pending'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="px-4 py-3 border-b border-border dark:border-dark-border">
            <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Tags</p>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag: string, i: number) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-medium">
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {(visit.notes || visit.internalNotes) && (
          <div className="px-4 py-3 border-b border-border dark:border-dark-border">
            <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">Notes</p>
            <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-4">{visit.notes || visit.internalNotes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 space-y-2 border-t border-border dark:border-dark-border">
        {canCheckIn && (
          <button
            onClick={() => checkInMutation.mutate()}
            disabled={checkInMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
          >
            {checkInMutation.isPending ? 'Checking in...' : '✓ Check In Now'}
          </button>
        )}
        {onOpenFull && (
          <button
            onClick={() => onOpenFull(visit)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Full Details
          </button>
        )}
      </div>
    </div>
  );
}
