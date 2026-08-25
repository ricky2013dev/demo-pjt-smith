import React from 'react';
import DashboardCard from './DashboardCard';
import { JOB_STATUS_STYLES, PatientJob, getJobStatusKind, getPatientName, isSameDay } from './jobs';

interface DailySchedulePanelProps {
  jobs: PatientJob[];
  /** Day the list is showing. */
  date: Date;
  onShiftDay: (direction: 1 | -1) => void;
  onToday: () => void;
  /** Opens the patient's transaction history. */
  onJobClick: (job: PatientJob) => void;
}

/**
 * The day's schedule, one row per patient: when the verification runs, who it
 * is for, and where it stands. Rows open the patient's transaction history.
 */
const DailySchedulePanel: React.FC<DailySchedulePanelProps> = ({ jobs, date, onShiftDay, onToday, onJobClick }) => {
  // Ordered by when the verification job runs, not by the appointment it is for.
  const byTime = [...jobs].sort((a, b) =>
    a.jobDate.getTime() - b.jobDate.getTime() || a.startTime.localeCompare(b.startTime)
  );
  const isToday = isSameDay(date, new Date());

  return (
    <DashboardCard
      title={isToday ? "Today's Verification  Schedule" : 'Daily Verification  Schedule'}
      icon="today"
      subtitle={date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      headerAfterTitle={
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onShiftDay(-1)}
            title="Previous day"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          <button
            onClick={onToday}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isToday
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
          >
            Today
          </button>
          <button
            onClick={() => onShiftDay(1)}
            title="Next day"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
      }
    >
      {byTime.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-2xl text-slate-400">event_busy</span>
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Nothing scheduled</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No verifications run on this day.</p>
        </div>
      ) : (
        <ul className="space-y-2 max-h-[330px] overflow-y-auto pr-1">
          {byTime.map(job => {
            const status = JOB_STATUS_STYLES[getJobStatusKind(job)];

            return (
              <li key={job.id}>
                <button
                  onClick={() => onJobClick(job)}
                  title={`Open ${getPatientName(job.patient)}'s transaction history`}
                  className="w-full flex items-center gap-3 text-left rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors group"
                >
                  <span className="shrink-0 w-[92px]">
                    <span className="block text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{job.startTime}</span>
                    <span className="block text-[11px] tabular-nums text-slate-500 dark:text-slate-400">to {job.endTime}</span>
                  </span>

                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-slate-900 dark:text-white truncate">
                      {getPatientName(job.patient)}
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {job.appointmentDate
                        ? `Appt ${job.appointmentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${job.appointmentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`
                        : 'No appointment'}
                    </span>
                  </span>

                  <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
                    {status.text}
                  </span>

                  <span className="material-symbols-outlined shrink-0 text-lg text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                    chevron_right
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
};

export default DailySchedulePanel;
