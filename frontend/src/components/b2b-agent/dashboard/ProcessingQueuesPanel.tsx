import React from 'react';
import DashboardCard from './DashboardCard';
import { JOB_STEPS, JobStep, PatientJob, getPatientName, getStepStatus } from './jobs';

interface ProcessingQueuesPanelProps {
  jobs: PatientJob[];
  /** Queue currently used to filter the job activity table, if any. */
  activeQueueId: string | null;
  onQueueSelect: (queueId: string | null) => void;
}

interface QueueRow {
  step: JobStep;
  total: number;
  completed: number;
  running: number;
  waiting: number;
  /** Earliest scheduled job still sitting in this queue. */
  oldest: PatientJob | null;
}

/**
 * "Processing Queues" - the workflow stages, with what is moving through each
 * one. Selecting a queue filters the job activity table below.
 */
const ProcessingQueuesPanel: React.FC<ProcessingQueuesPanelProps> = ({ jobs, activeQueueId, onQueueSelect }) => {
  const rows: QueueRow[] = JOB_STEPS.map(step => {
    const statuses = jobs.map(job => ({ job, status: getStepStatus(job, step) }));
    const open = statuses
      .filter(entry => entry.status !== 'completed')
      .sort((a, b) => a.job.jobDate.getTime() - b.job.jobDate.getTime());

    return {
      step,
      total: jobs.length,
      completed: statuses.filter(entry => entry.status === 'completed').length,
      running: statuses.filter(entry => entry.status === 'in_progress').length,
      waiting: statuses.filter(entry => entry.status === 'pending').length,
      oldest: open[0]?.job ?? null
    };
  });

  const totalOpen = rows.reduce((sum, row) => sum + row.running + row.waiting, 0);

  return (
    <DashboardCard
      title="Processing Queues"
      icon="conveyor_belt"
      subtitle="Verification workflow stages"
      headerRight={
        <span className="shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {totalOpen} open
        </span>
      }
    >
      <ul className="space-y-2">
        {rows.map((row, index) => {
          const isActive = activeQueueId === row.step.id;
          const completedPct = row.total > 0 ? (row.completed / row.total) * 100 : 0;
          const runningPct = row.total > 0 ? (row.running / row.total) * 100 : 0;

          return (
            <li key={row.step.id}>
              <button
                onClick={() => onQueueSelect(isActive ? null : row.step.id)}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${isActive
                  ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-700/50'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/40'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900/60 flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-600 dark:text-slate-300 text-lg">{row.step.icon}</span>
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        <span className="text-slate-400 dark:text-slate-500 font-normal mr-1.5">{index + 1}.</span>
                        {row.step.shortLabel}
                      </p>
                      <p className="text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-300 shrink-0">
                        {row.completed}<span className="text-slate-400 dark:text-slate-500">/{row.total}</span>
                      </p>
                    </div>

                    {/* Stacked completed / running bar */}
                    <div className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className="bg-green-500 transition-all duration-500" style={{ width: `${completedPct}%` }}></div>
                      <div className="bg-blue-500 transition-all duration-500" style={{ width: `${runningPct}%` }}></div>
                    </div>

                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        {row.running} running
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                        {row.waiting} waiting
                      </span>
                      {row.oldest && (
                        <span className="truncate">
                          oldest {row.oldest.startTime} · {getPatientName(row.oldest.patient)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {activeQueueId && (
        <button
          onClick={() => onQueueSelect(null)}
          className="mt-3 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          Clear queue filter
        </button>
      )}
    </DashboardCard>
  );
};

export default ProcessingQueuesPanel;
