/**
 * Shared job model for the dashboard command center.
 *
 * The demo has no live job feed, so jobs are derived deterministically from the
 * selected date: the same date always produces the same schedule, which keeps
 * the command center panels consistent with the job activity table below them.
 */
import { Patient } from '@/types/patient';

export type JobStepId = 'fetch_pms' | 'ai_analysis_and_call' | 'api_call' | 'save_pms';

export type JobStepStatus = 'pending' | 'in_progress' | 'completed';

/** A stage as shown in the progress bar; API and Call are presented as one. */
export interface JobStep {
  id: string;
  label: string;
  /** Shorter wording for the narrow queue panel. */
  shortLabel: string;
  icon: string;
  /** The underlying steps this stage summarises. */
  sources: JobStepId[];
}

export interface PatientJob {
  id: string;
  patient: Patient;
  steps: Record<JobStepId, JobStepStatus>;
  scheduledTime: string;
  startTime: string;
  endTime: string;
  jobDate: Date;
  appointmentDate: Date | null;
}

export const JOB_STEPS: JobStep[] = [
  { id: 'fetch_pms', label: 'Patient Data Ready', shortLabel: 'Patient Data Fetch', icon: 'download', sources: ['fetch_pms'] },
  { id: 'ai_verification', label: 'AI Verification(API + Call)', shortLabel: 'AI Verification', icon: 'smart_toy', sources: ['api_call', 'ai_analysis_and_call'] },
  { id: 'save_pms', label: 'Verification Completed', shortLabel: 'Save to PMS', icon: 'save', sources: ['save_pms'] }
];

const startOfDay = (date: Date): Date => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const isSameDay = (a: Date, b: Date): boolean =>
  startOfDay(a).getTime() === startOfDay(b).getTime();

/** Jobs for one calendar day, seeded from the date so the data never shuffles. */
export const generateJobsForDate = (date: Date, patientList: Patient[]): PatientJob[] => {
  const dateStr = date.toISOString().split('T')[0];
  const seed = dateStr.split('').reduce((a, b) => a + b.charCodeAt(0), 0);

  const today = startOfDay(new Date());
  const checkDate = startOfDay(date);
  const isPastDate = checkDate < today;
  const isFutureDate = checkDate > today;

  const jobs = patientList.slice(0, 5 + (seed % 6)).map((patient, idx) => {
    const rng = (seed + idx * 7) % 100;
    const startHour = 8 + (rng % 12);
    const startMin = (rng * 13) % 60;
    const durationMin = 15 + ((rng * 19) % 61);

    const startDateObj = new Date(date);
    startDateObj.setHours(startHour, startMin, 0);

    const endDate = new Date(startDateObj.getTime() + durationMin * 60000);

    // Past days are finished, future days have not started; today is filled in
    // below, once the jobs can be put in run order.
    const steps: Record<JobStepId, JobStepStatus> = isFutureDate
      ? { fetch_pms: 'pending', api_call: 'pending', ai_analysis_and_call: 'pending', save_pms: 'pending' }
      : { fetch_pms: 'completed', api_call: 'completed', ai_analysis_and_call: 'completed', save_pms: 'completed' };

    // Set appointment date to 1 week after job start date
    const appointmentDate = new Date(startDateObj);
    appointmentDate.setDate(appointmentDate.getDate() + 7);

    return {
      id: `${dateStr}-${patient.id}-${idx}`,
      patient,
      steps,
      scheduledTime: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
      startTime: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
      endTime: `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`,
      jobDate: startDateObj,
      appointmentDate
    };
  });

  // Jobs run one after another, so today's day is mostly done: everything but
  // the last two runs is finished, and those two are still working through
  // their steps. Past and future days are uniform already.
  if (!isPastDate && !isFutureDate) {
    const inRunOrder = [...jobs].sort((a, b) => a.jobDate.getTime() - b.jobDate.getTime());
    inRunOrder.forEach((job, i) => {
      const fromEnd = inRunOrder.length - 1 - i;
      if (fromEnd === 1) {
        job.steps = { fetch_pms: 'completed', api_call: 'completed', ai_analysis_and_call: 'in_progress', save_pms: 'pending' };
      } else if (fromEnd === 0) {
        job.steps = { fetch_pms: 'completed', api_call: 'in_progress', ai_analysis_and_call: 'pending', save_pms: 'pending' };
      } else {
        job.steps = { ...COMPLETED_STEPS };
      }
    });
  }

  return jobs;
};

/**
 * Step states the two queue tabs show. An upcoming job has its patient data
 * pulled from the PMS and is waiting on verification; a past job is finished.
 */
export const DATA_READY_STEPS: Record<JobStepId, JobStepStatus> = {
  fetch_pms: 'completed',
  api_call: 'pending',
  ai_analysis_and_call: 'pending',
  save_pms: 'pending'
};

export const COMPLETED_STEPS: Record<JobStepId, JobStepStatus> = {
  fetch_pms: 'completed',
  api_call: 'completed',
  ai_analysis_and_call: 'completed',
  save_pms: 'completed'
};

/** Roll the underlying steps of a stage up into a single status. */
export const getStepStatus = (job: PatientJob, step: JobStep): JobStepStatus => {
  const statuses = step.sources.map(source => job.steps[source]);
  if (statuses.every(status => status === 'completed')) return 'completed';
  if (statuses.some(status => status !== 'pending')) return 'in_progress';
  return 'pending';
};

export type JobStatusKind = 'completed' | 'in_progress' | 'data_ready' | 'pending';

export const getJobStatusKind = (job: PatientJob): JobStatusKind => {
  const statuses = Object.values(job.steps);
  if (statuses.every(s => s === 'completed')) return 'completed';
  if (statuses.some(s => s === 'in_progress')) return 'in_progress';
  return 'pending';
};

export const JOB_STATUS_STYLES: Record<JobStatusKind, { text: string; color: string; bg: string }> = {
  completed: { text: 'Completed', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  data_ready: { text: 'Data Ready', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  in_progress: { text: 'In Progress', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  pending: { text: 'Pending', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' }
};

/** Capitalize first letter of each word, lowercase the rest. */
const capitalizeWord = (word: string): string =>
  word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '';

export const getPatientName = (patient: Patient): string => {
  const given = patient.name.given
    .map(name => name.split(' ').map(capitalizeWord).join(' '))
    .join(' ');
  const family = capitalizeWord(patient.name.family);
  return `${given} ${family}`.trim();
};
