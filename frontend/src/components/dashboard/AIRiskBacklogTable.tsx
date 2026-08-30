import React, { useState } from 'react';
import { Activity, ArrowUpDown, Wrench, Radio, Zap, Eye, ClipboardList } from 'lucide-react';
import { MaintenanceRequest } from '../../types/block';

interface AIRiskBacklogTableProps {
  requests?: MaintenanceRequest[];
  onInspectDefect?: (req: any) => void;
}

export const AIRiskBacklogTable: React.FC<AIRiskBacklogTableProps> = ({
  requests = [],
  onInspectDefect,
}) => {
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [sortByCi, setSortByCi] = useState<boolean>(true);

  // Normalize incoming requests or fallback to initial calibrated seed
  const baseItems = requests.length > 0 ? requests.map((r: any) => {
    const meta = r.metadata_json || {};
    const chainage = meta.chainage_km || 14.2;
    const ci = meta.criticality_index || (r.priority === 'CRITICAL' ? 88 : r.priority === 'HIGH' ? 72 : 54);
    const overdue = meta.days_overdue !== undefined ? `${meta.days_overdue} days` : '4 days';
    const failProb = `${Math.min(92, Math.round(ci * 0.62 + 5))}%`;

    return {
      rawRequest: r,
      requestCode: r.request_code || `REQ-${r.id?.slice(0, 6)}`,
      dept: r.department,
      activity: r.activity_type,
      location: `KM ${chainage.toFixed(1)} - ${(chainage + 1.2).toFixed(1)}`,
      overdueDays: overdue,
      failProb: failProb,
      ci: ci,
      priority: r.priority || 'HIGH',
    };
  }) : [
    {
      rawRequest: { request_code: 'TMS-E8F0F8', department: 'TRACK', activity_type: 'Ultrasonic Rail Crack Flaw Replacement', priority: 'CRITICAL', metadata_json: { chainage_km: 14.2, criticality_index: 88, usfd_classification: 'IMR' } },
      requestCode: 'TMS-E8F0F8',
      dept: 'TRACK',
      activity: 'Ultrasonic Rail Crack Flaw Replacement',
      location: 'KM 14.2 - 15.4',
      overdueDays: '8 days',
      failProb: '58.4%',
      ci: 88,
      priority: 'CRITICAL',
    },
    {
      rawRequest: { request_code: 'S&T-8D0D21', department: 'SIGNAL', activity_type: 'Track Switcher Point Machine Overhaul', priority: 'HIGH', metadata_json: { chainage_km: 13.8, criticality_index: 82, usfd_classification: 'GOOD' } },
      requestCode: 'S&T-8D0D21',
      dept: 'SIGNAL',
      activity: 'Track Switcher Point Machine Overhaul',
      location: 'KM 13.8 - 14.5',
      overdueDays: '5 days',
      failProb: '51.2%',
      ci: 82,
      priority: 'HIGH',
    },
    {
      rawRequest: { request_code: 'TRD-673A8C', department: 'TRACTION', activity_type: '25 kV Overhead Wire Adjustment', priority: 'HIGH', metadata_json: { chainage_km: 16.0, criticality_index: 85, usfd_classification: 'GOOD' } },
      requestCode: 'TRD-673A8C',
      dept: 'TRACTION',
      activity: '25 kV Overhead Wire Adjustment',
      location: 'KM 16.0 - 17.2',
      overdueDays: '3 days',
      failProb: '48.9%',
      ci: 85,
      priority: 'HIGH',
    },
    {
      rawRequest: { request_code: 'TMS-4C3D01', department: 'TRACK', activity_type: 'Track Machine Ballast Tamping', priority: 'HIGH', metadata_json: { chainage_km: 24.5, criticality_index: 76, usfd_classification: 'GOOD' } },
      requestCode: 'TMS-4C3D01',
      dept: 'TRACK',
      activity: 'Track Machine Ballast Tamping',
      location: 'KM 24.5 - 26.0',
      overdueDays: '2 days',
      failProb: '42.1%',
      ci: 76,
      priority: 'HIGH',
    },
  ];

  // Filtering
  const filteredItems = selectedDeptFilter === 'ALL'
    ? baseItems
    : baseItems.filter((i) => i.dept === selectedDeptFilter);

  // Sorting
  const sortedItems = [...filteredItems].sort((a, b) => {
    return sortByCi ? b.ci - a.ci : a.ci - b.ci;
  });

  const getDeptBadge = (dept: string) => {
    switch (dept) {
      case 'TRACK':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center space-x-1">
            <Wrench className="w-2.5 h-2.5" />
            <span>Track (Rails)</span>
          </span>
        );
      case 'SIGNAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center space-x-1">
            <Radio className="w-2.5 h-2.5" />
            <span>Signals (Switches)</span>
          </span>
        );
      case 'TRACTION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200 inline-flex items-center space-x-1">
            <Zap className="w-2.5 h-2.5" />
            <span>Electrical (Wires)</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
            {dept}
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded font-mono font-bold text-[9px] bg-rose-50 text-rose-700 border border-rose-200">
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded font-mono font-bold text-[9px] bg-amber-50 text-amber-700 border border-amber-200">
            HIGH
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded font-mono font-bold text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200">
            MEDIUM
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs select-none font-sans">
      {/* Header Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 font-bold text-slate-900 tracking-wide">
          <ClipboardList className="w-4 h-4 text-blue-700" />
          <span>Asset Health &amp; Defect Safety Register (Hazard Scoring)</span>
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex items-center space-x-2">
          {/* Department Filter Pills */}
          <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg p-0.5 text-[10px] font-mono font-bold">
            {['ALL', 'TRACK', 'SIGNAL', 'TRACTION'].map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDeptFilter(dept)}
                className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                  selectedDeptFilter === dept ? 'bg-blue-700 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {dept === 'ALL' ? 'All Depts' : dept === 'TRACK' ? 'Track' : dept === 'SIGNAL' ? 'Signals' : 'Electrical'}
              </button>
            ))}
          </div>

          {/* Sort Toggle Button */}
          <button
            onClick={() => setSortByCi(!sortByCi)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold text-slate-700 cursor-pointer"
            title="Sort by Urgency Score"
          >
            <ArrowUpDown className="w-3 h-3 text-blue-700" />
            <span>Urgency {sortByCi ? '↓' : '↑'}</span>
          </button>
        </div>
      </div>

      {/* High-Contrast Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
            <tr>
              <th className="p-3">Defect ID</th>
              <th className="p-3">Department</th>
              <th className="p-3">Required Repair Work</th>
              <th className="p-3">Location</th>
              <th className="p-3">Overdue</th>
              <th className="p-3">Urgency (0-100)</th>
              <th className="p-3">Breakdown Risk</th>
              <th className="p-3">Priority</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {sortedItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 font-mono font-bold text-slate-900">
                  {item.requestCode}
                </td>
                <td className="p-3">
                  {getDeptBadge(item.dept)}
                </td>
                <td className="p-3 font-bold text-slate-900">
                  {item.activity}
                </td>
                <td className="p-3 font-mono text-slate-600">
                  {item.location}
                </td>
                <td className="p-3 font-mono font-bold text-amber-700">
                  {item.overdueDays}
                </td>
                <td className="p-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-rose-600 text-xs">{item.ci}</span>
                    <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-600 rounded-full"
                        style={{ width: `${item.ci}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="p-3 font-mono font-bold text-slate-900">
                  {item.failProb}
                </td>
                <td className="p-3">
                  {getPriorityBadge(item.priority)}
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => {
                      if (onInspectDefect) onInspectDefect(item.rawRequest);
                    }}
                    className="px-2.5 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white font-semibold text-[10px] inline-flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Inspect Factors</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AIRiskBacklogTable;
