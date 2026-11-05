import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../components/AdminLayout';
import {
  Search, Plus, ChevronLeft, ChevronRight, Calendar, Download,
  RefreshCw, Eye, PanelRight, Users, Clock, TrendingUp, CheckCircle2,
  Zap, X,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../../lib/api';
import { VisitDrawer } from '../../../components/VisitDrawer';
import { VisitDossierPanel } from '../../../components/VisitDossierPanel';
import { CreateAppointmentModal } from '../../../components/modals/CreateAppointmentModal';
import { MatrixCalendar } from '../../../components/MatrixCalendar';
import { ScheduleSidebar } from '../../../components/ScheduleSidebar';
import { format } from 'date-fns';
import { useLocation } from '../../../components/LocationContext';
import { useAuth } from '../../../components/AuthContext';

type CalendarView = 'day' | 'week' | 'month';

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function getWeekStart(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthEnd(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function getStatusColorClasses(status: string): string {
  const map: Record<string, string> = {
    SCHEDULED: 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/50',
    CONFIRMED: 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/50',
    IN_PROGRESS: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
    SERVING: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
    COMPLETED: 'bg-zinc-100 text-zinc-500 border border-zinc-200 dark:bg-zinc-900/40 dark:text-zinc-400 dark:border-zinc-800/50',
    CANCELLED: 'bg-zinc-50 text-zinc-400 border border-dashed border-zinc-200 dark:bg-zinc-900/20 dark:text-zinc-600 dark:border-zinc-800/30',
    PENDING_APPROVAL: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50',
    CHECKED_IN: 'bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/50',
    WAITING: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50',
    NO_SHOW: 'bg-zinc-50 text-zinc-400 border border-dashed border-zinc-200 dark:bg-zinc-900/20 dark:text-zinc-600',
    MISSED: 'bg-zinc-50 text-zinc-400 border border-dashed border-zinc-200 dark:bg-zinc-900/20 dark:text-zinc-600',
  };
  return map[status] || map.SCHEDULED;
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { activeLocationId } = useLocation();

  // State
  const [dossierVisit, setDossierVisit] = useState<AnyFixMe | null>(null); // compact right sidebar
  const [fullDrawerVisit, setFullDrawerVisit] = useState<AnyFixMe | null>(null); // full overlay drawer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<CalendarView>('day');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [showSidebar, setShowSidebar] = useState(true);
  const [rescheduleData, setRescheduleData] = useState<{ apt: AnyFixMe; newTime: Date; serviceId: string | null } | null>(null);

  const locParam = activeLocationId && activeLocationId !== 'all' ? `&locationId=${activeLocationId}` : '';
  const locParamPrefix = activeLocationId && activeLocationId !== 'all' ? `?locationId=${activeLocationId}` : '';

  // Date range helpers
  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const startOfDay = new Date(currentDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(currentDate);
  endOfDay.setHours(23, 59, 59, 999);

  // ---- Queries ----
  const { data: scheduleViewData, isLoading: scheduleLoading, refetch: refetchSchedule } = useQuery({
    queryKey: ['schedule-view', dateStr, activeLocationId],
    queryFn: () =>
      fetchApi(`/appointments/schedule-view?date=${dateStr}&start=${encodeURIComponent(startOfDay.toISOString())}&end=${encodeURIComponent(endOfDay.toISOString())}${locParam}`)
        .catch(() => null),
    enabled: view === 'day',
  });

  const { data: visitsData = [], isLoading: visitsLoading, refetch: refetchVisits } = useQuery({
    queryKey: ['visits', activeLocationId],
    queryFn: () => fetchApi(`/visits${locParamPrefix}`).then((res: any) => res.data || res).catch(() => []),
    enabled: view !== 'day',
  });

  const { data: appointmentsData = [], isLoading: appointmentsLoading, refetch: refetchAppointments } = useQuery({
    queryKey: ['appointments', activeLocationId],
    queryFn: () => fetchApi(`/appointments${locParamPrefix}`).catch(() => []),
  });

  const { data: queuesData = [], isLoading: queuesLoading, refetch: refetchQueues } = useQuery({
    queryKey: ['queues', activeLocationId],
    queryFn: () => fetchApi(`/queue${locParamPrefix}`).catch(() => []),
    enabled: view !== 'day',
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services', activeLocationId],
    queryFn: () => fetchApi(`/service${locParamPrefix}`).catch(() => []),
  });

  const isLoading = view === 'day' ? scheduleLoading : (visitsLoading || appointmentsLoading || queuesLoading);

  const handleRefresh = () => {
    refetchSchedule();
    refetchVisits();
    refetchAppointments();
    refetchQueues();
  };

  // ---- Mutations ----
  const checkInMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: 'Appointment' | 'Visit' }) =>
      type === 'Appointment'
        ? fetchApi(`/visit/checkin-appointment/${id}`, { method: 'POST' })
        : fetchApi(`/visit/${id}/checkin`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['schedule-view'] });
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, scheduledStart, serviceId }: { id: string; scheduledStart: Date; serviceId: string | null }) =>
      fetchApi(`/appointments/${id}`, { method: 'PATCH', body: JSON.stringify({ scheduledStart, serviceId }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setRescheduleData(null);
    },
  });

  // ---- Combined items for week/month ----
  const combinedItems = useMemo(() => {
    const items: AnyFixMe[] = [];
    appointmentsData.forEach((apt: AnyFixMe) => {
      items.push({
        ...apt,
        _type: 'Appointment',
        scheduledTime: apt.scheduledStart || apt.createdAt,
        currentState: apt.status,
      });
    });
    visitsData.forEach((v: AnyFixMe) => {
      if (!v.appointmentId) {
        items.push({ ...v, _type: 'Visit', scheduledTime: v.createdAt, currentState: v.status || v.currentState });
      }
    });
    queuesData.forEach((q: AnyFixMe) => {
      if (q.tokens) {
        q.tokens.forEach((t: AnyFixMe) => {
          items.push({
            ...t,
            _type: t.isAppointment ? 'Token (Scheduled)' : 'Token (Walk-in)',
            scheduledTime: t.scheduledFor || t.createdAt,
            currentState: t.status,
            customer: { name: t.customerName, phone: t.phone },
            service: { name: q.name, id: q.serviceId },
            serviceId: q.serviceId,
          });
        });
      }
    });

    if (user && user.role === 'MANAGER' && user.allowedServiceIds && user.allowedServiceIds.length > 0) {
      return items.filter(item => user.allowedServiceIds!.includes(item.serviceId));
    }
    return items;
  }, [appointmentsData, visitsData, queuesData, user]);

  // ---- Filtered appointments (week/month) ----
  const filteredAppointments = useMemo(() => {
    return combinedItems.filter((apt: AnyFixMe) => {
      const searchMatch = !searchQuery ||
        apt.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.customer?.phone?.includes(searchQuery) ||
        apt.customerName?.toLowerCase().includes(searchQuery.toLowerCase());

      const aptDate = apt.scheduledTime ? new Date(apt.scheduledTime) : new Date(apt.createdAt);

      let dateMatch = false;
      if (view === 'day') {
        dateMatch = isSameDay(aptDate, currentDate);
      } else if (view === 'week') {
        const ws = getWeekStart(currentDate);
        const we = new Date(ws);
        we.setDate(we.getDate() + 6);
        we.setHours(23, 59, 59, 999);
        dateMatch = aptDate >= ws && aptDate <= we;
      } else {
        const ms = getMonthStart(currentDate);
        const me = getMonthEnd(currentDate);
        me.setHours(23, 59, 59, 999);
        dateMatch = aptDate >= ms && aptDate <= me;
      }

      const statusMatch = statusFilter === 'ALL' || apt.currentState === statusFilter;
      const serviceMatch = serviceFilter === 'ALL' || apt.serviceId === serviceFilter;

      return searchMatch && dateMatch && statusMatch && serviceMatch;
    });
  }, [combinedItems, searchQuery, currentDate, view, statusFilter, serviceFilter]);

  // ---- Export ----
  const exportToCSV = () => {
    const headers = ['Type', 'Customer Name', 'Phone', 'Service', 'Date & Time', 'Status'];
    const rows = filteredAppointments.map((apt: AnyFixMe) => {
      const d = apt.scheduledTime ? new Date(apt.scheduledTime) : new Date(apt.createdAt);
      return [
        apt._type,
        apt.customer?.name || apt.customerName || '',
        apt.customer?.phone || '',
        apt.service?.name || '',
        format(d, 'yyyy-MM-dd HH:mm'),
        apt.currentState || 'Scheduled',
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `appointments_${format(currentDate, 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ---- Navigation ----
  const navigate = (dir: 1 | -1) => {
    const d = new Date(currentDate);
    if (view === 'day') d.setDate(d.getDate() + dir);
    else if (view === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  const dateLabel = () => {
    if (view === 'day') return currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    if (view === 'week') {
      const ws = getWeekStart(currentDate);
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      return `${ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${we.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isToday = view === 'day' && isSameDay(currentDate, new Date());

  // ---- Day view stat bar ----
  const dayStats = useMemo(() => {
    if (!scheduleViewData) return null;
    const apts = scheduleViewData.appointments ?? [];
    const visits = scheduleViewData.visits ?? [];
    const inProgress = apts.filter((a: AnyFixMe) => ['IN_PROGRESS', 'SERVING', 'CHECKED_IN'].includes(a.status)).length
      + visits.filter((v: AnyFixMe) => ['IN_PROGRESS', 'SERVING', 'CHECKED_IN'].includes(v.currentState)).length;
    const completed = visits.filter((v: AnyFixMe) => v.currentState === 'COMPLETED').length;
    const walkins = visits.filter((v: AnyFixMe) => !v.appointmentId).length;
    return {
      booked: apts.length,
      walkins,
      inProgress,
      completed,
    };
  }, [scheduleViewData]);

  // ---- Week view ----
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(getWeekStart(currentDate));
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate]);

  // ---- Month view calendar grid ----
  const calendarDays = useMemo(() => {
    const monthStart = getMonthStart(currentDate);
    const gridStart = new Date(monthStart);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate]);

  // Handle card click: open dossier panel
  const handleCardClick = (apt: AnyFixMe) => {
    setDossierVisit(apt);
  };

  return (
    <AdminLayout pageTitle="Appointments">
      <Head>
        <title>Appointments | Qmova</title>
      </Head>

      <div className="w-full mx-auto space-y-5 p-4 sm:p-6 lg:p-8 overflow-x-hidden">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-on-surface dark:text-white tracking-tight">Schedule</h1>
            <p className="text-sm text-on-surface-variant dark:text-zinc-400 mt-0.5">Visual timeline for all visits and appointments.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-all shadow-sm border border-primary/20 hover:-translate-y-0.5 w-fit"
          >
            <Plus strokeWidth={1.5} className="w-5 h-5" />
            New Appointment
          </button>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between flex-wrap">
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-surface-container-low dark:bg-dark-canvas border border-border dark:border-dark-border rounded-xl p-1">
            {(['day', 'week', 'month'] as CalendarView[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all capitalize ${
                  view === v
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant dark:text-zinc-400 hover:text-on-surface dark:hover:text-white'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Date navigation + filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Date navigator */}
            <div className="flex items-center gap-1 bg-surface-container-low dark:bg-dark-canvas border border-border dark:border-dark-border rounded-xl p-1">
              <button
                onClick={handleRefresh}
                title="Refresh Data"
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors border-r border-border dark:border-dark-border mr-1 pr-2"
              >
                <RefreshCw strokeWidth={2} className={`w-4 h-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
              </button>
              <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
                <ChevronLeft strokeWidth={2} className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all min-w-[140px] text-center ${
                  isToday ? 'text-primary dark:text-sky-400 font-semibold' : 'text-on-surface dark:text-white'
                }`}
              >
                {dateLabel()}
              </button>
              <button onClick={() => navigate(1)} className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
                <ChevronRight strokeWidth={2} className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search strokeWidth={1.5} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-surface-container-low dark:bg-dark-canvas border border-border dark:border-dark-border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all text-on-surface dark:text-white placeholder:text-on-surface-variant w-28 sm:w-36"
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-surface-container-low dark:bg-dark-canvas border border-border dark:border-dark-border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all text-on-surface dark:text-white max-w-[130px]"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_APPROVAL">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Service filter */}
            <select
              value={serviceFilter}
              onChange={e => setServiceFilter(e.target.value)}
              className="px-3 py-2 max-w-[120px] truncate bg-surface-container-low dark:bg-dark-canvas border border-border dark:border-dark-border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all text-on-surface dark:text-white"
            >
              <option value="ALL">All Services</option>
              {services.map((s: AnyFixMe) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {/* Export */}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-3 py-2 bg-surface-container-low dark:bg-dark-canvas border border-border dark:border-dark-border rounded-xl text-sm hover:bg-surface-container hover:text-primary transition-colors text-on-surface dark:text-white"
            >
              <Download strokeWidth={1.5} className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* ── Day-view stat bar ── */}
        {view === 'day' && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Loading state */}
            {scheduleLoading && (
              <div className="flex items-center gap-2 text-xs text-on-surface-variant animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Loading schedule...
              </div>
            )}

            {dayStats && !scheduleLoading && (
              <>
                {[
                  { label: 'Booked', value: dayStats.booked, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/50', Icon: Calendar },
                  { label: 'Walk-ins', value: dayStats.walkins, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50', Icon: Users },
                  { label: 'In Service', value: dayStats.inProgress, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50', Icon: Zap },
                  { label: 'Completed', value: dayStats.completed, color: 'text-zinc-600 dark:text-zinc-400', bg: 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800/50', Icon: CheckCircle2 },
                ].map(stat => (
                  <div key={stat.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${stat.bg}`}>
                    <stat.Icon className={`w-3.5 h-3.5 ${stat.color}`} strokeWidth={2} />
                    <span className={`text-base font-bold tabular-nums ${stat.color}`}>{stat.value}</span>
                    <span className="text-xs text-on-surface-variant font-medium">{stat.label}</span>
                  </div>
                ))}
              </>
            )}

            {!scheduleLoading && !dayStats && (
              <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                <Calendar strokeWidth={1.5} className="w-4 h-4" />
                <span>
                  <span className="font-semibold text-on-surface dark:text-white">{filteredAppointments.length}</span>{' '}
                  appointment{filteredAppointments.length !== 1 ? 's' : ''} this day
                </span>
              </div>
            )}

            {/* Controls toggle for day view */}
            {view === 'day' && (
              <button
                onClick={() => setShowSidebar(s => !s)}
                className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  showSidebar ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container text-on-surface-variant'
                }`}
              >
                <PanelRight className="w-3.5 h-3.5" />
                Controls
              </button>
            )}
          </div>
        )}

        {/* ── Week/Month count bar ── */}
        {view !== 'day' && (
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Calendar strokeWidth={1.5} className="w-4 h-4" />
            <span>
              <span className="font-semibold text-on-surface dark:text-white">{filteredAppointments.length}</span>{' '}
              appointment{filteredAppointments.length !== 1 ? 's' : ''} this {view}
            </span>
            {isLoading && <span className="text-xs animate-pulse ml-1">Loading...</span>}
          </div>
        )}

        {/* ══════════════════════════════════
            DAY VIEW — Matrix Timeline
        ══════════════════════════════════ */}
        {view === 'day' && (
          <div className="mt-2 flex gap-4 overflow-x-hidden w-full">
            {/* Timeline */}
            <div className="flex-1 min-w-0 overflow-x-auto">
              <MatrixCalendar
                scheduleData={scheduleViewData ?? undefined}
                appointments={filteredAppointments}
                services={services}
                currentDate={currentDate}
                onReschedule={(apt, newTime, serviceId) => setRescheduleData({ apt, newTime, serviceId })}
                showEmptySlots={true}
                showIdleGaps={true}
                showBufferZones={true}
                showWalkins={true}
                rowDensity="normal"
                onSelectApt={handleCardClick}
              />
            </div>

            {/* Right panel: Dossier or Schedule Controls */}
            {dossierVisit ? (
              <VisitDossierPanel
                visit={dossierVisit}
                onClose={() => setDossierVisit(null)}
                onOpenFull={(v) => { setFullDrawerVisit(v); }}
              />
            ) : showSidebar ? (
              <ScheduleSidebar
                services={scheduleViewData?.services ?? services}
                appointments={scheduleViewData?.appointments ?? appointmentsData}
                visits={scheduleViewData?.visits ?? []}
              />
            ) : null}
          </div>
        )}

        {/* ══════════════════════════════════
            WEEK VIEW — 7-column grid
        ══════════════════════════════════ */}
        {view === 'week' && (
          <div className="flex gap-4">
            <div className="flex-1 min-w-0">
              <div className="rounded-2xl overflow-hidden border border-border dark:border-dark-border shadow-sm">
                {/* Day headers */}
                <div className="grid grid-cols-7 bg-surface-container-lowest dark:bg-dark-canvas border-b border-border dark:border-dark-border">
                  {weekDays.map(day => {
                    const isT = isSameDay(day, new Date());
                    return (
                      <div
                        key={day.toISOString()}
                        className={`px-3 py-3 text-center border-r border-border dark:border-dark-border last:border-r-0 ${isT ? 'bg-primary/5' : ''}`}
                      >
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${isT ? 'text-primary' : 'text-on-surface-variant'}`}>
                          {format(day, 'EEE')}
                        </p>
                        <div className={`text-lg font-bold mt-0.5 w-8 h-8 mx-auto flex items-center justify-center rounded-full ${isT ? 'bg-primary text-white' : 'text-on-surface dark:text-white'}`}>
                          {format(day, 'd')}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Day columns */}
                <div className="grid grid-cols-7 bg-border dark:bg-dark-border gap-px min-h-[480px]">
                  {weekDays.map(day => {
                    const dayApts = filteredAppointments.filter(apt =>
                      isSameDay(new Date(apt.scheduledTime || apt.createdAt), day)
                    ).sort((a, b) =>
                      new Date(a.scheduledTime || a.createdAt).getTime() - new Date(b.scheduledTime || b.createdAt).getTime()
                    );
                    const isT = isSameDay(day, new Date());
                    return (
                      <div
                        key={day.toISOString()}
                        className={`bg-card dark:bg-dark-card flex flex-col min-h-[480px] ${isT ? 'ring-2 ring-inset ring-primary/40' : ''}`}
                      >
                        {dayApts.length === 0 ? (
                          <div className="flex-1 flex items-center justify-center">
                            <span className="text-xs text-on-surface-variant opacity-25">—</span>
                          </div>
                        ) : (
                          <div className="flex-1 p-1.5 space-y-1 overflow-y-auto custom-scrollbar">
                            {dayApts.map(apt => {
                              const s = apt.currentState || apt.status || 'SCHEDULED';
                              return (
                                <button
                                  key={apt.id}
                                  onClick={() => handleCardClick(apt)}
                                  className={`w-full text-left rounded-lg px-2 py-1.5 text-[10px] font-medium transition-all hover:scale-[1.02] hover:z-10 relative ${getStatusColorClasses(s)}`}
                                >
                                  <p className="truncate font-semibold text-[11px]">{apt.customer?.name || apt.customerName || 'Walk-in'}</p>
                                  <p className="opacity-70 mt-0.5">{format(new Date(apt.scheduledTime || apt.createdAt), 'h:mm a')}</p>
                                  {apt.service?.name && <p className="opacity-50 truncate">{apt.service.name}</p>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Week dossier sidebar */}
            {dossierVisit && (
              <VisitDossierPanel
                visit={dossierVisit}
                onClose={() => setDossierVisit(null)}
                onOpenFull={v => setFullDrawerVisit(v)}
              />
            )}
          </div>
        )}

        {/* ══════════════════════════════════
            MONTH VIEW — calendar grid
        ══════════════════════════════════ */}
        {view === 'month' && (
          <div className="flex gap-4">
            <div className="flex-1 min-w-0">
              {/* Day of week headers */}
              <div className="grid grid-cols-7 mb-px">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant py-2">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-px bg-border dark:bg-dark-border rounded-2xl overflow-hidden border border-border dark:border-dark-border shadow-sm">
                {calendarDays.map(day => {
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const isT = isSameDay(day, new Date());
                  const dayApts = combinedItems.filter(apt =>
                    isSameDay(new Date(apt.scheduledTime || apt.createdAt), day)
                  );
                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => { setCurrentDate(new Date(day)); setView('day'); }}
                      className={`bg-card dark:bg-dark-card min-h-[100px] p-2 cursor-pointer hover:bg-surface-container-low dark:hover:bg-white/[0.02] transition-colors ${!isCurrentMonth ? 'opacity-30' : ''}`}
                    >
                      <div className={`text-sm font-bold mb-1.5 w-7 h-7 flex items-center justify-center rounded-full transition-all ${isT ? 'bg-primary text-white shadow-sm' : 'text-on-surface dark:text-white hover:bg-primary/10'}`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-0.5">
                        {dayApts.slice(0, 3).map(apt => {
                          const s = apt.currentState || apt.status || 'SCHEDULED';
                          return (
                            <div
                              key={apt.id}
                              onClick={e => { e.stopPropagation(); handleCardClick(apt); }}
                              className={`text-[9px] rounded px-1 py-0.5 truncate font-semibold cursor-pointer hover:scale-[1.02] transition-all ${getStatusColorClasses(s)}`}
                            >
                              {apt.customer?.name || apt.customerName || 'Walk-in'}
                            </div>
                          );
                        })}
                        {dayApts.length > 3 && (
                          <div className="text-[9px] text-on-surface-variant font-medium pl-1 opacity-60">
                            +{dayApts.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Month dossier sidebar */}
            {dossierVisit && (
              <VisitDossierPanel
                visit={dossierVisit}
                onClose={() => setDossierVisit(null)}
                onOpenFull={v => setFullDrawerVisit(v)}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Full VisitDrawer overlay ── */}
      {fullDrawerVisit && (
        <VisitDrawer
          isOpen={!!fullDrawerVisit}
          onClose={() => setFullDrawerVisit(null)}
          visit={fullDrawerVisit}
        />
      )}

      {/* ── Create Appointment Modal ── */}
      <CreateAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* ── Reschedule Confirmation Modal ── */}
      {rescheduleData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card dark:bg-dark-card rounded-2xl w-full max-w-md shadow-xl border border-border dark:border-dark-border overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Confirm Reschedule</h3>
              <p className="text-on-surface-variant mb-6 text-sm">
                Are you sure you want to reschedule the appointment for{' '}
                <strong>{rescheduleData.apt.customer?.name || rescheduleData.apt.customerName || 'Walk-in'}</strong>?
              </p>
              <div className="bg-surface-container-low dark:bg-white/5 rounded-xl p-4 mb-6 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">From:</span>
                  <span className="font-medium">{format(new Date(rescheduleData.apt.scheduledTime || rescheduleData.apt.createdAt), 'MMM d, h:mm a')}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">To:</span>
                  <span className="font-medium text-indigo-500">{format(rescheduleData.newTime, 'MMM d, h:mm a')}</span>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setRescheduleData(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-surface-container-high transition-colors"
                  disabled={rescheduleMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={() => rescheduleMutation.mutate({ id: rescheduleData.apt.id, scheduledStart: rescheduleData.newTime, serviceId: rescheduleData.serviceId })}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                  disabled={rescheduleMutation.isPending}
                >
                  {rescheduleMutation.isPending ? 'Rescheduling...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
