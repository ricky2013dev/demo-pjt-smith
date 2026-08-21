import React, { useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Patient, TabType, TAB_TYPES } from '@/types/patient';
import Header from '@/components/Header';
import SideNav from './SideNav';
import Breadcrumb from './Breadcrumb';
import patientsData from '@mockupdata/patients.json';
import TodaysViewPanel from './dashboard/TodaysViewPanel';
import ProcessingQueuesPanel from './dashboard/ProcessingQueuesPanel';
import ActionRequiredPanel from './dashboard/ActionRequiredPanel';
import JobActivityPanel from './dashboard/JobActivityPanel';
import { SEVERITY_ORDER, SEVERITY_STYLES, buildActionItems } from './dashboard/alerts';
import { JOB_STEPS, PatientJob, generateJobsForDate, getJobStatusKind, getStepStatus } from './dashboard/jobs';

interface DailyJobDashboardProps {
  patients?: Patient[];
  onDetailClick?: (patientId: string) => void;
}

type ViewMode = 'day' | 'week' | 'month';

/** The two work lists share one panel, one at a time. */
type WorkTab = 'actions' | 'activity';

/** A job sits in a queue until that stage completes - the same rule the queue counts use. */
const isInQueue = (job: PatientJob, queueId: string): boolean => {
  const step = JOB_STEPS.find(candidate => candidate.id === queueId);
  return step ? getStepStatus(job, step) !== 'completed' : true;
};

const DailyJobDashboard: React.FC<DailyJobDashboardProps> = ({ patients: patientsPropsOverride, onDetailClick }) => {
  const [, navigate] = useLocation();
  const patients = patientsPropsOverride || (patientsData as Patient[]);

  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [queueFilter, setQueueFilter] = useState<string | null>(null);
  const [workTab, setWorkTab] = useState<WorkTab>('actions');

  /** The command center panels always report on now, not on the browsed date. */
  const todaysJobs = useMemo(() => generateJobsForDate(new Date(), patients), [patients]);

  const actionItems = useMemo(() => buildActionItems(todaysJobs, new Date()), [todaysJobs]);

  // Jobs for the period the activity table is browsing.
  const periodJobs: PatientJob[] = useMemo(() => {
    const jobs: PatientJob[] = [];

    if (viewMode === 'day') {
      jobs.push(...generateJobsForDate(selectedDate, patients));
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        jobs.push(...generateJobsForDate(date, patients));
      }
    } else if (viewMode === 'month') {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        jobs.push(...generateJobsForDate(new Date(year, month, day), patients));
      }
    }

    // Sort by latest time first
    return jobs.sort((a, b) => b.jobDate.getTime() - a.jobDate.getTime());
  }, [selectedDate, viewMode, patients]);

  const filteredJobs = useMemo(
    () => (queueFilter ? periodJobs.filter(job => isInQueue(job, queueFilter)) : periodJobs),
    [periodJobs, queueFilter]
  );

  const stats = useMemo(() => {
    let completedJobs = 0;
    let inProgressJobs = 0;

    filteredJobs.forEach(job => {
      const kind = getJobStatusKind(job);
      if (kind === 'completed') completedJobs++;
      else if (kind === 'in_progress') inProgressJobs++;
    });

    const totalJobs = filteredJobs.length;
    return { totalJobs, completedJobs, inProgressJobs, pendingJobs: totalJobs - completedJobs - inProgressJobs };
  }, [filteredJobs]);

  // Get display date range
  const getDateRange = () => {
    if (viewMode === 'day') {
      return selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
  };

  const shiftPeriod = (direction: 1 | -1) => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setSelectedDate(newDate);
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

  /** Jump the activity tab to a job picked from a command center panel. */
  const handleFocusJob = (job: PatientJob) => {
    setViewMode('day');
    setSelectedDate(job.jobDate);
    setQueueFilter(null);
    setExpandedJobId(job.id);
    setWorkTab('activity');
  };

  /** Selecting a queue filters the activity tab, so switch to it as well. */
  const handleQueueSelect = (queueId: string | null) => {
    setQueueFilter(queueId);
    if (queueId) setWorkTab('activity');
  };

  const toggleJobExpansion = (jobId: string) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId);
  };

  const activeQueueLabel = JOB_STEPS.find(step => step.id === queueFilter)?.shortLabel;

  const severityCounts = SEVERITY_ORDER
    .map(severity => ({ severity, count: actionItems.filter(item => item.severity === severity).length }))
    .filter(entry => entry.count > 0);

  const tabs: { id: WorkTab; label: string; icon: string; count: number }[] = [
    { id: 'actions', label: 'Action Required', icon: 'notification_important', count: actionItems.length },
    { id: 'activity', label: 'Job Activity', icon: 'list_alt', count: filteredJobs.length }
  ];

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

            {/* Row 1: Today's View + Processing Queues */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <TodaysViewPanel jobs={todaysJobs} onJobClick={handleFocusJob} />
              <ProcessingQueuesPanel
                jobs={todaysJobs}
                activeQueueId={queueFilter}
                onQueueSelect={handleQueueSelect}
              />
            </div>

            {/* Row 2: Action Required / Job Activity, tabbed so neither needs scrolling to reach */}
            <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-2 border-b border-slate-200 dark:border-slate-700">
                {/* Tabs */}
                <div className="flex items-end gap-1" role="tablist">
                  {tabs.map(tab => {
                    const isActive = workTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setWorkTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 -mb-px border-b-2 text-sm font-semibold transition-colors ${isActive
                          ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                      >
                        <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                        {tab.label}
                        <span className={`inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 rounded-full text-[11px] font-bold ${isActive
                          ? tab.id === 'actions' && tab.count > 0
                            ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                            : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Controls for the active tab */}
                {workTab === 'actions' ? (
                  <div className="flex items-center gap-2 pb-2">
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
                ) : (
                  <div className="flex items-center gap-4 pb-2">
                    <div className="hidden xl:flex items-center gap-3 text-xs font-medium">
                      <span className="text-green-600 dark:text-green-400">{stats.completedJobs} done</span>
                      <span className="text-blue-600 dark:text-blue-400">{stats.inProgressJobs} running</span>
                      <span className="text-slate-500 dark:text-slate-400">{stats.pendingJobs} pending</span>
                    </div>

                    {/* Period navigation */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => shiftPeriod(-1)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
                        title="Previous"
                      >
                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                      </button>
                      <button
                        onClick={() => setSelectedDate(new Date())}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        Today
                      </button>
                      <button
                        onClick={() => shiftPeriod(1)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
                        title="Next"
                      >
                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                      </button>
                    </div>

                    {/* View Mode Buttons */}
                    <div className="flex items-center gap-1.5">
                      {(['day', 'week', 'month'] as ViewMode[]).map(mode => (
                        <button
                          key={mode}
                          onClick={() => setViewMode(mode)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${viewMode === mode
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sub-heading for the active tab */}
              <p className="px-5 py-2 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                {workTab === 'actions'
                  ? 'Jobs the AI cannot finish on its own'
                  : `${getDateRange()}${activeQueueLabel ? ` · filtered to ${activeQueueLabel}` : ''}`}
              </p>

              {workTab === 'actions' ? (
                <ActionRequiredPanel items={actionItems} onResolve={openPatient} />
              ) : (
                <JobActivityPanel
                  jobs={filteredJobs}
                  expandedJobId={expandedJobId}
                  onToggleExpand={toggleJobExpansion}
                  onGoToDetail={handleGoToDetail}
                  isQueueFiltered={queueFilter !== null}
                />
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DailyJobDashboard;
