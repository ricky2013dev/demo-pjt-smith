import React, { useState, useMemo, useEffect } from 'react';
import { Patient } from '@/types/patient';
import { VERIFICATION_STATUS_LABELS } from '@/constants/verificationStatus';
import { DayPicker } from 'react-day-picker';
import { format, subMonths, addMonths, isWithinInterval, parseISO } from 'date-fns';
import * as Popover from '@radix-ui/react-popover';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import 'react-day-picker/style.css';
import { deriveVerificationStatusFromTransactions, type Transaction, type VerificationStatus } from '@/utils/transactionStatus';
import VerificationStepper from '@/components/VerificationStepper';

interface PatientGuideProps {
  totalPatients?: number;
  verificationStats?: {
    verified: number;
    inProgress: number;
    pending: number;
    notStarted: number;
  };
  onAddNewPatient?: () => void;
  patients?: Patient[];
  onSelectPatient?: (patientId: string) => void;
  showAddButton?: boolean;
  currentUser?: { dataSource?: string } | null;
}

const PatientGuide: React.FC<PatientGuideProps> = ({
  totalPatients: _totalPatients = 0,
  verificationStats: _verificationStats = { verified: 0, inProgress: 0, pending: 0, notStarted: 0 },
  onAddNewPatient,
  patients = [],
  onSelectPatient,
  showAddButton = false,
  currentUser = null
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<Array<'not_started' | 'in_progress' | 'completed'>>([]);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subMonths(new Date(), 3),
    to: addMonths(new Date(), 3)
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Fetch transactions when in Data Mode
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!currentUser?.dataSource) {
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
  }, [currentUser?.dataSource]);

  // Derive verification status for each patient based on transactions (Data Mode)
  const patientVerificationStatusMap = useMemo(() => {
    const statusMap: Record<string, VerificationStatus> = {};

    if (currentUser?.dataSource && transactions.length > 0) {
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
  }, [currentUser?.dataSource, transactions]);

  // Get effective verification status for a patient
  const getEffectiveVerificationStatus = (patient: Patient): VerificationStatus | undefined => {
    // If in Data Mode and we have derived status from transactions, use that
    if (currentUser?.dataSource && patientVerificationStatusMap[patient.id]) {
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

  // Toggle status filter selection
  const toggleStatus = (status: 'not_started' | 'in_progress' | 'completed', checked: boolean) => {
    if (checked) {
      setSelectedStatuses(prev => [...prev, status]);
    } else {
      setSelectedStatuses(prev => prev.filter(s => s !== status));
    }
  };

  // Get status dropdown button label
  const getStatusDropdownLabel = (): string => {
    if (selectedStatuses.length === 0) return 'All Status';
    if (selectedStatuses.length === 1) {
      const status = selectedStatuses[0];
      if (status === 'not_started') return 'Not Started';
      if (status === 'in_progress') return 'In Progress';
      if (status === 'completed') return 'Completed';
    }
    return `${selectedStatuses.length} statuses`;
  };

  // Unified filtered appointments (includes patients without appointments)
  const filteredAppointments = useMemo(() => {
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

    // Status filter
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(item => {
        const status = getEffectiveVerificationStatus(item.patient);

        return selectedStatuses.some(selectedStatus => {
          if (selectedStatus === 'not_started') {
            if (!status) return true;
            const { fetchPMS, documentAnalysis, apiVerification, callCenter, saveToPMS } = status;
            return fetchPMS === 'pending' && documentAnalysis === 'pending' && apiVerification === 'pending' && callCenter === 'pending' && saveToPMS === 'pending';
          }
          if (selectedStatus === 'completed') {
            return status?.saveToPMS === 'completed';
          }
          if (selectedStatus === 'in_progress') {
            if (!status) return false;
            const { fetchPMS, documentAnalysis, apiVerification, callCenter, saveToPMS } = status;
            const isNotStarted = fetchPMS === 'pending' && documentAnalysis === 'pending' && apiVerification === 'pending' && callCenter === 'pending' && saveToPMS === 'pending';
            const isCompleted = saveToPMS === 'completed';
            return !isNotStarted && !isCompleted;
          }
          return false;
        });
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
  }, [patients, dateRange, searchQuery, selectedStatuses, patientVerificationStatusMap, currentUser?.dataSource]);

  const getVerificationStatus = (patient: Patient) => {
    const effectiveStatus = getEffectiveVerificationStatus(patient);
    if (!effectiveStatus) {
      return { label: VERIFICATION_STATUS_LABELS.NOT_STARTED, color: 'text-slate-600 dark:text-slate-400', percentage: 0 };
    }

    const { fetchPMS, documentAnalysis, apiVerification, callCenter, saveToPMS } = effectiveStatus;

    // Fully verified
    if (saveToPMS === 'completed') {
      return { label: VERIFICATION_STATUS_LABELS.COMPLETED, color: 'text-green-600 dark:text-green-400', percentage: 100 };
    }
    if (saveToPMS === 'in_progress') {
      return { label: VERIFICATION_STATUS_LABELS.SAVE_TO_PMS, color: 'text-blue-600 dark:text-blue-400', percentage: 90 };
    }
    if (callCenter === 'completed') {
      return { label: VERIFICATION_STATUS_LABELS.CALL_CENTER, color: 'text-orange-600 dark:text-orange-400', percentage: 80 };
    }
    if (callCenter === 'in_progress') {
      return { label: VERIFICATION_STATUS_LABELS.CALL_CENTER, color: 'text-blue-600 dark:text-blue-400', percentage: 70 };
    }
    if (apiVerification === 'completed') {
      return { label: VERIFICATION_STATUS_LABELS.API_VERIFICATION, color: 'text-orange-600 dark:text-orange-400', percentage: 60 };
    }
    if (apiVerification === 'in_progress') {
      return { label: VERIFICATION_STATUS_LABELS.API_VERIFICATION, color: 'text-blue-600 dark:text-blue-400', percentage: 50 };
    }
    if (documentAnalysis === 'completed') {
      return { label: VERIFICATION_STATUS_LABELS.DOCUMENT_ANALYSIS, color: 'text-orange-600 dark:text-orange-400', percentage: 40 };
    }
    if (documentAnalysis === 'in_progress') {
      return { label: VERIFICATION_STATUS_LABELS.DOCUMENT_ANALYSIS, color: 'text-blue-600 dark:text-blue-400', percentage: 30 };
    }
    if (fetchPMS === 'completed') {
      return { label: VERIFICATION_STATUS_LABELS.FETCH_PMS, color: 'text-orange-600 dark:text-orange-400', percentage: 20 };
    }
    if (fetchPMS === 'in_progress') {
      return { label: VERIFICATION_STATUS_LABELS.FETCH_PMS, color: 'text-blue-600 dark:text-blue-400', percentage: 10 };
    }

    // Not started
    return { label: VERIFICATION_STATUS_LABELS.NOT_STARTED, color: 'text-slate-600 dark:text-slate-400', percentage: 0 };
  };

  return (
    <section className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950 w-full overflow-y-auto font-sans">
      <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">

        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Patient Appointments
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Select a patient from the list to initiate the insurance verification process.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Left: Search and Status Filter */}
          <div className="flex gap-3 flex-1 lg:flex-initial">
            {/* Search Input */}
            <div className="relative flex-1 lg:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="h-11 flex-shrink-0 lg:w-72 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center px-3">
              <DropdownMenu.Root open={isStatusDropdownOpen} onOpenChange={setIsStatusDropdownOpen}>
                <DropdownMenu.Trigger asChild>
                  <button className="flex items-center gap-2 w-full h-full text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 focus:outline-none transition-colors px-1">
                    <div className="flex items-center gap-0.5 flex-1 overflow-hidden min-w-0 h-full">
                      {selectedStatuses.length === 0 ? (
                        <span className="text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap">All Status</span>
                      ) : (
                        selectedStatuses.map(status => (
                          <span
                            key={status}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex-shrink-0 whitespace-nowrap"
                          >
                            {status === 'not_started' && 'Not Started'}
                            {status === 'in_progress' && 'In Progress'}
                            {status === 'completed' && 'Completed'}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleStatus(status, false);
                              }}
                              className="hover:opacity-60 active:opacity-40 transition-opacity flex-shrink-0"
                              style={{ pointerEvents: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px', marginLeft: '-4px' }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '10px', lineHeight: '1' }}>close</span>
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                    <span className="material-symbols-outlined text-xl flex-shrink-0 text-slate-400 dark:text-slate-500">expand_more</span>
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="z-50 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg p-2 min-w-[200px]"
                    sideOffset={8}
                    align="start"
                  >
                    <DropdownMenu.CheckboxItem
                      checked={selectedStatuses.includes('not_started')}
                      onCheckedChange={(checked) => toggleStatus('not_started', checked)}
                      className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {selectedStatuses.includes('not_started') ? 'check_box' : 'check_box_outline_blank'}
                      </span>
                      <span>Not Started</span>
                    </DropdownMenu.CheckboxItem>

                    <DropdownMenu.CheckboxItem
                      checked={selectedStatuses.includes('in_progress')}
                      onCheckedChange={(checked) => toggleStatus('in_progress', checked)}
                      className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {selectedStatuses.includes('in_progress') ? 'check_box' : 'check_box_outline_blank'}
                      </span>
                      <span>In Progress</span>
                    </DropdownMenu.CheckboxItem>

                    <DropdownMenu.CheckboxItem
                      checked={selectedStatuses.includes('completed')}
                      onCheckedChange={(checked) => toggleStatus('completed', checked)}
                      className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {selectedStatuses.includes('completed') ? 'check_box' : 'check_box_outline_blank'}
                      </span>
                      <span>Completed</span>
                    </DropdownMenu.CheckboxItem>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>

          {/* Right: Results Counter, Date Range, and New Patient Button */}
          <div className="flex gap-3 items-center justify-between lg:justify-end flex-wrap lg:flex-nowrap">
            <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
              {filteredAppointments.filter(a => a.appointment).length} appointment{filteredAppointments.filter(a => a.appointment).length !== 1 ? 's' : ''}
              {filteredAppointments.filter(a => !a.appointment).length > 0 && (
                <span className="hidden sm:inline">
                  {' '}· {filteredAppointments.filter(a => !a.appointment).length} without
                </span>
              )}
            </span>

            <Popover.Root open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <Popover.Trigger asChild>
                <button className="h-11 flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap">
                  <span className="material-symbols-outlined text-xl">date_range</span>
                  <span className="text-sm font-medium hidden sm:inline">
                    {dateRange.from && dateRange.to
                      ? `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`
                      : 'Date range'}
                  </span>
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  className="z-50 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-4"
                  sideOffset={8}
                  align="end"
                >
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => {
                        setDateRange({
                          from: subMonths(new Date(), 3),
                          to: addMonths(new Date(), 3)
                        });
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      Default (-3/+3 months)
                    </button>
                    <button
                      onClick={() => {
                        setDateRange({ from: undefined, to: undefined });
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <DayPicker
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                    className="!font-sans"
                  />
                  <Popover.Arrow className="fill-white dark:fill-slate-900" />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            {showAddButton && onAddNewPatient && (
              <button
                onClick={onAddNewPatient}
                className="h-11 flex items-center gap-2 px-5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-xl">add</span>
                <span className="hidden sm:inline">New Patient</span>
              </button>
            )}
          </div>
        </div>

        {/* Unified Appointments Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-[700px]">
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
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      {searchQuery.trim() || dateRange.from || dateRange.to
                        ? 'No appointments match your filters'
                        : 'No appointments found'}
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
