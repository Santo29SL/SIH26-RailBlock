import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  delta?: string;
  deltaPositive?: boolean;
  icon: LucideIcon;
  colorScheme: 'sky' | 'emerald' | 'amber' | 'rose' | 'purple';
  subtext?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit,
  delta,
  deltaPositive = true,
  icon: Icon,
  colorScheme,
  subtext,
}) => {
  const colorMap = {
    sky: {
      border: 'border-slate-200 hover:border-blue-300',
      bg: 'bg-blue-50',
      iconText: 'text-blue-600',
      valueText: 'text-slate-900',
      badge: 'bg-blue-100 text-blue-800',
    },
    emerald: {
      border: 'border-slate-200 hover:border-emerald-300',
      bg: 'bg-emerald-50',
      iconText: 'text-emerald-600',
      valueText: 'text-slate-900',
      badge: 'bg-emerald-100 text-emerald-800',
    },
    amber: {
      border: 'border-slate-200 hover:border-amber-300',
      bg: 'bg-amber-50',
      iconText: 'text-amber-600',
      valueText: 'text-slate-900',
      badge: 'bg-amber-100 text-amber-800',
    },
    rose: {
      border: 'border-slate-200 hover:border-rose-300',
      bg: 'bg-rose-50',
      iconText: 'text-rose-600',
      valueText: 'text-rose-600',
      badge: 'bg-rose-100 text-rose-800',
    },
    purple: {
      border: 'border-slate-200 hover:border-purple-300',
      bg: 'bg-purple-50',
      iconText: 'text-purple-600',
      valueText: 'text-slate-900',
      badge: 'bg-purple-100 text-purple-800',
    },
  };

  const scheme = colorMap[colorScheme];

  return (
    <div
      className={`p-5 rounded-2xl bg-white border transition-all duration-200 hover:shadow-md ${scheme.border} relative overflow-hidden group`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-xl ${scheme.bg} ${scheme.iconText}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline space-x-1.5 mt-1">
        <span className={`text-2xl md:text-3xl font-black tracking-tight ${scheme.valueText}`}>{value}</span>
        {unit && <span className="text-xs font-bold text-slate-500">{unit}</span>}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
        {delta && (
          <span
            className={`font-semibold flex items-center space-x-1 ${
              deltaPositive ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            <span>{delta}</span>
          </span>
        )}
        {subtext && <span className="text-slate-400 text-[10px] ml-auto truncate">{subtext}</span>}
      </div>
    </div>
  );
};
