import React, { useState, useMemo, useEffect } from 'react';
import Breadcrumb from './Breadcrumb';
import { Patient } from '@/types/patient';
import { VERIFICATION_STATUS_LABELS } from '@/constants/verificationStatus';
import { DayPicker } from 'react-day-picker';
import {
  format,
  subMonths,
  addMonths,
  addDays,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  isValid,
  parseISO,
} from 'date-fns';
import * as Popover from '@radix-ui/react-popover';
import 'react-day-picker/style.css';
import { deriveVerificationStatusFromTransactions, type Transaction, type VerificationStatus } from '@/utils/transactionStatus';
import { VerificationStepper } from '@/components/verificationStepper';

type StatusKey = 'not_started' | 'in_progress' | 'completed';

/** Verification statuses offered as toggle chips in the filter bar. */
const STATUS_OPTIONS: Array<{
  key: StatusKey;
  label: string;
  icon: string;
  /** Chip styling when the status is switched on. */
  activeClass: string;
  /** Dot colour shown on the inactive chip. */
  dotClass: string;
}> = [
  {
    key: 'not_started',
    label: 'Not Started',
    icon: 'radio_button_unchecked',
    activeClass: 'bg-slate-800 border-slate-800 text-white dark:bg-slate-200 dark:border-slate-200 dark:text-slate-900',
    dotClass: 'bg-slate-400',
  },
  {
    key: 'in_progress',
    label: 'In Progress',
    icon: 'progress_activity',
    activeClass: 'bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500',
    dotClass: 'bg-blue-500',
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: 'task_alt',
    activeClass: 'bg-green-600 border-green-600 text-white dark:bg-green-500 dark:border-green-500',
    dotClass: 'bg-green-500',
  },
];

/** Shared classes for the unselected state of a filter chip. */
const CHIP_IDLE_CLASS =
  'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800';

interface PatientGuideProps {
  totalPatients?: number;
  verificationStats?: {
    verified: number;
    inProgress: number;
    pending: number;
    notStarted: number;
  };
  patients?: Patient[];
  onSelectPatient?: (patientId: string) => void;
  currentUser?: { stediMode?: string } | null;
}

