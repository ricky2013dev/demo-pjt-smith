import React, { useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Patient, TabType, TAB_TYPES } from '@/types/patient';
import Header from '@/components/Header';
import SideNav from './SideNav';
import Breadcrumb from './Breadcrumb';
import patientsData from '@mockupdata/patients.json';
import DashboardCard from './dashboard/DashboardCard';
import DailySchedulePanel from './dashboard/DailySchedulePanel';
import ActionRequiredPanel from './dashboard/ActionRequiredPanel';
import JobActivityPanel from './dashboard/JobActivityPanel';
import { SEVERITY_ORDER, SEVERITY_STYLES, buildActionItems } from './dashboard/alerts';
import { COMPLETED_STEPS, DATA_READY_STEPS, PatientJob, generateJobsForDate } from './dashboard/jobs';

interface DailyJobDashboardProps {
  patients?: Patient[];
  onDetailClick?: (patientId: string) => void;
}

/** The queue splits on the clock: work still to run, and work already run. */
type QueueTab = 'next' | 'past';

/** How far ahead the Next Jobs tab looks, in days. */
const NEXT_QUEUE_DAYS = 7;

/** How far back the Past Jobs tab looks, in days. */
const PAST_QUEUE_DAYS = 7;

/** Row counts the queue can page by. */
const PAGE_SIZES = [20, 50, 100];

