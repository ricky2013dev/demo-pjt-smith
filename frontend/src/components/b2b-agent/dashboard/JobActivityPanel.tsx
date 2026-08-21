import React, { useEffect, useRef } from 'react';
import { TRANSACTION_TYPE_STYLES } from '@/constants/transactionTypes';
import { JOB_STATUS_STYLES, JOB_STEPS, PatientJob, getJobStatusKind, getPatientName, getStepStatus } from './jobs';

interface JobActivityPanelProps {
  jobs: PatientJob[];
  expandedJobId: string | null;
  onToggleExpand: (jobId: string) => void;
  onGoToDetail: (job: PatientJob) => void;
  /** Changes the empty state wording when a queue filter hid everything. */
  isQueueFiltered: boolean;
}

/** Mock transaction history for one job, mirroring the AI workflow steps. */
const generateTransactionHistory = (job: PatientJob) => {
  const transactions = [];
  const seed = job.jobDate.getTime();
  const insuranceProvider = job.patient.insurance?.[0]?.provider || 'Cigna Dental';
  const datePart = job.jobDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const reqId = (offset: number) =>
    `REQ-${job.jobDate.toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor((seed + offset) % 1000).toString().padStart(4, '0')}`;
  const clockAt = (minutesIn: number, seconds: string) => {
    const at = new Date(job.jobDate.getTime() + minutesIn * 60000);
    return `${at.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })} ${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}:${seconds}`;
  };

  // Fetch PMS transaction
  if (job.steps.fetch_pms !== 'pending') {
    transactions.push({
      startTime: `${datePart} ${job.startTime}:00`,
      reqId: reqId(0),
      duration: '2m 15s',
      type: 'FETCH',
      status: job.steps.fetch_pms === 'completed' ? 'SUCCESS' : 'IN_PROGRESS',
      insuranceProvider: '-',
      insuranceRep: '-',
      score: '100%',
      runBy: 'InSpline AI System'
    });
  }

  // API transaction
  if (job.steps.api_call !== 'pending') {
    transactions.push({
      startTime: clockAt(3, '15'),
      reqId: reqId(100),
      duration: '1m 10s',
      type: 'API',
      status: job.steps.api_call === 'completed' ? 'SUCCESS' : 'IN_PROGRESS',
      insuranceProvider,
      insuranceRep: 'API System',
      score: '92%',
      runBy: 'InSpline AI System'
    });
  }

  // AI Analysis and Call transactions
  if (job.steps.ai_analysis_and_call !== 'pending') {
    transactions.push({
      startTime: clockAt(9, '30'),
      reqId: reqId(50),
      duration: '5m 25s',
      type: 'ANALYSIS',
      status: job.steps.ai_analysis_and_call === 'completed' ? 'SUCCESS' : 'IN_PROGRESS',
      insuranceProvider,
      insuranceRep: 'Document AI',
      score: '85%',
      runBy: 'InSpline AI System'
    });

    transactions.push({
      startTime: clockAt(15, '22'),
      reqId: reqId(200),
      duration: '48m 0s',
      type: 'CALL',
      status: job.steps.ai_analysis_and_call === 'completed' ? 'SUCCESS' : 'IN_PROGRESS',
      insuranceProvider,
      insuranceRep: 'Amanda Rodriguez',
      score: '98%',
      runBy: 'InSpline AI System'
    });
  }

  // Save to PMS transaction
  if (job.steps.save_pms !== 'pending') {
    transactions.push({
      startTime: clockAt(61, '45'),
      reqId: reqId(300),
      duration: '1m 30s',
      type: 'SAVE',
      status: job.steps.save_pms === 'completed' ? 'SUCCESS' : 'IN_PROGRESS',
      insuranceProvider: '-',
      insuranceRep: '-',
      score: '100%',
      runBy: 'InSpline AI System'
    });
  }

  return transactions;
};

const getStepLineColor = (status: string) =>
  status === 'completed' ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600';

/**
 * The "Job Activity" tab body: every verification job in the selected period,
 * expandable into its transaction history.
 */
const JobActivityPanel: React.FC<JobActivityPanelProps> = ({ jobs, expandedJobId, onToggleExpand, onGoToDetail, isQueueFiltered }) => {
  const expandedRowRef = useRef<HTMLDivElement>(null);

  // A job expanded from Today's View may sit below the fold of the scroll area.
  useEffect(() => {
    expandedRowRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [expandedJobId]);

  return (
  <div>
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
          {JOB_STEPS.map((step) => (
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
    <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[420px] overflow-y-auto">
      {jobs.map((job) => {
        const jobStatus = JOB_STATUS_STYLES[getJobStatusKind(job)];
        const [startHour, startMin] = job.startTime.split(':');
        const [endHour, endMin] = job.endTime.split(':');
        const durationMin = (parseInt(endHour) * 60 + parseInt(endMin)) - (parseInt(startHour) * 60 + parseInt(startMin));
        const isExpanded = expandedJobId === job.id;

        return (
          <div key={job.id} ref={isExpanded ? expandedRowRef : undefined}>
            <div
              onClick={() => onToggleExpand(job.id)}
              className="flex gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer items-center"
            >
              {/* Expand/Collapse Icon */}
              <div className="w-6 flex items-center justify-center">
                <span className={`material-symbols-outlined text-slate-400 dark:text-slate-500 text-lg transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
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
                  {JOB_STEPS.map((step, stepIndex) => {
                    const status = getStepStatus(job, step);
                    const isLast = stepIndex === JOB_STEPS.length - 1;
                    return (
                      <React.Fragment key={step.id}>
                        {/* Step Circle */}
                        <div className="flex flex-col items-center flex-1">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs border-2 transition-all ${status === 'completed'
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
                            <div className={`absolute inset-0 rounded-full transition-all ${getStepLineColor(status)}`}></div>
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
                      onGoToDetail(job);
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
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-100 dark:bg-slate-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Start Time</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Duration</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Insurance(Payer)</th>
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
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${transaction.status === 'SUCCESS' ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                                'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                                }`}>
                                {transaction.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">{transaction.insuranceProvider}</td>
                            <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">{transaction.insuranceRep}</td>
                            <td className="px-4 py-3">
                              <span className={`text-sm font-bold ${parseInt(transaction.score) === 100 ? 'text-green-600 dark:text-green-400' :
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

      {/* Empty State */}
      {jobs.length === 0 && (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-slate-400">schedule</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No jobs to show</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {isQueueFiltered ? 'No jobs are sitting in this queue for the selected period.' : 'No patients are scheduled for this period.'}
          </p>
        </div>
      )}
    </div>
  </div>
  );
};

export default JobActivityPanel;
