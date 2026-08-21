import React, { useState } from 'react';
import { TabType } from '@/types/patient';
import { ActionItem, SEVERITY_STYLES } from './alerts';
import { getPatientName } from './jobs';

interface ActionRequiredPanelProps {
  items: ActionItem[];
  onResolve: (patientId: string, tab: TabType) => void;
}

/** Rows shown before the list is collapsed behind "Show all". */
const COLLAPSED_ROWS = 6;

/**
 * The "Action Required" tab body: missing or expired insurance, calls that
 * stalled, and verifications that will not beat the appointment.
 */
const ActionRequiredPanel: React.FC<ActionRequiredPanelProps> = ({ items, onResolve }) => {
  const [showAll, setShowAll] = useState(false);
  const visibleItems = showAll ? items : items.slice(0, COLLAPSED_ROWS);

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
          <span className="material-symbols-outlined text-2xl text-green-600 dark:text-green-400">task_alt</span>
        </div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Nothing needs attention</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Every verification today is running clean.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <th className="px-5 py-2 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Priority</th>
              <th className="px-5 py-2 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Patient</th>
              <th className="px-5 py-2 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Issue</th>
              <th className="px-5 py-2 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Detail</th>
              <th className="px-5 py-2 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Waiting</th>
              <th className="px-5 py-2 text-right text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {visibleItems.map(item => (
              <tr key={item.key} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                <td className="px-5 py-2.5">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${SEVERITY_STYLES[item.severity].chip}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_STYLES[item.severity].dot}`}></span>
                    {SEVERITY_STYLES[item.severity].label}
                  </span>
                </td>
                <td className="px-5 py-2.5 text-sm font-medium text-slate-900 dark:text-white whitespace-nowrap">
                  {getPatientName(item.patient)}
                </td>
                <td className="px-5 py-2.5 text-sm text-slate-900 dark:text-white whitespace-nowrap">{item.issue}</td>
                <td className="px-5 py-2.5 text-sm text-slate-600 dark:text-slate-400">{item.detail}</td>
                <td className="px-5 py-2.5 text-sm tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">{item.waiting}</td>
                <td className="px-5 py-2.5 text-right">
                  <button
                    onClick={() => onResolve(item.patient.id, item.tab)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors whitespace-nowrap"
                  >
                    {item.actionLabel}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length > COLLAPSED_ROWS && (
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing {visibleItems.length} of {items.length}, highest priority first
          </p>
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showAll ? 'Show less' : `Show all ${items.length}`}
          </button>
        </div>
      )}
    </div>
  );
};

export default ActionRequiredPanel;