const PatientGuide: React.FC<PatientGuideProps> = ({
  totalPatients: _totalPatients = 0,
  verificationStats: _verificationStats = { verified: 0, inProgress: 0, pending: 0, notStarted: 0 },
  patients = [],
  onSelectPatient,
  currentUser = null
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<StatusKey[]>([]);
  // No default range so the list shows every patient until the user picks one.
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Fetch transactions when in Data Mode (stediMode is not 'mockup')
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!currentUser?.stediMode || currentUser.stediMode === 'mockup') {
        setTransactions([]);
        return;
      }

      try {
        const response = await fetch('/api/transactions', {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.transactions) {
            setTransactions(data.transactions);
          }
        }
      } catch (error) {
        // Silent error
      }
    };

    fetchTransactions();
  }, [currentUser?.stediMode]);

  // Derive verification status for each patient based on transactions (Data Mode)
  const patientVerificationStatusMap = useMemo(() => {
    const statusMap: Record<string, VerificationStatus> = {};

    const isRealDataMode = currentUser?.stediMode && currentUser.stediMode !== 'mockup';
    if (isRealDataMode && transactions.length > 0) {
      // Group transactions by patient ID
      const transactionsByPatient: Record<string, Transaction[]> = {};
      for (const txn of transactions) {
        if (!transactionsByPatient[txn.patientId]) {
          transactionsByPatient[txn.patientId] = [];
        }
        transactionsByPatient[txn.patientId].push(txn);
      }

      // Derive status for each patient
      for (const patientId of Object.keys(transactionsByPatient)) {
        statusMap[patientId] = deriveVerificationStatusFromTransactions(transactionsByPatient[patientId]);
      }
    }

    return statusMap;
  }, [currentUser?.stediMode, transactions]);

  // Get effective verification status for a patient
  const getEffectiveVerificationStatus = (patient: Patient): VerificationStatus | undefined => {
    // If in Data Mode (stediMode is not 'mockup') and we have derived status from transactions, use that
    const isRealDataMode = currentUser?.stediMode && currentUser.stediMode !== 'mockup';
    if (isRealDataMode && patientVerificationStatusMap[patient.id]) {
      return patientVerificationStatusMap[patient.id];
    }
    // Otherwise fall back to patient's verification status
    return patient.verificationStatus;
  };

  // Highlight matching text in search results
  const highlightMatch = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 dark:bg-yellow-500/40 text-yellow-900 dark:text-yellow-100 rounded px-0.5">
          {part}
        </span>
      ) : part
    );
  };

  // Format relative date display
  const formatRelativeDate = (dateStr: string): string => {
    const date = parseISO(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const aptDate = new Date(date);
    aptDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((aptDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
    return '';
  };

  // Capitalize first letter of each word, lowercase the rest
  const capitalizeWord = (word: string): string => {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  };

  const getPatientName = (patient: Patient) => {
    const given = patient.name.given
      .map(name => name.split(' ').map(capitalizeWord).join(' '))
      .join(' ');
    const family = capitalizeWord(patient.name.family);
    return `${given} ${family}`.trim();
  };

  const getPatientPhone = (patient: Patient): string => {
    const phone = patient.telecom?.find(t => t.system === 'phone');
    return phone?.value || '';
  };

  const getPatientEmail = (patient: Patient): string => {
    const email = patient.telecom?.find(t => t.system === 'email');
    return email?.value || '';
  };

  // Check which field matches the search query
  const getSearchMatchField = (patient: Patient, query: string): 'name' | 'phone' | 'email' | null => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    if (getPatientName(patient).toLowerCase().includes(q)) return 'name';
    if (getPatientPhone(patient).toLowerCase().includes(q)) return 'phone';
    if (getPatientEmail(patient).toLowerCase().includes(q)) return 'email';
    return null;
  };

  // Select / unselect a status chip.
  const toggleStatus = (status: StatusKey) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  // Collapse the three-step verification status into a single bucket.
  const getStatusKey = (patient: Patient): StatusKey => {
    const status = getEffectiveVerificationStatus(patient);
    if (!status) return 'not_started';

    const { fetchPMS, aiAnalysisAndCall, saveToPMS } = status;
    if (saveToPMS === 'completed') return 'completed';
    if (fetchPMS === 'pending' && aiAnalysisAndCall === 'pending' && saveToPMS === 'pending') {
      return 'not_started';
    }
    return 'in_progress';
  };

  // <input type="date"> works in yyyy-MM-dd; keep conversion in one place.
  const toInputDate = (date: Date | undefined): string => (date ? format(date, 'yyyy-MM-dd') : '');

  const fromInputDate = (value: string): Date | undefined => {
    if (!value) return undefined;
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : undefined;
  };

  const setRangeStart = (value: string) => {
    setDateRange(prev => ({ ...prev, from: fromInputDate(value) }));
  };

  const setRangeEnd = (value: string) => {
    setDateRange(prev => ({ ...prev, to: fromInputDate(value) }));
  };

  const clearDateRange = () => setDateRange({ from: undefined, to: undefined });

  const applyPreset = (from: Date, to: Date) => setDateRange({ from, to });

  const hasDateFilter = Boolean(dateRange.from || dateRange.to);
  const hasActiveFilters = Boolean(searchQuery.trim()) || selectedStatuses.length > 0 || hasDateFilter;

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedStatuses([]);
    clearDateRange();
  };

  // Label describing the active range, e.g. "Aug 1 - Aug 31, 2026".
  const dateRangeLabel = (): string => {
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
    }
    if (dateRange.from) return `From ${format(dateRange.from, 'MMM d, yyyy')}`;
    if (dateRange.to) return `Until ${format(dateRange.to, 'MMM d, yyyy')}`;
    return 'All dates';
  };

  // Rows matching search + date range; the status chips filter this further so
  // each chip can show how many rows it would keep.
  const dateAndSearchFiltered = useMemo(() => {
    const allAppointments: Array<{ patient: Patient, appointment: any | null }> = [];

    patients.forEach(patient => {
      if (patient.appointments && patient.appointments.length > 0) {
        patient.appointments.forEach(apt => {
          allAppointments.push({ patient, appointment: apt });
        });
      } else {
        // Include patients without appointments
        allAppointments.push({ patient, appointment: null });
      }
    });

    let filtered = allAppointments;

    // Date range filter (patients without appointments pass through)
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(item => {
        // Patients without appointments are always shown
        if (!item.appointment) return true;

        const aptDate = parseISO(item.appointment.date);
        if (dateRange.from && dateRange.to) {
          return isWithinInterval(aptDate, { start: dateRange.from, end: dateRange.to });
        }
        if (dateRange.from) return aptDate >= dateRange.from;
        if (dateRange.to) return aptDate <= dateRange.to;
        return true;
      });
    }

    // Search filter (by name, phone, or email)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const name = getPatientName(item.patient).toLowerCase();
        const phone = getPatientPhone(item.patient).toLowerCase();
        const email = getPatientEmail(item.patient).toLowerCase();
        return name.includes(query) || phone.includes(query) || email.includes(query);
      });
    }

    // Sort by date ascending (patients without appointments go to the end)
    filtered.sort((a, b) => {
      if (!a.appointment && !b.appointment) return 0;
      if (!a.appointment) return 1;
      if (!b.appointment) return -1;
      return parseISO(a.appointment.date).getTime() - parseISO(b.appointment.date).getTime();
    });

    return filtered;
  }, [patients, dateRange, searchQuery]);

  // How many rows each status chip would keep, given the other active filters.
  const statusCounts = useMemo(() => {
    const counts: Record<StatusKey, number> = { not_started: 0, in_progress: 0, completed: 0 };
    dateAndSearchFiltered.forEach(item => {
      counts[getStatusKey(item.patient)] += 1;
    });
    return counts;
  }, [dateAndSearchFiltered, patientVerificationStatusMap, currentUser?.stediMode]);

  const filteredAppointments = useMemo(() => {
    if (selectedStatuses.length === 0) return dateAndSearchFiltered;
    return dateAndSearchFiltered.filter(item => selectedStatuses.includes(getStatusKey(item.patient)));
  }, [dateAndSearchFiltered, selectedStatuses, patientVerificationStatusMap, currentUser?.stediMode]);

  const getVerificationStatus = (patient: Patient) => {
    const effectiveStatus = getEffectiveVerificationStatus(patient);
    if (!effectiveStatus) {
      return { label: VERIFICATION_STATUS_LABELS.NOT_STARTED, color: 'text-slate-600 dark:text-slate-400', percentage: 0 };
    }

    const { fetchPMS, aiAnalysisAndCall, saveToPMS } = effectiveStatus;

    // Fully verified
    if (saveToPMS === 'completed') {
      return { label: VERIFICATION_STATUS_LABELS.COMPLETED, color: 'text-green-600 dark:text-green-400', percentage: 100 };
    }
    if (saveToPMS === 'in_progress') {
      return { label: VERIFICATION_STATUS_LABELS.SAVE_TO_PMS, color: 'text-blue-600 dark:text-blue-400', percentage: 90 };
    }
    if (aiAnalysisAndCall === 'completed') {
      return { label: VERIFICATION_STATUS_LABELS.AI_ANALYSIS_AND_CALL, color: 'text-orange-600 dark:text-orange-400', percentage: 75 };
    }
    if (aiAnalysisAndCall === 'in_progress') {
      return { label: VERIFICATION_STATUS_LABELS.AI_ANALYSIS_AND_CALL, color: 'text-blue-600 dark:text-blue-400', percentage: 50 };
    }
    if (fetchPMS === 'completed') {
      return { label: VERIFICATION_STATUS_LABELS.FETCH_PMS, color: 'text-orange-600 dark:text-orange-400', percentage: 25 };
    }
    if (fetchPMS === 'in_progress') {
      return { label: VERIFICATION_STATUS_LABELS.FETCH_PMS, color: 'text-blue-600 dark:text-blue-400', percentage: 10 };
    }

    // Not started
    return { label: VERIFICATION_STATUS_LABELS.NOT_STARTED, color: 'text-slate-600 dark:text-slate-400', percentage: 0 };
  };

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      {/* Fills the page like Patient Detail: the panels keep their height and the
          table takes whatever is left, so there is no dead space at any width. */}
      <div className="flex min-h-0 w-full flex-1 flex-col gap-4 p-4">

        {/* Header */}
        <div className="flex shrink-0 flex-wrap items-end justify-between gap-3">
          <div>
            <Breadcrumb className="mb-2" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Patient Search
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Find a patient by name, phone or email, then open the record to start insurance verification.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2">
            <span className="material-symbols-outlined text-lg text-slate-400">groups</span>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-white">{patients.length}</span> patients in scope
            </span>
          </div>
        </div>

        {/* Search & Filter panel */}
        <div className="shrink-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          {/* Search box */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">
                search
              </span>
              <input
                type="text"
                placeholder="Search by patient name, phone number or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-11 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-900 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 sm:p-5 grid gap-6 xl:grid-cols-2">
            {/* Status: select / unselect chips */}
            <div>
              <div className="flex items-center gap-3 mb-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Verification status
                </span>
                {selectedStatuses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedStatuses([])}
                    className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStatuses([])}
                  aria-pressed={selectedStatuses.length === 0}
                  className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-full border text-xs font-medium transition-colors ${
                    selectedStatuses.length === 0
                      ? 'bg-slate-800 border-slate-800 text-white dark:bg-slate-200 dark:border-slate-200 dark:text-slate-900'
                      : CHIP_IDLE_CLASS
                  }`}
                >
                  <span className="material-symbols-outlined text-base">select_all</span>
                  All
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    selectedStatuses.length === 0
                      ? 'bg-white/20 dark:bg-slate-900/15'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    {dateAndSearchFiltered.length}
                  </span>
                </button>

                {STATUS_OPTIONS.map(option => {
                  const isSelected = selectedStatuses.includes(option.key);
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => toggleStatus(option.key)}
                      aria-pressed={isSelected}
                      title={isSelected ? `Unselect ${option.label}` : `Select ${option.label}`}
                      className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-full border text-xs font-medium transition-colors ${
                        isSelected ? option.activeClass : CHIP_IDLE_CLASS
                      }`}
                    >
                      {isSelected ? (
                        <span className="material-symbols-outlined text-base">check</span>
                      ) : (
                        <span className={`h-2 w-2 rounded-full ${option.dotClass}`} />
                      )}
                      {option.label}
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        isSelected ? 'bg-white/20 dark:bg-slate-900/15' : 'bg-slate-100 dark:bg-slate-800'
                      }`}>
                        {statusCounts[option.key]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Appointment date range */}
            <div className="xl:border-l xl:border-slate-100 xl:dark:border-slate-800 xl:pl-6">
              <div className="flex items-center gap-3 mb-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Appointment date range
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">{dateRangeLabel()}</span>
                {hasDateFilter && (
                  <button
                    type="button"
                    onClick={clearDateRange}
                    className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                  <label htmlFor="appointment-date-from" className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    From
                  </label>
                  <input
                    id="appointment-date-from"
                    type="date"
                    value={toInputDate(dateRange.from)}
                    max={toInputDate(dateRange.to) || undefined}
                    onChange={(e) => setRangeStart(e.target.value)}
                    className="w-[130px] bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>

                <span className="material-symbols-outlined text-lg text-slate-400">arrow_right_alt</span>

                <div className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                  <label htmlFor="appointment-date-to" className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    To
                  </label>
                  <input
                    id="appointment-date-to"
                    type="date"
                    value={toInputDate(dateRange.to)}
                    min={toInputDate(dateRange.from) || undefined}
                    onChange={(e) => setRangeEnd(e.target.value)}
                    className="w-[130px] bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>

                <Popover.Root open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <Popover.Trigger asChild>
                    <button
                      type="button"
                      aria-label="Pick a date range on the calendar"
                      title="Pick on calendar"
                      className="h-11 w-11 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">calendar_month</span>
                    </button>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content
                      className="z-50 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-4"
                      sideOffset={8}
                      align="start"
                    >
                      <DayPicker
                        mode="range"
                        selected={dateRange}
                        defaultMonth={dateRange.from}
                        onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                        numberOfMonths={2}
                        className="!font-sans"
                      />
                      <Popover.Arrow className="fill-white dark:fill-slate-900" />
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              </div>

              {/* Quick ranges */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {[
                  { label: 'Today', get: () => ({ from: new Date(), to: new Date() }) },
                  { label: 'Next 7 days', get: () => ({ from: new Date(), to: addDays(new Date(), 7) }) },
                  { label: 'Next 30 days', get: () => ({ from: new Date(), to: addDays(new Date(), 30) }) },
                  { label: 'This month', get: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
                  { label: '-3 / +3 months', get: () => ({ from: subMonths(new Date(), 3), to: addMonths(new Date(), 3) }) },
                ].map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      const { from, to } = preset.get();
                      applyPreset(from, to);
                    }}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Result summary */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Showing{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {filteredAppointments.filter(a => a.appointment).length}
            </span>{' '}
            appointment{filteredAppointments.filter(a => a.appointment).length !== 1 ? 's' : ''}
            {filteredAppointments.filter(a => !a.appointment).length > 0 && (
              <> · {filteredAppointments.filter(a => !a.appointment).length} patient without an appointment</>
            )}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-base">filter_alt_off</span>
              Clear all filters
            </button>
          )}
        </div>

        {/* Unified Appointments Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Appointment Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map((item, index) => {
                    const status = getVerificationStatus(item.patient);
                    const relativeDate = item.appointment ? formatRelativeDate(item.appointment.date) : '';
                    return (
                      <tr key={index} onClick={() => onSelectPatient?.(item.patient.id)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                        <td className="px-6 py-4">
                          {item.appointment ? (
                            <>
                              <div className="text-sm font-medium text-slate-900 dark:text-white">
                                {format(parseISO(item.appointment.date), 'EEE, MMM d, yyyy')}
                              </div>
                              {relativeDate && (
                                <div className="text-xs text-slate-500 dark:text-slate-400">{relativeDate}</div>
                              )}
                            </>
                          ) : (
                            <div className="text-sm text-slate-400 dark:text-slate-500 italic">No appointment</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {item.appointment ? (
                            <div className="text-sm font-medium text-slate-900 dark:text-white">{item.appointment.time}</div>
                          ) : (
                            <div className="text-sm text-slate-400 dark:text-slate-500">—</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {highlightMatch(getPatientName(item.patient), searchQuery)}
                          </div>
                          {(() => {
                            const matchField = getSearchMatchField(item.patient, searchQuery);
                            if (matchField === 'phone') {
                              return (
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {highlightMatch(getPatientPhone(item.patient), searchQuery)}
                                </div>
                              );
                            }
                            if (matchField === 'email') {
                              return (
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {highlightMatch(getPatientEmail(item.patient), searchQuery)}
                                </div>
                              );
                            }
                            return item.appointment ? (
                              <div className="text-xs text-slate-500">Dr. {item.appointment.provider}</div>
                            ) : null;
                          })()}
                        </td>
                        <td className="px-6 py-4">
                          {item.appointment ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {item.appointment.type}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400 dark:text-slate-500">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <VerificationStepper
                            status={getEffectiveVerificationStatus(item.patient)}
                            layout="table"
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">
                        search_off
                      </span>
                      <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                        {hasActiveFilters ? 'No patients match your filters' : 'No appointments found'}
                      </p>
                      {hasActiveFilters && (
                        <>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Try a different search term, or widen the status and date filters.
                          </p>
                          <button
                            type="button"
                            onClick={clearAllFilters}
                            className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">filter_alt_off</span>
                            Clear all filters
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PatientGuide;