const DailyJobDashboard: React.FC<DailyJobDashboardProps> = ({ patients: patientsPropsOverride, onDetailClick }) => {
  const [, navigate] = useLocation();
  const patients = patientsPropsOverride || (patientsData as Patient[]);

  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [queueTab, setQueueTab] = useState<QueueTab>('next');
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [page, setPage] = useState(1);

  /** Action Required always reports on now, not on any browsed date. */
  const todaysJobs = useMemo(() => generateJobsForDate(new Date(), patients), [patients]);

  /** The schedule panel browses one day at a time. */
  const scheduleJobs = useMemo(() => generateJobsForDate(scheduleDate, patients), [scheduleDate, patients]);

  const actionItems = useMemo(() => buildActionItems(todaysJobs, new Date()), [todaysJobs]);

  /** Past Jobs mirrors Next Jobs: the same window, looking back instead. */
  const periodJobs: PatientJob[] = useMemo(() => {
    const jobs: PatientJob[] = [];

    for (let dayOffset = PAST_QUEUE_DAYS; dayOffset >= 0; dayOffset--) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      jobs.push(...generateJobsForDate(date, patients));
    }

    // Sort by latest time first
    return jobs.sort((a, b) => b.jobDate.getTime() - a.jobDate.getTime());
  }, [patients]);

  /**
   * Next Jobs looks forward from now across the whole upcoming window rather
   * than the browsed period, so the queue always shows what runs next. Their
   * patient data is ready and nothing else has run yet.
   */
  const nextJobs = useMemo(() => {
    const now = Date.now();
    const jobs: PatientJob[] = [];

    for (let dayOffset = 0; dayOffset <= NEXT_QUEUE_DAYS; dayOffset++) {
      const date = new Date();
      date.setDate(date.getDate() + dayOffset);
      generateJobsForDate(date, patients).forEach(job => {
        if (job.jobDate.getTime() > now) jobs.push({ ...job, steps: DATA_READY_STEPS });
      });
    }

    return jobs.sort((a, b) => a.jobDate.getTime() - b.jobDate.getTime());
  }, [patients]);

  /** Past Jobs is history: everything in the window that has already run. */
  const pastJobs = useMemo(
    () => periodJobs
      .filter(job => job.jobDate.getTime() < Date.now())
      .map(job => ({ ...job, steps: COMPLETED_STEPS })),
    [periodJobs]
  );

  const visibleJobs = queueTab === 'next' ? nextJobs : pastJobs;

  // The queue shows one page at a time; clamping keeps the page valid when the
  // list shrinks under it (a different tab, a larger page size).
  const totalPages = Math.max(1, Math.ceil(visibleJobs.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pagedJobs = visibleJobs.slice(pageStart, pageStart + pageSize);

  const shiftScheduleDay = (direction: 1 | -1) => {
    const newDate = new Date(scheduleDate);
    newDate.setDate(newDate.getDate() + direction);
    setScheduleDate(newDate);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      navigate('/');
    }
  };

  const openPatient = (patientId: string, tab: TabType) => {
    if (onDetailClick) {
      onDetailClick(patientId);
    } else {
      navigate(`/b2b-agent/patient-detail?patientId=${patientId}&tab=${tab}`);
    }
  };

  // The dashboard is transaction-oriented, so open that tab rather than Basic Info
  const handleGoToDetail = (job: PatientJob) => openPatient(job.patient.id, TAB_TYPES.AI_CALL_HISTORY);

  const toggleJobExpansion = (jobId: string) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId);
  };

  const queueTabs: { id: QueueTab; label: string; icon: string; count: number }[] = [
    { id: 'next', label: 'Next Jobs', icon: 'pending_actions', count: nextJobs.length },
    { id: 'past', label: 'Past Jobs', icon: 'history', count: pastJobs.length }
  ];

  const severityCounts = SEVERITY_ORDER
    .map(severity => ({ severity, count: actionItems.filter(item => item.severity === severity).length }))
    .filter(entry => entry.count > 0);

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      {/* Header */}
      <Header
        onLogoClick={() => navigate('/b2b-agent/dashboard')}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        <SideNav />

        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="w-full p-4 space-y-4">

            {/* Title */}
            <div>
              <Breadcrumb className="mb-2" />
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Command Center</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Today's AI insurance verification at a glance</p>
            </div>

            {/* Row 1: Daily schedule + Action Required */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <DailySchedulePanel
                jobs={scheduleJobs}
                date={scheduleDate}
                onShiftDay={shiftScheduleDay}
                onToday={() => setScheduleDate(new Date())}
                onJobClick={handleGoToDetail}
              />

              <DashboardCard
                title="Action Required"
                icon="notification_important"
                subtitle="Jobs the AI cannot finish on its own"
                headerRight={
                  <div className="flex items-center gap-2 shrink-0">
                    {severityCounts.map(entry => (
                      <span
                        key={entry.severity}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${SEVERITY_STYLES[entry.severity].chip}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_STYLES[entry.severity].dot}`}></span>
                        {entry.count} {SEVERITY_STYLES[entry.severity].label}
                      </span>
                    ))}
                  </div>
                }
              >
                <ActionRequiredPanel items={actionItems} onResolve={openPatient} />
              </DashboardCard>
            </div>

            {/* Row 2: Verification Queue */}
            <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-200 dark:border-slate-700">
                <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-xl">list_alt</span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Verification Queue</h2>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-2 border-b border-slate-200 dark:border-slate-700">
                {/* Tabs */}
                <div className="flex items-end gap-1" role="tablist">
                  {queueTabs.map(tab => {
                    const isActive = queueTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => { setQueueTab(tab.id); setPage(1); }}
                        className={`flex items-center gap-2 px-4 py-3 -mb-px border-b-2 text-sm font-semibold transition-colors ${isActive
                          ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                      >
                        <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                        {tab.label}
                        <span className={`inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 rounded-full text-[11px] font-bold ${isActive
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-4 pb-2">

                  {/* Rows per page + page navigation */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500 dark:text-slate-400">Rows</label>
                    <select
                      value={pageSize}
                      onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                      className="px-2 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      {PAGE_SIZES.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>

                    <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400 px-1">
                      {visibleJobs.length === 0
                        ? '0 of 0'
                        : `${pageStart + 1}-${Math.min(pageStart + pageSize, visibleJobs.length)} of ${visibleJobs.length}`}
                    </span>

                    <button
                      onClick={() => setPage(currentPage - 1)}
                      disabled={currentPage <= 1}
                      title="Previous page"
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      <span className="material-symbols-outlined text-lg">chevron_left</span>
                    </button>
                    <button
                      onClick={() => setPage(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      title="Next page"
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>

              <p className="px-5 py-2 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                {queueTab === 'next'
                  ? `Next ${NEXT_QUEUE_DAYS} days · ${visibleJobs.length} scheduled, patient data ready`
                  : `Past ${PAST_QUEUE_DAYS} days · ${visibleJobs.length} verified`}
              </p>

              <JobActivityPanel
                jobs={pagedJobs}
                expandedJobId={expandedJobId}
                onToggleExpand={toggleJobExpansion}
                onGoToDetail={handleGoToDetail}
                statusKind={queueTab === 'next' ? 'data_ready' : 'completed'}
                emptyMessage={queueTab === 'next'
                  ? 'No verifications are waiting to run in this period.'
                  : 'No verifications have run in this period yet.'}
              />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DailyJobDashboard;
