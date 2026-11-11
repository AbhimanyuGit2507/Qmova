/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  MarkerType,
  BackgroundVariant,
  MiniMap,
  NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Settings2,
  ScanLine,
  Package,
  CreditCard,
  LayoutGrid,
  LogIn,
  LogOut,
  Bell,
  Clock,
  ClipboardList,
  Sparkles,
  UserCheck,
  Calendar,
  LayoutTemplate,
  RotateCcw,
} from 'lucide-react';

const TYPE_CONFIG: Record<string, { label: string; color: string; darkColor: string; icon: any }> = {
  CHECK_IN:    { label: 'Booking Verification (QR Scan)', color: '#4f46e5', darkColor: '#818cf8', icon: LogIn },
  CHECK_OUT:   { label: 'Completed Stage',    color: '#059669', darkColor: '#34d399', icon: LogOut },
  CHECKPOINT:  { label: 'Checkpoint',   color: '#6366f1', darkColor: '#818cf8', icon: ScanLine },
  SERVICE:     { label: 'Service Area', color: '#7c3aed', darkColor: '#a78bfa', icon: LayoutGrid },
  COLLECTION:  { label: 'Collection',   color: '#0891b2', darkColor: '#22d3ee', icon: Package },
  PAYMENT:     { label: 'Payment',      color: '#d97706', darkColor: '#fbbf24', icon: CreditCard },
  NOTIFICATION:{ label: 'Notify',       color: '#db2777', darkColor: '#f472b6', icon: Bell },
  WAITING_PERIOD:{ label: 'Waiting / Prep Stage', color: '#64748b', darkColor: '#94a3b8', icon: Clock },
  FORM:        { label: 'Form',         color: '#0284c7', darkColor: '#38bdf8', icon: ClipboardList },
};

