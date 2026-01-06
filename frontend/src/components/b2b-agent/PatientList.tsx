import React, { useState, useMemo } from 'react';
import { Patient, FilterType } from '@/types/patient';
import { VERIFICATION_STATUS_LABELS } from '@/constants/verificationStatus';

type SortField = 'name' | 'appointment' | 'type' | 'status';
type SortDirection = 'asc' | 'desc';

interface PatientListProps {
  patients: Patient[];
  selectedPatientId: string | null;
  searchQuery: string;
  activeFilters: string[];
  onSelectPatient: (id: string) => void;
  onSearchChange: (query: string) => void;
  onRemoveFilter: (filter: string) => void;
  onAddFilter: (filter: FilterType) => void;
  isAdmin?: boolean;
  onBackToScheduleJobs?: () => void;
}

const PatientList: React.FC<PatientListProps> = ({
  patients,
  selectedPatientId,
  searchQuery,
  activeFilters,
  onSelectPatient,
  onSearchChange,
  onRemoveFilter,
  onAddFilter,
  isAdmin = false,
  onBackToScheduleJobs,
}) => {
  const [sortField, setSortField] = useState<SortField>('appointment');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const toggleFilter = (filter: FilterType) => {
    if (activeFilters.includes(filter)) {
      onRemoveFilter(filter);
    } else {
      onAddFilter(filter);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getFullName = (patient: Patient) => {
    const given = patient.name.given.join(' ');
    return `${given} ${patient.name.family}`.trim();
  };

  const getInitials = (patient: Patient) => {
    const given = patient.name.given[0] || '';
    const family = patient.name.family || '';
    return `${given.charAt(0)}${family.charAt(0)}`.toUpperCase();
  };

  const getVerificationStatus = (patient: Patient) => {
    if (!patient.verificationStatus) {
      return { text: VERIFICATION_STATUS_LABELS.NOT_STARTED, color: 'text-slate-400', step: 0, percentage: 0 };
    }

    const { fetchPMS, documentAnalysis, apiVerification, callCenter, saveToPMS } = patient.verificationStatus;

    if (saveToPMS === 'completed') {
      return { text: VERIFICATION_STATUS_LABELS.COMPLETED, color: 'text-status-green', step: 5, percentage: 100 };
    }
    if (saveToPMS === 'in_progress') {
      return { text: VERIFICATION_STATUS_LABELS.SAVE_TO_PMS, color: 'text-primary', step: 5, percentage: 90 };
    }
    if (callCenter === 'completed') {
      return { text: VERIFICATION_STATUS_LABELS.SAVE_TO_PMS, color: 'text-status-orange', step: 4, percentage: 80 };
    }
    if (callCenter === 'in_progress') {
      return { text: VERIFICATION_STATUS_LABELS.CALL_CENTER, color: 'text-primary', step: 4, percentage: 70 };
    }
    if (apiVerification === 'completed') {
      return { text: VERIFICATION_STATUS_LABELS.CALL_CENTER, color: 'text-status-orange', step: 3, percentage: 60 };
    }
    if (apiVerification === 'in_progress') {
      return { text: VERIFICATION_STATUS_LABELS.API_VERIFICATION, color: 'text-primary', step: 3, percentage: 50 };
    }
    if (documentAnalysis === 'completed') {
      return { text: VERIFICATION_STATUS_LABELS.API_VERIFICATION, color: 'text-status-orange', step: 2, percentage: 40 };
    }
    if (documentAnalysis === 'in_progress') {
      return { text: VERIFICATION_STATUS_LABELS.DOCUMENT_ANALYSIS, color: 'text-primary', step: 2, percentage: 30 };
    }
    if (fetchPMS === 'completed') {
      return { text: VERIFICATION_STATUS_LABELS.DOCUMENT_ANALYSIS, color: 'text-status-orange', step: 1, percentage: 20 };
    }
    if (fetchPMS === 'in_progress') {
      return { text: VERIFICATION_STATUS_LABELS.FETCH_PMS, color: 'text-primary', step: 1, percentage: 10 };
    }

    return { text: VERIFICATION_STATUS_LABELS.NOT_STARTED, color: 'text-slate-400', step: 0, percentage: 0 };
  };

  const getNextAppointment = (patient: Patient) => {
    if (!patient.appointments || patient.appointments.length === 0) {
      return null;
    }

    const now = new Date();
    const upcomingAppointments = patient.appointments
      .filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= now && apt.status === 'scheduled';
      })
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });

    return upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;
  };

  const formatAppointmentDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getVerificationStatusLabel = (patient: Patient) => {
    if (!patient.verificationStatus) {
      return { label: VERIFICATION_STATUS_LABELS.NOT_STARTED, color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' };
    }

    const { fetchPMS, documentAnalysis, apiVerification, callCenter, saveToPMS } = patient.verificationStatus;

    if (saveToPMS === 'completed') {
      return { label: VERIFICATION_STATUS_LABELS.COMPLETED, color: 'bg-status-green/10 text-status-green' };
    }
    if (
      fetchPMS === 'in_progress' ||
      documentAnalysis === 'in_progress' ||
      apiVerification === 'in_progress' ||
      callCenter === 'in_progress' ||
      saveToPMS === 'in_progress'
    ) {
      return { label: VERIFICATION_STATUS_LABELS.IN_PROGRESS, color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' };
    }
    if (
      fetchPMS === 'completed' ||
      documentAnalysis === 'completed' ||
      apiVerification === 'completed' ||
      callCenter === 'completed'
    ) {
      return { label: VERIFICATION_STATUS_LABELS.PENDING, color: 'bg-status-orange/10 text-status-orange' };
    }
    return { label: VERIFICATION_STATUS_LABELS.NOT_STARTED, color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' };
  };

  // Sort patients based on selected field and direction
  const sortedPatients = useMemo(() => {
    const sorted = [...patients].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = getFullName(a).localeCompare(getFullName(b));
          break;

        case 'appointment': {
          const aptA = getNextAppointment(a);
          const aptB = getNextAppointment(b);

          // Patients without appointments go to the end
          if (!aptA && !aptB) comparison = 0;
          else if (!aptA) comparison = 1;
          else if (!aptB) comparison = -1;
          else {
            const dateA = new Date(aptA.date + ' ' + aptA.time);
            const dateB = new Date(aptB.date + ' ' + aptB.time);
            comparison = dateA.getTime() - dateB.getTime();
          }
          break;
        }

        case 'type': {
          const aptA = getNextAppointment(a);
          const aptB = getNextAppointment(b);
          const typeA = aptA?.type || '';
          const typeB = aptB?.type || '';
          comparison = typeA.localeCompare(typeB);
          break;
        }

        case 'status': {
          const statusA = getVerificationStatusLabel(a).label;
          const statusB = getVerificationStatusLabel(b).label;
          comparison = statusA.localeCompare(statusB);
          break;
        }
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [patients, sortField, sortDirection]);

  return (
    <aside className="flex w-full flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 lg:w-[20%] lg:shrink-0">
      {/* Search and Filters */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        {/* Back to Scheduled Jobs Button */}
        {onBackToScheduleJobs && (
          <button
            onClick={onBackToScheduleJobs}
            className="mb-3 px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 w-full justify-center"
            title="Back to Scheduled Jobs"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Schedule
          </button>
        )}

        <label className="flex flex-col min-w-40 h-10 w-full">
          <div className="flex w-full flex-1 items-stretch rounded-md h-full">
            <div className="text-slate-400 flex border border-r-0 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 items-center justify-center pl-3 rounded-l-md">
              <span className="material-symbols-outlined text-lg">search</span>
            </div>
            <input
              className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-md text-slate-900 dark:text-white focus:outline-0 focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-600 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 h-full placeholder:text-slate-400 px-4 rounded-l-none border-l-0 pl-2 text-sm font-normal leading-normal"
              placeholder="Search by name"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </label>

        {/* Filter Chips - Only visible for admin */}
        {isAdmin && (
          <div className="flex gap-2 pt-3 overflow-x-auto pb-1">
            {/* Active/Inactive Filters */}
            <button
              onClick={() => toggleFilter('Active')}
              className={`flex h-7 shrink-0 items-center justify-center px-3 rounded-md text-xs font-medium transition-colors ${
                activeFilters.includes('Active')
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => toggleFilter('Inactive')}
              className={`flex h-7 shrink-0 items-center justify-center px-3 rounded-md text-xs font-medium transition-colors ${
                activeFilters.includes('Inactive')
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              Inactive
            </button>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 self-center mx-1"></div>

            {/* Verification Step Filters */}
            <button
              onClick={() => toggleFilter('Eligibility')}
              className={`flex h-7 shrink-0 items-center justify-center px-3 rounded-md text-xs font-medium transition-colors ${
                activeFilters.includes('Eligibility')
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              Eligibility
            </button>
            <button
              onClick={() => toggleFilter('Verification')}
              className={`flex h-7 shrink-0 items-center justify-center px-3 rounded-md text-xs font-medium transition-colors ${
                activeFilters.includes('Verification')
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              Verification
            </button>

          </div>
        )}
      </div>

      {/* Column Headers */}
      <div className="px-2 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleSort('appointment')}
            className="w-20 flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide hover:text-slate-900 dark:hover:text-white transition-colors text-left"
          >
            Date/Time
            {sortField === 'appointment' && (
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
              </span>
            )}
          </button>
          <button
            onClick={() => handleSort('name')}
            className="flex-1 flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide hover:text-slate-900 dark:hover:text-white transition-colors text-left pl-9"
          >
            Patient
            {sortField === 'name' && (
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
              </span>
            )}
          </button>
          <button
            onClick={() => handleSort('type')}
            className="w-16 flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide hover:text-slate-900 dark:hover:text-white transition-colors text-left"
          >
            Type
            {sortField === 'type' && (
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
              </span>
            )}
          </button>
          <button
            onClick={() => handleSort('status')}
            className="w-16 flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide hover:text-slate-900 dark:hover:text-white transition-colors text-left"
          >
            Status
            {sortField === 'status' && (
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Patient List */}
      <div className="flex-1 overflow-y-auto">
        {sortedPatients.map((patient) => {
          const fullName = getFullName(patient);
          const verificationStatus = getVerificationStatus(patient);
          const isSelected = selectedPatientId === patient.id;
          const nextAppointment = getNextAppointment(patient);

          return (
            <div
              key={patient.id}
              onClick={() => onSelectPatient(patient.id)}
              className={`cursor-pointer px-2 py-2.5 border-b border-slate-100 dark:border-slate-800 ${
                isSelected
                  ? 'bg-slate-100 dark:bg-slate-800 border-l-2 border-l-slate-900 dark:border-l-white'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {/* Multi-Column Layout */}
              <div className="flex items-center gap-1">
                {/* Checkbox - Always First */}
                <div className={`flex items-center justify-center shrink-0 w-3 h-3 rounded border transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-slate-900 dark:bg-white dark:border-white'
                    : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {isSelected && (
                    <span className="material-symbols-outlined text-white dark:text-slate-900" style={{ fontSize: '8px' }}>check</span>
                  )}
                </div>

                {/* Column 1: Next Appointment Date/Time */}
                <div className="w-20 shrink-0">
                  {nextAppointment ? (
                    <div>
                      <div className="text-[10px] font-medium text-slate-900 dark:text-white">
                        {formatAppointmentDate(nextAppointment.date)}
                      </div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400">
                        {nextAppointment.time}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[9px] text-slate-400 dark:text-slate-600">
                      No appt
                    </div>
                  )}
                </div>

                {/* Column 2: Patient Info */}
                <div className="flex-1 flex items-center gap-1.5 min-w-0">
                  <div className={`rounded-full h-7 w-7 flex items-center justify-center shrink-0 ${
                    verificationStatus.percentage === 100
                      ? 'bg-status-green/20'
                      : verificationStatus.percentage >= 50
                        ? 'bg-status-orange/20'
                        : 'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    <span className={`text-[10px] font-medium ${
                      verificationStatus.percentage === 100
                        ? 'text-status-green'
                        : verificationStatus.percentage >= 50
                          ? 'text-status-orange'
                          : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {getInitials(patient)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 dark:text-white text-[11px] font-medium truncate">
                      {fullName}
                    </p>
                  </div>
                </div>

                {/* Column 3: Appointment Type */}
                <div className="w-16 shrink-0">
                  {nextAppointment ? (
                    <div className="text-[9px] text-slate-600 dark:text-slate-400 truncate" title={nextAppointment.type}>
                      {nextAppointment.type}
                    </div>
                  ) : (
                    <div className="text-[9px] text-slate-400 dark:text-slate-600">
                      -
                    </div>
                  )}
                </div>

                {/* Column 4: Verification Status */}
                <div className="w-16 shrink-0">
                  <div className="flex flex-col gap-1">
                    {/* Percentage */}
                    <div className={`text-[9px] font-semibold text-center ${verificationStatus.color}`}>
                      {verificationStatus.percentage}%
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          verificationStatus.percentage === 100
                            ? 'w-full bg-status-green'
                            : verificationStatus.percentage > 0
                            ? 'bg-blue-500'
                            : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                        style={verificationStatus.percentage === 100 ? {} : { width: `${verificationStatus.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default PatientList;
