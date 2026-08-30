import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, CheckCircle2, UserCheck, ArrowRight, Zap, FileText, Wrench, Award, Play } from 'lucide-react';

interface RoleWelcomeBannerProps {
  isOptimizing?: boolean;
  onQuickAction?: (actionId: string) => void;
}

export const RoleWelcomeBanner: React.FC<RoleWelcomeBannerProps> = ({
  isOptimizing = false,
  onQuickAction,
}) => {
  const { user } = useAuth();

  const getRoleDetails = () => {
    switch (user?.role) {
      case 'STATION_MASTER':
        return {
          title: 'Station Master (NDLS / Central Junction)',
          badge: 'STATION OPERATIONS',
          iconBg: 'bg-emerald-50 text-emerald-600',
          icon: FileText,
          description:
            'Your primary duty: Issue Station Master Safety Codes (Private Numbers) via Form T/351 to set signals to Red and grant physical track access to repair crews.',
          actionLabel: 'Open Safety Notice (Form T/351)',
          actionId: 'statutory',
        };
      case 'DEPARTMENT_ENGINEER':
        return {
          title: 'Track Engineer (Permanent Way Supervisor)',
          badge: 'FIELD ENGINEERING',
          iconBg: 'bg-blue-50 text-blue-600',
          icon: Wrench,
          description:
            'Your primary duty: Report ultrasonic rail crack flaws, verify track smoothness readings, and sign pre-approval safety consents before work starts.',
          actionLabel: '+ Report Track Defect',
          actionId: 'log_defect',
        };
      case 'DIVISIONAL_AUTHORITY':
        return {
          title: 'Divisional Operations Manager (Sr. DOM)',
          badge: 'EXECUTIVE OVERSIGHT',
          iconBg: 'bg-purple-50 text-purple-600',
          icon: Award,
          description:
            'Your primary duty: Audit corridor track availability (+4.2% gain), review the 55% downtime reduction, and sanction major multi-hour track closures.',
          actionLabel: 'Open Schedule Optimizer',
          actionId: 'audit',
        };
      default:
        return {
          title: 'Section Controller (Control Office Operations)',
          badge: 'NETWORK CONTROLLER',
          iconBg: 'bg-blue-50 text-blue-600',
          icon: Shield,
          description:
            'Your primary duty: Run the schedule optimizer to bundle Track, Signal & Electrical repairs into natural train gaps and ensure zero passenger train delays.',
          actionLabel: isOptimizing ? 'Optimizing Schedule...' : '▶ Run Schedule Optimizer',
          actionId: 'solve',
        };
    }
  };

  const details = getRoleDetails();
  const IconComponent = details.icon;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs select-none flex flex-wrap items-center justify-between gap-4 font-sans animate-in fade-in duration-150">
      <div className="flex items-center space-x-3.5 max-w-3xl">
        <div className={`w-10 h-10 rounded-2xl ${details.iconBg} flex items-center justify-center font-bold shrink-0`}>
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold tracking-wide text-slate-900">
              {details.title}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">
              {details.badge}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {details.description}
          </p>
        </div>
      </div>

      {onQuickAction && (
        <button
          onClick={() => onQuickAction(details.actionId)}
          disabled={isOptimizing}
          className={`px-4 py-2 rounded-xl text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shadow-xs transition-all cursor-pointer shrink-0 ${
            isOptimizing
              ? 'bg-blue-400 cursor-wait'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isOptimizing ? (
            <Play className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5 text-amber-300" />
          )}
          <span>{details.actionLabel}</span>
        </button>
      )}
    </div>
  );
};
export default RoleWelcomeBanner;
