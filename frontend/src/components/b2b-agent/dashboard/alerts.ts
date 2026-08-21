/**
 * Derives the "Action Required" work list from the day's jobs: everything the
 * AI cannot clear on its own and a human has to pick up.
 */
import { Patient, TAB_TYPES, TabType } from '@/types/patient';
import { PatientJob, getJobStatusKind } from './jobs';

export type Severity = 'critical' | 'warning' | 'info';

export interface ActionItem {
  key: string;
  patient: Patient;
  severity: Severity;
  issue: string;
  detail: string;
  /** How long this has been sitting, in words. */
  waiting: string;
  actionLabel: string;
  /**
   * Patient Detail tab this item opens. Coverage problems go to Insurance
   * Coverage; insurance-record problems go to Patient Basic Info, which is
   * where the insurance basic fields now live.
   */
  tab: TabType;
}

export const SEVERITY_STYLES: Record<Severity, { label: string; chip: string; dot: string }> = {
  critical: {
    label: 'Critical',
    chip: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    dot: 'bg-red-500'
  },
  warning: {
    label: 'Warning',
    chip: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500'
  },
  info: {
    label: 'Review',
    chip: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-500'
  }
};

export const SEVERITY_ORDER: Severity[] = ['critical', 'warning', 'info'];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const formatDate = (date: Date): string =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** "3h 20m" / "2d" - how long a job has been sitting since it was scheduled. */
const sinceScheduled = (job: PatientJob, now: Date): string => {
  const minutes = Math.max(0, Math.round((now.getTime() - job.jobDate.getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${Math.floor(minutes / (24 * 60))}d`;
};

/** Highest severity first; one entry per patient and problem. */
export const buildActionItems = (jobs: PatientJob[], now: Date): ActionItem[] => {
  const items: ActionItem[] = [];
  const seen = new Set<string>();

  const push = (item: ActionItem) => {
    if (seen.has(item.key)) return;
    seen.add(item.key);
    items.push(item);
  };

  jobs.forEach(job => {
    const { patient } = job;
    const insurance = patient.insurance?.[0];
    const status = getJobStatusKind(job);

    // No insurance on file - nothing can be verified at all.
    if (!insurance) {
      push({
        key: `${patient.id}-no-insurance`,
        patient,
        severity: 'critical',
        issue: 'Missing insurance',
        detail: 'No insurance on file - verification cannot start',
        waiting: sinceScheduled(job, now),
        actionLabel: 'Add insurance',
        tab: TAB_TYPES.PATIENT_BASIC_INFO
      });
    }

    // Coverage that has lapsed makes any returned benefits unreliable.
    if (insurance?.expirationDate) {
      const expiry = new Date(insurance.expirationDate);
      if (!Number.isNaN(expiry.getTime()) && expiry < now) {
        push({
          key: `${patient.id}-expired`,
          patient,
          severity: 'critical',
          issue: 'Coverage expired',
          detail: `${insurance.provider} coverage ended ${formatDate(expiry)}`,
          waiting: `${Math.floor((now.getTime() - expiry.getTime()) / MS_PER_DAY)}d`,
          actionLabel: 'Review coverage',
          tab: TAB_TYPES.INSURANCE
        });
      }
    }

    // An AI call still running an hour after its slot needs a human.
    if (job.steps.ai_analysis_and_call === 'in_progress' && now.getTime() - job.jobDate.getTime() > 60 * 60 * 1000) {
      push({
        key: `${patient.id}-stalled`,
        patient,
        severity: 'warning',
        issue: 'Call stalled',
        detail: `AI verification call still open since ${job.startTime}`,
        waiting: sinceScheduled(job, now),
        actionLabel: 'Open transactions',
        tab: TAB_TYPES.AI_CALL_HISTORY
      });
    }

    // Appointment is close and the verification has not landed yet.
    if (job.appointmentDate && status !== 'completed') {
      const daysToAppointment = Math.ceil((job.appointmentDate.getTime() - now.getTime()) / MS_PER_DAY);
      if (daysToAppointment >= 0 && daysToAppointment <= 3) {
        push({
          key: `${patient.id}-appointment`,
          patient,
          severity: 'warning',
          issue: 'Appointment at risk',
          detail: `Appointment ${daysToAppointment === 0 ? 'today' : `in ${daysToAppointment}d`} with verification incomplete`,
          waiting: sinceScheduled(job, now),
          actionLabel: 'View appointment',
          tab: TAB_TYPES.APPOINTMENTS
        });
      }
    }

    // Benefits nearly used up - the estimate needs a second look before treatment.
    const coverage = patient.coverage;
    if (coverage?.annual_maximum && coverage.annual_used / coverage.annual_maximum >= 0.9) {
      push({
        key: `${patient.id}-max`,
        patient,
        severity: 'info',
        issue: 'Benefit nearly exhausted',
        detail: `${Math.round((coverage.annual_used / coverage.annual_maximum) * 100)}% of the $${coverage.annual_maximum.toLocaleString()} annual maximum used`,
        waiting: '-',
        actionLabel: 'Check benefits',
        tab: TAB_TYPES.INSURANCE
      });
    }
  });

  return items.sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));
};