// ── Custom node for editable (middle) stages ──────────────────────────────────
const CustomNode = ({ data, selected }: any) => {
  const cfg = TYPE_CONFIG[data.type] || TYPE_CONFIG.SERVICE;
  const Icon = cfg.icon;
  const isSelected = data.isSelected || selected;

  return (
    <div
      onClick={() => data.onEdit && data.onEdit(data.step)}
      style={{
        borderColor: cfg.color,
        boxShadow: isSelected
          ? `0 0 0 3.5px ${cfg.color}60, 0 16px 36px -6px ${cfg.color}35`
          : undefined,
        transition: 'box-shadow 300ms cubic-bezier(0.16, 1, 0.3, 1), transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`relative w-[260px] bg-white dark:bg-zinc-900 rounded-2xl border-2 cursor-grab active:cursor-grabbing group ${
        isSelected
          ? 'shadow-2xl scale-[1.02] ring-2 ring-primary/40 dark:ring-primary/50 -translate-y-0.5 z-20'
          : 'shadow-md hover:shadow-xl hover:scale-[1.015] hover:-translate-y-0.5'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3.5 !h-3.5 !border-2 !border-white dark:!border-zinc-900 !rounded-full shadow-md z-20 transition-transform hover:scale-125 cursor-crosshair"
        style={{ background: cfg.color, top: -7 }}
      />

      {/* Clean top boundary stripe flush with card rounded border */}
      <div className="rounded-t-[14px] overflow-hidden">
        <div style={{ backgroundColor: cfg.color }} className="h-2 w-full" />
      </div>

      <div className="p-3.5">
        {/* Type badge */}
        <div className="flex items-center justify-between mb-2">
          <span
            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ color: cfg.color, background: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}
          >
            <Icon className="w-3 h-3" />
            {cfg.label}
          </span>
          {data.isOptional && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700">
              Optional
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="font-bold text-sm text-zinc-900 dark:text-white leading-snug mb-1">
          {data.name}
        </h3>

        {/* Description */}
        {data.description && (
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-2.5">
            {data.description}
          </p>
        )}

        {/* Stage requirements chips */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          {data.type === 'WAITING_PERIOD' && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="w-2.5 h-2.5" /> {data.step?.expectedDuration || 5}m Wait
            </span>
          )}
          {data.step?.requiresQrScan && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <ScanLine className="w-2.5 h-2.5" /> QR Scan
            </span>
          )}
        </div>

        {/* Edit button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            data.onEdit(data.step);
          }}
          className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200 border ${
            isSelected
              ? 'opacity-100 font-bold'
              : 'opacity-0 group-hover:opacity-100'
          }`}
          style={{ color: cfg.color, background: `${cfg.color}15`, borderColor: `${cfg.color}30` }}
        >
          <Settings2 className="w-3 h-3" /> {isSelected ? 'Configuring Stage' : 'Configure Stage'}
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3.5 !h-3.5 !border-2 !border-white dark:!border-zinc-900 !rounded-full shadow-md z-20 transition-transform hover:scale-125 cursor-crosshair"
        style={{ background: cfg.color, bottom: -7 }}
      />
    </div>
  );
};

// ── System node (Booking Verification / Completed Stage) ──────────────────────
const SystemNode = ({ data, selected }: any) => {
  const isCheckIn = data.type === 'CHECK_IN';
  const cfg = TYPE_CONFIG[data.type] || TYPE_CONFIG.CHECK_IN;
  const Icon = cfg.icon;
  const isSelected = data.isSelected || selected;

  return (
    <div
      onClick={() => data.onEdit && data.onEdit(data.step)}
      className={`relative w-[260px] rounded-2xl border-2 bg-white dark:bg-zinc-900 cursor-grab active:cursor-grabbing group ${
        isSelected
          ? 'shadow-2xl scale-[1.02] ring-2 ring-primary/40 dark:ring-primary/50 -translate-y-0.5 z-20'
          : 'shadow-md hover:shadow-xl hover:scale-[1.015] hover:-translate-y-0.5'
      }`}
      style={{
        borderColor: cfg.color,
        boxShadow: isSelected
          ? `0 0 0 3.5px ${cfg.color}50, 0 16px 36px -6px ${cfg.color}35`
          : undefined,
        transition: 'box-shadow 300ms cubic-bezier(0.16, 1, 0.3, 1), transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Top Handle: Check-In connects from Booking Channel, Check-Out connects from last stage */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3.5 !h-3.5 !border-2 !border-white dark:!border-zinc-900 !rounded-full shadow-md z-20 transition-transform hover:scale-125 cursor-crosshair"
        style={{ background: cfg.color, top: -7 }}
      />

      {/* Top accent bar */}
      <div className="rounded-t-[14px] overflow-hidden">
        <div style={{ backgroundColor: cfg.color }} className="h-2 w-full" />
      </div>

      <div className="p-3.5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}30` }}
          >
            <Icon className="w-5 h-5" style={{ color: cfg.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: cfg.color }}>
                {isCheckIn ? '🔒 Verification Gate' : '🏁 Completed Stage'}
              </span>
            </div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight">
              {isCheckIn && (data.name === 'Check-In' || data.name === 'Booking Verification')
                ? 'Booking Verification (QR Scan)'
                : !isCheckIn && (data.name === 'Check-Out' || data.name === 'Completed')
                ? 'Completed Stage'
                : data.name}
            </h3>
          </div>
        </div>

        {data.description && (
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
            {data.description}
          </p>
        )}

        <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10px]">
          <span className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400 font-medium">
            {isCheckIn ? '📱 QR Scan Gate' : '✅ Final Handover'}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              data.onEdit(data.step);
            }}
            className={`flex items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-semibold transition-all duration-200 border ${
              isSelected ? 'opacity-100 font-bold' : 'opacity-0 group-hover:opacity-100'
            }`}
            style={{ color: cfg.color, background: `${cfg.color}15`, borderColor: `${cfg.color}30` }}
          >
            <Settings2 className="w-3 h-3" /> {isSelected ? 'Configuring' : 'Configure'}
          </button>
        </div>
      </div>

      {/* Only Check-In gets an outgoing source handle to middle stages */}
      {isCheckIn && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3.5 !h-3.5 !border-2 !border-white dark:!border-zinc-900 !rounded-full shadow-md z-20 transition-transform hover:scale-125 cursor-crosshair"
          style={{ background: cfg.color, bottom: -7 }}
        />
      )}
    </div>
  );
};

