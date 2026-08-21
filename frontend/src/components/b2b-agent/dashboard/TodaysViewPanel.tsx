import React from 'react';
import DashboardCard from './DashboardCard';
import { PatientJob, getJobStatusKind, getPatientName } from './jobs';

interface TodaysViewPanelProps {
  jobs: PatientJob[];
  onJobClick: (job: PatientJob) => void;
}

/** The day's shift is drawn between these hours on the timeline strip. */
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;

const STATUS_DOT: Record<string, string> = {
  completed: 'bg-green-500',
  in_progress: 'bg-blue-500',
  pending: 'bg-slate-300 dark:bg-slate-600'
};

/**
 * "Today's View" - what the clinic is running right now: how far the day has
 * got, and which job is up next.
 */
const TodaysViewPanel: React.FC<TodaysViewPanelProps> = ({ jobs, onJobClick }) => {
  const total = jobs.length;
  const completed = jobs.filter(job => getJobStatusKind(job) === 'completed').length;
  const inProgress = jobs.filter(job => getJobStatusKind(job) === 'in_progress').length;
  const notStarted = total - completed - inProgress;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const byTime = [...jobs].sort((a, b) => a.jobDate.getTime() - b.jobDate.getTime());
  const nextJob = byTime.find(job => getJobStatusKind(job) !== 'completed');

  const circumference = 2 * Math.PI * 34;

  const metrics = [
    { label: 'Scheduled today', value: total, color: 'text-slate-900 dark:text-white', dot: 'bg-slate-400' },
    { label: 'Verification complete', value: completed, color: 'text-green-600 dark:text-green-400', dot: 'bg-green-500' },
    { label: 'In progress', value: inProgress, color: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
    { label: 'Not started', value: notStarted, color: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-300 dark:bg-slate-600' }
  ];

  const timelinePosition = (job: PatientJob) => {
    const minutes = job.jobDate.getHours() * 60 + job.jobDate.getMinutes();
    const span = (DAY_END_HOUR - DAY_START_HOUR) * 60;
    const offset = ((minutes - DAY_START_HOUR * 60) / span) * 100;
    return Math.min(100, Math.max(0, offset));
  };

  return (
    <DashboardCard
      title="Today's View"
      icon="today"
      subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      headerRight={
        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          Live
        </span>
      }
    >
      <div className="flex items-center gap-6">
        {/* Completion ring */}
        <div className="relative shrink-0">
          <svg width="88" height="88" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="8" />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="#22c55e"
              strokeWidth="8"
              strokeDasharray={`${(completionRate / 100) * circumference} ${circumference}`}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-slate-900 dark:text-white">{completionRate}%</span>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">done</span>
          </div>
        </div>

        {/* Metric rows */}
        <ul className="flex-1 min-w-0 space-y-1.5">
          {metrics.map(metric => (
            <li key={metric.label} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 truncate">
                <span className={`w-2 h-2 rounded-full shrink-0 ${metric.dot}`}></span>
                {metric.label}
              </span>
              <span className={`text-lg font-bold tabular-nums ${metric.color}`}>{metric.value}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Day timeline */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-[10px] font-medium text-slate-400 dark:text-slate-500 mb-1.5">
          <span>{DAY_START_HOUR}:00</span>
          <span>Job schedule</span>
          <span>{DAY_END_HOUR}:00</span>
        </div>
        <div className="relative h-6 rounded-full bg-slate-100 dark:bg-slate-900/60">
          {byTime.map(job => (
            <button
              key={job.id}
              onClick={() => onJobClick(job)}
              title={`${job.startTime} - ${getPatientName(job.patient)}`}
              style={{ left: `calc(${timelinePosition(job)}% - 5px)` }}
              className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-800 transition-transform hover:scale-150 ${STATUS_DOT[getJobStatusKind(job)]}`}
            />
          ))}
        </div>
      </div>

      {/* Next up */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
        {nextJob ? (
          <button
            onClick={() => onJobClick(nextJob)}
            className="w-full flex items-center gap-3 text-left group"
          >
            <span className="shrink-0 w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-lg">schedule</span>
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Next up</span>
              <span className="block text-sm font-semibold text-slate-900 dark:text-white truncate">
                {nextJob.startTime} · {getPatientName(nextJob.patient)}
              </span>
            </span>
            <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">chevron_right</span>
          </button>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {total > 0 ? 'All of today’s verifications are complete.' : 'No jobs scheduled for today.'}
          </p>
        )}
      </div>
    </DashboardCard>
  );
};

export default TodaysViewPanel;
