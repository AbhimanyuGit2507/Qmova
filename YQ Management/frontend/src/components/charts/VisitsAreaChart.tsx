import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  TooltipProps,
} from 'recharts';

interface ChartPoint {
  time: string;
  visits: number;
  actualVisits?: number;
  scheduled?: number;
}

interface VisitsAreaChartProps {
  data: ChartPoint[];
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  hasScheduled?: boolean;
}

function CustomTooltip({ active, payload, label, hasScheduled }: any) {
  if (active && payload && payload.length) {
    const actual =
      payload.find((p: any) => p.dataKey === 'visits' || p.dataKey === 'actualVisits')
        ?.value ?? 0;
    const scheduled =
      payload.find((p: any) => p.dataKey === 'scheduled')?.value ?? 0;

    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 shadow-xl text-xs space-y-1.5 min-w-[150px]">
        <p className="text-zinc-400 font-semibold border-b border-zinc-800 pb-1">{label}</p>
        <div className="flex items-center justify-between gap-3 text-white">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#1571ff]" />
            <span>Actual Visits:</span>
          </span>
          <span className="font-mono font-bold text-sm">{actual}</span>
        </div>
        {hasScheduled && (
          <div className="flex items-center justify-between gap-3 text-purple-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
              <span>Scheduled:</span>
            </span>
            <span className="font-mono font-bold text-sm">{scheduled}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
}

export function VisitsAreaChart({ data }: VisitsAreaChartProps) {
  const hasScheduled = (data || []).some((d) => (d.scheduled ?? 0) > 0);

  return (
    <div className="w-full h-full flex flex-col">
      {hasScheduled && (
        <div className="flex items-center justify-end gap-4 mb-2 text-xs">
          <div className="flex items-center gap-1.5 text-on-surface dark:text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1571ff]" />
            <span className="font-medium">Actual Visits (Arrived / Served)</span>
          </div>
          <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-[#8b5cf6]" />
            <span className="font-medium">Scheduled Bookings</span>
          </div>
        </div>
      )}
      <div className="flex-1 min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1571ff" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#1571ff" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorScheduled" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" opacity={0.3} />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#707881' }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#707881' }} allowDecimals={false} />
            <Tooltip
              content={(props) => <CustomTooltip {...props} hasScheduled={hasScheduled} />}
              isAnimationActive={false}
              cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="visits"
              name="Actual Visits"
              stroke="#1571ff"
              strokeWidth={2.5}
              fill="url(#colorVisits)"
            />
            {hasScheduled && (
              <Area
                type="monotone"
                dataKey="scheduled"
                name="Scheduled Bookings"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="4 4"
                fill="url(#colorScheduled)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
