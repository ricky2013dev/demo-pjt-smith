import React, { useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Patient } from '@/types/patient';
import Header from '@/components/Header';
import patientsData from '@mockupdata/patients.json';
import { TRANSACTION_TYPE_STYLES } from '@/constants/transactionTypes';

interface JobStep {
  id: 'fetch_pms' | 'analysis' | 'api_call' | 'call_center' | 'save_pms';
  label: string;
  icon: string;
}

interface PatientJob {
  patient: Patient;
  steps: Record<JobStep['id'], 'pending' | 'in_progress' | 'completed'>;
  scheduledTime: string;
  startTime: string;
  endTime: string;
  jobDate: Date;
  appointmentDate: Date | null;
}

interface DailyJobDashboardProps {
  patients?: Patient[];
  onDetailClick?: (patientId: string) => void;
}

type ViewMode = 'day' | 'week' | 'month';

const DailyJobDashboard: React.FC<DailyJobDashboardProps> = ({ patients: patientsPropsOverride, onDetailClick }) => {
  const [, navigate] = useLocation();
  const patients = patientsPropsOverride || (patientsData as Patient[]);

  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const jobSteps: JobStep[] = [
    { id: 'fetch_pms', label: 'Fetch PMS', icon: 'download' },
    { id: 'api_call', label: 'API Verification', icon: 'api' },
    { id: 'analysis', label: 'Document Analysis', icon: 'description' },
    { id: 'call_center', label: 'Call Center', icon: 'phone' },
    { id: 'save_pms', label: 'Save To PMS', icon: 'save' }
  ];

  // Generate jobs for a specific date
  const generateJobsForDate = (date: Date, patientList: Patient[]): PatientJob[] => {
    const dateStr = date.toISOString().split('T')[0];
    // Use date string to seed random number for consistent data per date
    const seed = dateStr.split('').reduce((a, b) => a + b.charCodeAt(0), 0);

    // Check if date is past, present, or future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    const isPastDate = checkDate < today;
    const isFutureDate = checkDate > today;

    return patientList.slice(0, 5 + (seed % 6)).map((patient, idx) => {
      const rng = (seed + idx * 7) % 100;
      const startHour = 8 + (rng % 12);
      const startMin = (rng * 13) % 60;
      const durationMin = 15 + ((rng * 19) % 61);

      const startDateObj = new Date(date);
      startDateObj.setHours(startHour, startMin, 0);

      const endDate = new Date(startDateObj.getTime() + durationMin * 60000);

      // For past dates: all steps completed
      // For future dates: all steps pending
      // For today: mixed status
      const getStepStatus = () => {
        if (isPastDate) {
          return {
            fetch_pms: 'completed' as const,
            analysis: 'completed' as const,
            api_call: 'completed' as const,
            call_center: 'completed' as const,
            save_pms: 'completed' as const
          };
        } else if (isFutureDate) {
          return {
            fetch_pms: 'pending' as const,
            analysis: 'pending' as const,
            api_call: 'pending' as const,
            call_center: 'pending' as const,
            save_pms: 'pending' as const
          };
        } else {
          return {
            fetch_pms: rng > 30 ? 'completed' as const : 'in_progress' as const,
            analysis: rng > 40 ? 'completed' as const : 'in_progress' as const,
            api_call: rng > 55 ? 'completed' as const : 'in_progress' as const,
            call_center: rng > 70 ? 'completed' as const : 'in_progress' as const,
            save_pms: rng > 80 ? 'completed' as const : 'in_progress' as const
          };
        }
      };

      // Set appointment date to 1 week after job start date
      const appointmentDate = new Date(startDateObj);
      appointmentDate.setDate(appointmentDate.getDate() + 7);

      return {
        patient,
        steps: getStepStatus(),
        scheduledTime: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
        startTime: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
        endTime: `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`,
        jobDate: startDateObj,
        appointmentDate
      };
    });
  };

  // Get filtered jobs based on view mode
  const filteredJobs: PatientJob[] = useMemo(() => {
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
        const date = new Date(year, month, day);
        jobs.push(...generateJobsForDate(date, patients));
      }
    }

    // Sort by latest time first
    return jobs.sort((a, b) => b.jobDate.getTime() - a.jobDate.getTime());
  }, [selectedDate, viewMode, patients]);

  const stats = useMemo(() => {
    let totalJobs = filteredJobs.length;
    let completedJobs = 0;
    let inProgressJobs = 0;

    filteredJobs.forEach(job => {
      const allCompleted = Object.values(job.steps).every(step => step === 'completed');
      const anyInProgress = Object.values(job.steps).some(step => step === 'in_progress');

      if (allCompleted) completedJobs++;
      else if (anyInProgress) inProgressJobs++;
    });

    const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;

    return { totalJobs, completedJobs, inProgressJobs, completionRate };
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

  const handlePreviousPeriod = () => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setSelectedDate(newDate);
  };

  const handleNextPeriod = () => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const getStepLineColor = (status: string) => {
    if (status === 'completed') return 'bg-green-500';
    if (status === 'in_progress') return 'bg-slate-300 dark:bg-slate-600';
    return 'bg-slate-300 dark:bg-slate-600';
  };

  const getPatientName = (patient: Patient) => {
    const given = patient.name.given.join(' ');
    return `${given} ${patient.name.family}`.trim();
  };

  const getJobStatus = (job: PatientJob) => {
    const allCompleted = Object.values(job.steps).every(s => s === 'completed');
    const anyInProgress = Object.values(job.steps).some(s => s === 'in_progress');

    if (allCompleted) return { text: 'Completed', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' };
    if (anyInProgress) return { text: 'In Progress', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' };
    return { text: 'Pending', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' };
  };

  const handleLogout = () => {
    navigate('/');
  };

  // Generate mock transaction history for a job
  const generateTransactionHistory = (job: PatientJob) => {
    const transactions = [];
    const seed = job.jobDate.getTime();
    const insuranceProvider = job.patient.insurance?.[0]?.provider || 'Cigna Dental';

    // Fetch PMS transaction
    if (job.steps.fetch_pms !== 'pending') {
      transactions.push({
        startTime: job.jobDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + job.startTime + ':00',
        reqId: `REQ-${job.jobDate.toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor((seed) % 1000).toString().padStart(4, '0')}`,
        duration: '2m 15s',
        type: 'FETCH',
        status: job.steps.fetch_pms === 'completed' ? 'SUCCESS' : 'IN_PROGRESS',
        insuranceProvider: '-',
        insuranceRep: '-',
        score: '100%',
        runBy: 'Smith AI System'
      });
    }

    // API transaction
    if (job.steps.api_call !== 'pending') {
      const apiStartTime = new Date(job.jobDate.getTime() + 3 * 60000); // 3 minutes after job start
      transactions.push({
        startTime: apiStartTime.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' +
          `${String(apiStartTime.getHours()).padStart(2, '0')}:${String(apiStartTime.getMinutes()).padStart(2, '0')}:15`,
        reqId: `REQ-${job.jobDate.toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor((seed + 100) % 1000).toString().padStart(4, '0')}`,
        duration: '1m 10s',
        type: 'API',
        status: job.steps.api_call === 'completed' ? 'SUCCESS' : 'IN_PROGRESS',
        insuranceProvider,
        insuranceRep: 'API System',
        score: '92%',
        runBy: 'Smith AI System'
      });
    }

    // Document Analysis transaction
    if (job.steps.analysis !== 'pending') {
      const analysisStartTime = new Date(job.jobDate.getTime() + 9 * 60000); // 9 minutes after job start
      transactions.push({
        startTime: analysisStartTime.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' +
          `${String(analysisStartTime.getHours()).padStart(2, '0')}:${String(analysisStartTime.getMinutes()).padStart(2, '0')}:30`,
        reqId: `REQ-${job.jobDate.toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor((seed + 50) % 1000).toString().padStart(4, '0')}`,
        duration: '5m 25s',
        type: 'ANALYSIS',
        status: job.steps.analysis === 'completed' ? 'SUCCESS' : 'IN_PROGRESS',
        insuranceProvider,
        insuranceRep: 'Document AI',
        score: '85%',
        runBy: 'Smith AI System'
      });
    }

    // Call Center transaction
    if (job.steps.call_center !== 'pending') {
      const callStartTime = new Date(job.jobDate.getTime() + 12 * 60000); // 12 minutes after job start
      transactions.push({
        startTime: callStartTime.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' +
          `${String(callStartTime.getHours()).padStart(2, '0')}:${String(callStartTime.getMinutes()).padStart(2, '0')}:22`,
        reqId: `REQ-${job.jobDate.toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor((seed + 200) % 1000).toString().padStart(4, '0')}`,
        duration: '48m 0s',
        type: 'CALL',
        status: job.steps.call_center === 'completed' ? 'SUCCESS' : 'IN_PROGRESS',
        insuranceProvider,
        insuranceRep: 'Amanda Rodriguez',
        score: '98%',
        runBy: 'Smith AI System'
      });
    }

    // Save to PMS transaction
    if (job.steps.save_pms !== 'pending') {
      const saveStartTime = new Date(job.jobDate.getTime() + 61 * 60000); // 61 minutes after job start
      transactions.push({
        startTime: saveStartTime.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' +
          `${String(saveStartTime.getHours()).padStart(2, '0')}:${String(saveStartTime.getMinutes()).padStart(2, '0')}:45`,
        reqId: `REQ-${job.jobDate.toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor((seed + 300) % 1000).toString().padStart(4, '0')}`,
        duration: '1m 30s',
        type: 'SAVE',
        status: job.steps.save_pms === 'completed' ? 'SUCCESS' : 'IN_PROGRESS',
        insuranceProvider: '-',
        insuranceRep: '-',
        score: '100%',
        runBy: 'Smith AI System'
      });
    }

    return transactions;
  };

  const handleGoToDetail = (job: PatientJob) => {
    if (onDetailClick) {
      onDetailClick(job.patient.id);
    } else {
      // Always navigate to Sarah Jane Johnson (ID: 1001)
      navigate(`/b2b-agent/patient-detail?patientId=1001`);
    }
  };

  const toggleJobExpansion = (jobId: string) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId);
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950 overflow-hidden font-sans">
      {/* Header */}
      <Header
        onLogoClick={() => navigate('/b2b-agent/dashboard')}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-8 py-8 space-y-6">

          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">AI-Automated Jobs Dashboard </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Track Patient Insurance Verification Workflow Progress</p>
          </div>

          {/* View Controls */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handlePreviousPeriod}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
                title="Previous"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>

              <div className="text-center min-w-[200px]">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{getDateRange()}</p>
              </div>

              <button
                onClick={handleNextPeriod}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
                title="Next"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>

              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>

              <button
                onClick={handleToday}
                className="px-3 py-1.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                Today
              </button>
            </div>

            {/* View Mode Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  viewMode === 'day'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  viewMode === 'week'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  viewMode === 'month'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                Month
              </button>
            </div>
          </div>

          {/* Quick Stats with Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Total Jobs</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats.totalJobs}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Completed</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.completedJobs}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">In Progress</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.inProgressJobs}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 flex flex-col">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Completion Rate</p>
              <div className="flex items-center justify-between mt-3 flex-1">
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.completionRate}%</p>
                <svg width="60" height="60" viewBox="0 0 60 60" className="ml-2">
                  <circle cx="30" cy="30" r="27" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                  <circle
                    cx="30"
                    cy="30"
                    r="27"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="6"
                    strokeDasharray={`${(stats.completionRate / 100) * 170} 170`}
                    strokeLinecap="round"
                    transform="rotate(-90 30 30)"
                    className="transition-all duration-300"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Patient Jobs Table */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Table Header with Step Labels */}
            <div className="flex gap-3 px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <div className="w-6"></div>
              <div style={{ width: '15%' }}>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Date & Time</p>
              </div>
              <div style={{ width: '10%' }}>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Duration</p>
              </div>
              <div style={{ width: '15%' }}>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Appointment Date</p>
              </div>
              <div style={{ width: '15%' }}>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Patient</p>
              </div>
              <div style={{ width: '35%' }}>
                <div className="flex items-center justify-between">
                  {jobSteps.map((step) => (
                    <div key={step.id} className="flex flex-col items-center flex-1">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 text-center px-1">{step.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ width: '10%' }} className="flex justify-end">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Status</p>
              </div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[600px] overflow-y-auto">
              {filteredJobs.map((job, index) => {
                const jobStatus = getJobStatus(job);
                const [startHour, startMin] = job.startTime.split(':');
                const [endHour, endMin] = job.endTime.split(':');
                const durationMin = (parseInt(endHour) * 60 + parseInt(endMin)) - (parseInt(startHour) * 60 + parseInt(startMin));
                const jobId = `${job.jobDate.toISOString()}-${index}`;
                const isExpanded = expandedJobId === jobId;

                return (
                  <div key={jobId}>
                    <div
                      onClick={() => toggleJobExpansion(jobId)}
                      className="flex gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer items-center"
                    >
                    {/* Expand/Collapse Icon */}
                    <div className="w-6 flex items-center justify-center">
                      <span className={`material-symbols-outlined text-slate-400 dark:text-slate-500 text-lg transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}>
                        expand_more
                      </span>
                    </div>

                    {/* Date & Time */}
                    <div style={{ width: '15%' }}>
                      <div className="flex flex-col">
                        <p className="text-sm text-slate-600 dark:text-slate-400">{job.jobDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        <p className="text-xs text-slate-900 dark:text-white font-medium">{job.startTime} - {job.endTime}</p>
                      </div>
                    </div>

                    {/* Duration */}
                    <div style={{ width: '10%' }}>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{durationMin}m</p>
                    </div>

                    {/* Appointment Date */}
                    <div style={{ width: '15%' }}>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {job.appointmentDate
                          ? job.appointmentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'No appointment'
                        }
                      </p>
                    </div>

                    {/* Patient Name */}
                    <div style={{ width: '15%' }}>
                      <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{getPatientName(job.patient)}</p>
                    </div>

                    {/* Progress Steps */}
                    <div style={{ width: '35%' }}>
                      <div className="flex items-center justify-between h-8">
                        {jobSteps.map((step, stepIndex) => {
                          const status = job.steps[step.id];
                          const isLast = stepIndex === jobSteps.length - 1;
                          return (
                            <React.Fragment key={step.id}>
                              {/* Step Circle */}
                              <div className="flex flex-col items-center flex-1">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs border-2 transition-all ${
                                    status === 'completed'
                                      ? 'bg-green-500 dark:bg-green-600 border-green-500 dark:border-green-600 text-white'
                                      : status === 'in_progress'
                                      ? 'bg-blue-500 dark:bg-blue-600 border-blue-500 dark:border-blue-600 text-white'
                                      : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  {status === 'completed' ? (
                                    <span className="material-symbols-outlined text-sm">check</span>
                                  ) : status === 'in_progress' ? (
                                    <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                                  ) : (
                                    stepIndex + 1
                                  )}
                                </div>
                              </div>

                              {/* Connector Line */}
                              {!isLast && (
                                <div className="flex-1 h-0.5 mx-1 relative">
                                  <div
                                    className={`absolute inset-0 rounded-full transition-all ${getStepLineColor(status)}`}
                                  ></div>
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div style={{ width: '10%' }} className="flex justify-end">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${jobStatus.bg} ${jobStatus.color}`}>
                        {jobStatus.text}
                      </span>
                    </div>
                  </div>

                  {/* Expandable Transaction Summary */}
                  {isExpanded && (
                    <div className="bg-slate-50 dark:bg-slate-800/30 p-6 border-t border-slate-200 dark:border-slate-700">
                      {/* Summary Header */}
                      <div className="flex items-center gap-4 mb-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          Transaction Summary
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGoToDetail(job);
                          }}
                          className="px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors text-xs font-medium flex items-center gap-1"
                        >
                          Go to Detail
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                      </div>

                      {/* Patient Info */}
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Patient: {getPatientName(job.patient)} | Date: {job.jobDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>

                      {/* Transaction History Table */}
                      <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">

                        {/* Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-slate-100 dark:bg-slate-800">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Start Time</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Duration</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Insurance Provider</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Insurance Rep</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Score</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Run By</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                              {generateTransactionHistory(job).map((transaction, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                  <td className="px-4 py-3">
                                    <div className="text-sm text-slate-900 dark:text-white font-medium">{transaction.startTime.split(' ')[0]}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{transaction.reqId}</div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{transaction.duration}</td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${TRANSACTION_TYPE_STYLES[transaction.type as keyof typeof TRANSACTION_TYPE_STYLES]?.bgColor} ${TRANSACTION_TYPE_STYLES[transaction.type as keyof typeof TRANSACTION_TYPE_STYLES]?.textColor}`}>
                                      {transaction.type}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                                      transaction.status === 'SUCCESS' ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                                      'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                                    }`}>
                                      {transaction.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">{transaction.insuranceProvider}</td>
                                  <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">{transaction.insuranceRep}</td>
                                  <td className="px-4 py-3">
                                    <span className={`text-sm font-bold ${
                                      parseInt(transaction.score) === 100 ? 'text-green-600 dark:text-green-400' :
                                      parseInt(transaction.score) >= 80 ? 'text-orange-600 dark:text-orange-400' :
                                      'text-red-600 dark:text-red-400'
                                    }`}>
                                      {transaction.score}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">{transaction.runBy}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>

          {/* Empty State */}
          {filteredJobs.length === 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-slate-400">schedule</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No jobs scheduled</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">No patients are scheduled for this period.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DailyJobDashboard;
