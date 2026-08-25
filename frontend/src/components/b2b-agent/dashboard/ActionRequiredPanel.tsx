import React from 'react';
import { TabType } from '@/types/patient';
import { ActionItem, SEVERITY_STYLES } from './alerts';
import { getPatientName } from './jobs';

interface ActionRequiredPanelProps {
  items: ActionItem[];
  onResolve: (patientId: string, tab: TabType) => void;
}

/**
 * The "Action Required" panel body: missing or expired insurance, calls that
 * stalled, and verifications that will not beat the appointment. It sits in a
 * half-width command center card, so the list stays compact and scrolls.
 */
const ActionRequiredPanel: React.FC<ActionRequiredPanelProps> = ({ items, onResolve }) => {
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
    <ul className="space-y-2 max-h-[330px] overflow-y-auto pr-1">
      {items.map(item => {
        const severity = SEVERITY_STYLES[item.severity];

        return (
          <li key={item.key}>
            <button
              onClick={() => onResolve(item.patient.id, item.tab)}
              title={item.actionLabel}
              className="w-full text-left rounded-lg border border-slate-200 dark:border-slate-700 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className={`shrink-0 mt-0.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${severity.chip}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${severity.dot}`}></span>
                  {severity.label}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {getPatientName(item.patient)}
                    </p>
                    <span className="shrink-0 text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                      {item.waiting}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{item.issue}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.detail}</p>
                </div>

                <span className="material-symbols-outlined shrink-0 self-center text-lg text-slate-400 dark:text-slate-500">
                  arrow_forward
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default ActionRequiredPanel;