// ── Booking Channel node (Stage 0 Entry: Walk-in & Appointments) ──────────────
const BookingChannelNode = ({ data, selected }: any) => {
  const allowAppointments = Boolean(data.allowAppointments);
  const allowWalkins = data.allowWalkins !== false;
  const isSelected = selected || data.isSelected;

  return (
    <div
      onClick={() => data.onSelect && data.onSelect()}
      style={{
        boxShadow: isSelected
          ? '0 0 0 3px rgba(99, 102, 241, 0.5), 0 16px 36px -6px rgba(99, 102, 241, 0.3)'
          : undefined,
        transition: 'box-shadow 300ms cubic-bezier(0.16, 1, 0.3, 1), transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`relative w-[260px] rounded-2xl border-2 border-indigo-400/90 dark:border-indigo-500/90 bg-white dark:bg-zinc-900 shadow-md cursor-grab active:cursor-grabbing group ${
        isSelected
          ? 'shadow-2xl scale-[1.02] ring-2 ring-indigo-500/40 -translate-y-0.5 z-20'
          : 'hover:shadow-xl hover:scale-[1.015] hover:-translate-y-0.5'
      }`}
    >
      {/* Top accent bar */}
      <div className="rounded-t-[14px] overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />
      </div>

      <div className="p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Booking Channel
          </span>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80">
            Stage 0
          </span>
        </div>

        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">
            Customer Intake / Booking
          </h3>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            Origin point for all queue entries
          </p>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300 font-medium">
              <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> Walk-in Kiosk / Gate
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                allowWalkins
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${allowWalkins ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
              {allowWalkins ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300 font-medium">
              <Calendar className="w-3.5 h-3.5 text-purple-500" /> Online Appointments
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                allowAppointments
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${allowAppointments ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
              {allowAppointments ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3.5 !h-3.5 !border-2 !border-white dark:!border-zinc-900 !rounded-full shadow-md z-20 transition-transform hover:scale-125 cursor-crosshair"
        style={{ background: '#4f46e5', bottom: -7 }}
      />
    </div>
  );
};

// ── Empty state when no middle stages ─────────────────────────────────────────
const EmptyStagePrompt = ({ data }: any) => (
  <div
    className="w-[260px] rounded-2xl border-2 border-dashed border-border dark:border-dark-border bg-card dark:bg-dark-card flex flex-col items-center justify-center py-6 px-4 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-colors cursor-grab active:cursor-grabbing"
    onClick={data.onAddStage}
  >
    <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
    <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-2">
      <Settings2 className="w-5 h-5 text-primary" />
    </div>
    <p className="text-sm font-semibold text-on-surface dark:text-white">Add Custom Stages</p>
    <p className="text-[10px] text-on-surface-variant mt-1">Click &ldquo;+ Add Stage&rdquo; to build your journey</p>
    <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
  </div>
);

const nodeTypes = {
  custom: CustomNode,
  system: SystemNode,
  emptyPrompt: EmptyStagePrompt,
  bookingChannel: BookingChannelNode,
};

interface FlowBuilderProps {
  flow: any; // includes ALL steps (system + custom)
  selectedStepId?: string | null;
  onEditStep: (step: any) => void;
  onSaveTransitions: (fromStepId: string, transitions: any[]) => void;
  onEditEdge?: (edge: any) => void;
  onAddStage?: () => void;
  fitViewTrigger?: number;
}

export function FlowBuilder(props: FlowBuilderProps) {
  const { flow, selectedStepId, onEditStep, onSaveTransitions, onAddStage, fitViewTrigger } = props;
  const [rfInstance, setRfInstance] = React.useState<any>(null);
  const [mousePos, setMousePos] = React.useState<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const [isHovered, setIsHovered] = React.useState(false);
  const [zoomPercent, setZoomPercent] = React.useState(100);

  // Persistent node positions dictionary (stored per flow ID so positions survive drags, selection & refreshes)
  const positionsRef = useRef<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    if (!flow?.id) return;
    try {
      const saved = localStorage.getItem(`yq_flow_positions_${flow.id}`);
      if (saved) {
        positionsRef.current = JSON.parse(saved);
      }
    } catch {
      // ignore storage access issues
    }
  }, [flow?.id]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const handleFitView = useCallback(() => {
    if (!rfInstance) return;
    rfInstance.fitView({ padding: 0.22, maxZoom: 0.95, duration: 700 });
  }, [rfInstance]);

  // Listen for header fit view trigger
  useEffect(() => {
    if (fitViewTrigger && fitViewTrigger > 0) {
      handleFitView();
    }
  }, [fitViewTrigger, handleFitView]);

  const computeNodes = useCallback((forceDefaults: boolean = false) => {
    if (!flow?.steps) return [];
    const sorted = [...flow.steps].sort((a: any, b: any) => a.stepOrder - b.stepOrder);

    const checkIn = sorted.find((s: any) => s.type === 'CHECK_IN');
    const checkOut = sorted.find((s: any) => s.type === 'CHECK_OUT');
    const middleSteps = sorted.filter((s: any) => s.type !== 'CHECK_IN' && s.type !== 'CHECK_OUT');

    const CENTER_X = 140;
    let y = 0;
    const nodes: any[] = [];

    const getNodePos = (id: string, defaultY: number) => {
      if (!forceDefaults && positionsRef.current[id]) {
        return positionsRef.current[id];
      }
      return { x: CENTER_X, y: defaultY };
    };

    // 0. Booking Channel Card (Stage 0 Entry: Walk-in & Appointments)
    const allowAppointments = Boolean(flow.service?.allowAppointments);
    const bookingPos = getNodePos('__booking_channel__', y);
    nodes.push({
      id: '__booking_channel__',
      type: 'bookingChannel',
      position: bookingPos,
      data: { allowAppointments, allowWalkins: true },
      draggable: true,
    });
    y += 230;

    // Check-In (Optional initial verification gate)
    if (checkIn) {
      const isSelected = selectedStepId === checkIn.id;
      const checkInPos = getNodePos(checkIn.id, y);
      nodes.push({
        id: checkIn.id,
        type: 'system',
        position: checkInPos,
        data: { name: checkIn.name, description: checkIn.description, type: 'CHECK_IN', step: checkIn, onEdit: onEditStep, isSelected },
        selected: isSelected,
        draggable: true,
      });
      y += 230;
    }

    // Middle stages OR empty prompt
    if (middleSteps.length === 0) {
      const placeholderId = '__empty_prompt__';
      const emptyPos = getNodePos(placeholderId, y);
      nodes.push({
        id: placeholderId,
        type: 'emptyPrompt',
        position: emptyPos,
        data: { onAddStage },
        draggable: true,
      });
      y += 260;
    } else {
      for (const step of middleSteps) {
        const isSelected = selectedStepId === step.id;
        const stepPos = getNodePos(step.id, y);
        nodes.push({
          id: step.id,
          type: 'custom',
          position: stepPos,
          data: { name: step.name, description: step.description, type: step.type, isOptional: step.isOptional, step, onEdit: onEditStep, isSelected },
          selected: isSelected,
          draggable: true,
        });
        // Middle cards are ~170px height; advancing by 280px provides ~110px space between cards
        y += 280;
      }
    }

    // Check-Out (always last)
    if (checkOut) {
      const isSelected = selectedStepId === checkOut.id;
      const checkOutPos = getNodePos(checkOut.id, y);
      nodes.push({
        id: checkOut.id,
        type: 'system',
        position: checkOutPos,
        data: { name: checkOut.name, description: checkOut.description, type: 'CHECK_OUT', step: checkOut, onEdit: onEditStep, isSelected },
        selected: isSelected,
        draggable: true,
      });
    }

    return nodes;
  }, [flow, onEditStep, onAddStage, selectedStepId]);

  const initialNodes = useMemo(() => computeNodes(false), [computeNodes]);

  const initialEdges = useMemo(() => {
    if (!flow?.steps) return [];
    const sorted = [...flow.steps].sort((a: any, b: any) => a.stepOrder - b.stepOrder);
    const edges: any[] = [];

    const checkInNode = sorted.find((s: any) => s.type === 'CHECK_IN');
    const checkOutNode = sorted.find((s: any) => s.type === 'CHECK_OUT');
    const activeMiddle = sorted.filter((s: any) => s.type !== 'CHECK_IN' && s.type !== 'CHECK_OUT');

    // Connect Booking Channel -> Check-In (if present) OR directly to first active stage
    if (checkInNode) {
      edges.push({
        id: 'e-booking-checkin',
        source: '__booking_channel__',
        target: checkInNode.id,
        label: 'Arrival & QR Pass',
        animated: true,
        style: { stroke: '#4f46e5', strokeWidth: 2.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#4f46e5' },
        labelStyle: { fontSize: 10, fontWeight: 700, fill: '#4f46e5' },
        labelBgStyle: { fill: '#eef2ff', stroke: '#c7d2fe', strokeWidth: 1.5, rx: 8, ry: 8 },
        labelBgPadding: [10, 5],
      });
    } else if (activeMiddle.length > 0) {
      edges.push({
        id: 'e-booking-first-stage',
        source: '__booking_channel__',
        target: activeMiddle[0].id,
        label: 'Order Placed',
        animated: true,
        style: { stroke: '#4f46e5', strokeWidth: 2.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#4f46e5' },
        labelStyle: { fontSize: 10, fontWeight: 700, fill: '#4f46e5' },
        labelBgStyle: { fill: '#eef2ff', stroke: '#c7d2fe', strokeWidth: 1.5, rx: 8, ry: 8 },
        labelBgPadding: [10, 5],
      });
    }

    // For flows without middle stages
    const hasPlaceholder = activeMiddle.length === 0;
    if (hasPlaceholder) {
      const sourceId = checkInNode ? checkInNode.id : '__booking_channel__';
      edges.push({
        id: `e-${sourceId}-empty`,
        source: sourceId,
        target: '__empty_prompt__',
        animated: true,
        style: { stroke: '#818cf8', strokeWidth: 2.5, strokeDasharray: '6,4' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#818cf8' },
      });
      if (checkOutNode) {
        edges.push({
          id: `e-empty-${checkOutNode.id}`,
          source: '__empty_prompt__',
          target: checkOutNode.id,
          animated: true,
          style: { stroke: '#34d399', strokeWidth: 2.5, strokeDasharray: '6,4' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#34d399' },
        });
      }
      return edges;
    }

    sorted.forEach((step: any) => {
      if (step.transitions && step.transitions.length > 0) {
        step.transitions.forEach((t: any) => {
          if (t.toStepId) {
            const color = t.isDefault
              ? (TYPE_CONFIG[step.type]?.color || '#6366f1')
              : '#a78bfa';
            edges.push({
              id: `e-${step.id}-${t.toStepId}`,
              source: step.id,
              target: t.toStepId,
              label: t.label || '',
              animated: t.isDefault,
              style: { stroke: color, strokeWidth: 2.5 },
              markerEnd: { type: MarkerType.ArrowClosed, color },
              labelStyle: { fontSize: 10, fontWeight: 700, fill: color },
              labelBgStyle: { fill: '#f8fafc', stroke: `${color}40`, strokeWidth: 1.5, rx: 8, ry: 8 },
              labelBgPadding: [8, 4],
            });
          }
        });
      } else {
        // Auto-connect sequential
        const ci = sorted.findIndex((s: any) => s.id === step.id);
        if (ci < sorted.length - 1) {
          const next = sorted[ci + 1];
          const srcColor = TYPE_CONFIG[step.type]?.color || '#818cf8';
          edges.push({
            id: `e-auto-${step.id}-${next.id}`,
            source: step.id,
            target: next.id,
            animated: true,
            style: { stroke: srcColor, strokeWidth: 2.5, strokeDasharray: '6,4', opacity: 0.85 },
            markerEnd: { type: MarkerType.ArrowClosed, color: srcColor },
          });
        }
      }
    });
    return edges;
  }, [flow]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync positions on drag and persist to localStorage
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      changes.forEach((change) => {
        if (change.type === 'position' && change.position && change.id) {
          positionsRef.current[change.id] = change.position;
          if (flow?.id) {
            try {
              localStorage.setItem(`yq_flow_positions_${flow.id}`, JSON.stringify(positionsRef.current));
            } catch {
              // ignore
            }
          }
        }
      });
      onNodesChange(changes);
    },
    [onNodesChange, flow?.id]
  );

  // Reset to default vertical ladder alignment
  const handleAutoAlign = useCallback(() => {
    positionsRef.current = {};
    if (flow?.id) {
      try {
        localStorage.removeItem(`yq_flow_positions_${flow.id}`);
      } catch {
        // ignore
      }
    }
    const freshNodes = computeNodes(true);
    setNodes(freshNodes);
    setTimeout(() => {
      handleFitView();
    }, 60);
  }, [flow?.id, computeNodes, setNodes, handleFitView]);

  useEffect(() => {
    setNodes(initialNodes as any);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges as any);
  }, [initialEdges, setEdges]);

  // Smoothly center the canvas onto selected step card with matching camera glide
  useEffect(() => {
    if (!selectedStepId || !rfInstance) return;
    const targetNode = nodes.find((n: any) => n.id === selectedStepId);
    if (targetNode) {
      const x = targetNode.position.x + 130;
      const y = targetNode.position.y + 80;
      rfInstance.setCenter(x, y, { duration: 750, zoom: Math.min(1.05, Math.max(0.88, rfInstance.getZoom())) });
    }
  }, [selectedStepId, rfInstance, nodes]);

  const onConnect = useCallback((params: any) => {
    setEdges((eds) => {
      const newEdges = addEdge({
        ...params,
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
      }, eds);
      const outgoing = newEdges.filter(e => e.source === params.source);
      const transitions = outgoing.map((e, i) => ({
        toStepId: e.target,
        isDefault: i === 0,
        label: (e.label as string) || '',
      }));
      onSaveTransitions(params.source, transitions);
      return newEdges;
    });
  }, [setEdges, onSaveTransitions]);

  return (
    <div
      className="w-full h-full flow-builder-canvas relative overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <style>{`
        .flow-builder-canvas {
          --rf-bg: #f8fafc;
          --rf-dot-color: rgba(71, 85, 105, 0.22);
          --rf-major-dot-color: rgba(71, 85, 105, 0.40);
          background-color: var(--rf-bg);
          position: relative;
        }
        .dark .flow-builder-canvas {
          --rf-bg: #07080b;
          --rf-dot-color: rgba(255, 255, 255, 0.22);
          --rf-major-dot-color: rgba(255, 255, 255, 0.46);
          background-color: var(--rf-bg);
        }
        .flow-builder-canvas .react-flow__pane {
          background: transparent !important;
        }
        .flow-builder-canvas .canvas-vignette {
          background: radial-gradient(ellipse at center, transparent 40%, rgba(15, 23, 42, 0.08) 100%);
        }
        .dark .flow-builder-canvas .canvas-vignette {
          background: radial-gradient(ellipse at center, transparent 38%, rgba(0, 0, 0, 0.52) 100%);
        }
        @keyframes meshDrift {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.85;
          }
          50% {
            transform: translate(-30px, -20px) scale(1.08);
            opacity: 0.98;
          }
        }
        @keyframes meshDriftSecondary {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.35;
          }
          50% {
            transform: translate(25px, 20px) scale(1.06);
            opacity: 0.45;
          }
        }
        .ambient-mesh-glow {
          animation: meshDrift 18s ease-in-out infinite alternate;
        }
        .ambient-mesh-secondary {
          animation: meshDriftSecondary 22s ease-in-out infinite alternate;
        }
        .flow-builder-canvas:not(.dark) .ambient-mesh-glow {
          opacity: 0.35 !important;
        }
        .flow-builder-canvas:not(.dark) .ambient-mesh-secondary {
          opacity: 0.18 !important;
        }
        .flow-builder-canvas .react-flow__controls {
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          border: 1px solid #e4e4e7;
          border-radius: 14px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04);
          overflow: hidden;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
        }
        .dark .flow-builder-canvas .react-flow__controls {
          background: rgba(24, 24, 27, 0.9);
          border: 1px solid #3f3f46;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4);
        }
        .flow-builder-canvas .react-flow__controls:hover {
          box-shadow: 0 14px 30px -5px rgba(0,0,0,0.12);
        }
        .flow-builder-canvas .react-flow__controls-button {
          background: transparent;
          border: none;
          border-bottom: 1px solid #e4e4e7;
          color: #52525b;
          width: 34px;
          height: 34px;
          padding: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.18s ease, color 0.18s ease, transform 0.15s ease;
        }
        .flow-builder-canvas .react-flow__controls-button:last-child {
          border-bottom: none;
        }
        .dark .flow-builder-canvas .react-flow__controls-button {
          border-bottom: 1px solid #3f3f46;
          color: #a1a1aa;
          fill: #a1a1aa;
        }
        .dark .flow-builder-canvas .react-flow__controls-button:last-child {
          border-bottom: none;
        }
        .flow-builder-canvas .react-flow__controls-button:hover {
          background: #f4f4f5;
          color: #4f46e5;
          transform: scale(1.06);
        }
        .flow-builder-canvas .react-flow__controls-button:active {
          transform: scale(0.92);
        }
        .dark .flow-builder-canvas .react-flow__controls-button:hover {
          background: #27272a;
          color: #818cf8;
          fill: #818cf8;
        }
        .flow-builder-canvas .react-flow__controls-button svg {
          fill: currentColor;
          width: 14px;
          height: 14px;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .flow-builder-canvas .react-flow__controls-button:hover svg {
          transform: scale(1.1);
        }
        .flow-builder-canvas .react-flow__node {
          transition: box-shadow 300ms cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform, box-shadow;
        }
        .flow-builder-canvas .react-flow__edge-textbg {
          fill: #ffffff !important;
          stroke: #c7d2fe !important;
          stroke-width: 1.5px !important;
          rx: 8px !important;
          ry: 8px !important;
          filter: drop-shadow(0 2px 5px rgba(79, 70, 229, 0.12));
        }
        .dark .flow-builder-canvas .react-flow__edge-textbg {
          fill: #18181b !important;
          stroke: #4338ca !important;
          stroke-width: 1.5px !important;
          rx: 8px !important;
          ry: 8px !important;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
        }
        .flow-builder-canvas .react-flow__edge-text {
          fill: #4338ca !important;
          font-weight: 700 !important;
          font-size: 10px !important;
        }
        .dark .flow-builder-canvas .react-flow__edge-text {
          fill: #c7d2fe !important;
          font-weight: 700 !important;
          font-size: 10px !important;
        }
        .flow-builder-canvas .react-flow__handle {
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
        }
        .flow-builder-canvas .react-flow__handle:hover {
          transform: scale(1.28);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.35);
        }
        .flow-builder-canvas .react-flow__minimap {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(8px);
          border: 1px solid #e4e4e7;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 8px 20px -4px rgba(0,0,0,0.08);
        }
        .dark .flow-builder-canvas .react-flow__minimap {
          background: rgba(24, 24, 27, 0.9);
          border: 1px solid #3f3f46;
          box-shadow: 0 8px 20px -4px rgba(0,0,0,0.4);
        }
        .flow-builder-canvas .react-flow__minimap-svg {
          background: transparent !important;
        }
        .dark .flow-builder-canvas .react-flow__edge-path {
          stroke-opacity: 0.85;
        }
        .dark .flow-builder-canvas .react-flow__background {
          color: #3f3f46;
        }
      `}</style>

      {/* Layer 1: Ambient Corner Mesh Aurora */}
      <div
        className="ambient-mesh-glow pointer-events-none absolute -bottom-36 -right-36 w-[640px] h-[640px] rounded-full blur-[96px] z-0"
        style={{
          background:
            'radial-gradient(circle at 75% 75%, #38bdf8 0%, #06b6d4 18%, #8b5cf6 44%, #7c3aed 68%, #3b0764 88%, transparent 100%)',
        }}
      />

      {/* Layer 2: Ambient Top-Left Secondary Aurora */}
      <div
        className="ambient-mesh-secondary pointer-events-none absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full blur-[110px] z-0"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, #6366f1 0%, #a855f7 42%, #4f46e5 75%, transparent 100%)',
        }}
      />

      {/* Layer 3: Interactive Mouse Spotlight */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(550px circle at ${mousePos.x}px ${mousePos.y}px, rgba(139, 92, 246, 0.18), rgba(6, 182, 212, 0.08) 42%, transparent 75%)`,
        }}
      />

      {/* Layer 4: Edge Vignette for Scale Depth */}
      <div className="pointer-events-none absolute inset-0 z-0 canvas-vignette" />

      {/* Floating Scale & Depth HUD pill */}
      <div className="absolute bottom-4 left-16 z-10 flex items-center gap-2.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-zinc-200/80 dark:border-zinc-800 shadow-lg text-[11px] font-medium text-zinc-600 dark:text-zinc-300 transition-transform duration-200 hover:scale-[1.01]">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-zinc-900 dark:text-white">Canvas</span>
        </div>
        <span className="text-zinc-300 dark:text-zinc-700">|</span>
        <button
          type="button"
          onClick={handleAutoAlign}
          title="Auto-align cards into an optimal vertical flow"
          className="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
        >
          <LayoutTemplate className="w-3.5 h-3.5" /> Auto Align
        </button>
        <span className="text-zinc-300 dark:text-zinc-700">|</span>
        <span className="font-mono text-zinc-500 dark:text-zinc-400">24px Grid</span>
        <span className="text-zinc-300 dark:text-zinc-700">|</span>
        <button
          type="button"
          onClick={() => rfInstance?.zoomTo(1, { duration: 400 })}
          title="Click to reset zoom to 100%"
          className="font-mono font-bold text-primary dark:text-indigo-400 hover:underline cursor-pointer"
        >
          {zoomPercent}%
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setRfInstance}
        onMove={(_, viewport) => {
          setZoomPercent(Math.round(viewport.zoom * 100));
        }}
        onNodeClick={(_, node) => {
          if (node.data?.step && onEditStep) {
            onEditStep(node.data.step);
          }
        }}
        onEdgeClick={(_, edge) => { if (props.onEditEdge) props.onEditEdge(edge); }}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.22, maxZoom: 0.95, duration: 700 }}
        attributionPosition="bottom-right"
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        panOnScroll
        selectionOnDrag={false}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
      >
        <Background
          id="rf-dots-minor"
          color="var(--rf-dot-color)"
          gap={24}
          size={1.4}
          variant={BackgroundVariant.Dots}
        />
        <Background
          id="rf-dots-major"
          color="var(--rf-major-dot-color)"
          gap={120}
          size={2.4}
          variant={BackgroundVariant.Dots}
        />
        <Controls
          showInteractive={false}
          fitViewOptions={{ padding: 0.22, maxZoom: 0.95, duration: 700 }}
          onFitView={handleFitView}
        />
        <MiniMap
          nodeColor={(n: any) => TYPE_CONFIG[n.data?.type]?.color || '#6366f1'}
          maskColor="rgba(0,0,0,0.06)"
          style={{ borderRadius: 12 }}
        />
      </ReactFlow>
    </div>
  );
}
