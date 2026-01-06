import React from 'react';
import { Patient } from '@/types/patient';
import { VERIFICATION_STATUS_LABELS } from '@/constants/verificationStatus';

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
}

const PatientGuide: React.FC<PatientGuideProps> = ({
  totalPatients: _totalPatients = 0,
  verificationStats: _verificationStats = { verified: 0, inProgress: 0, pending: 0, notStarted: 0 },
  onAddNewPatient: _onAddNewPatient,
  patients = [],
  onSelectPatient
}) => {

  // Get upcoming appointments from all patients
  const getUpcomingAppointments = () => {
    // Get start of today (00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allAppointments: Array<{ patient: Patient, appointment: any }> = [];

    patients.forEach(patient => {
      if (patient.appointments) {
        patient.appointments.forEach(apt => {
          const aptDate = new Date(apt.date);
          aptDate.setHours(0, 0, 0, 0);
          // Show appointments from today onwards
          if (aptDate >= today && apt.status === 'scheduled') {
            allAppointments.push({ patient, appointment: apt });
          }
        });
      }
    });

    // Sort by date (earliest first)
    allAppointments.sort((a, b) => {
      const dateA = new Date(a.appointment.date);
      const dateB = new Date(b.appointment.date);
      return dateA.getTime() - dateB.getTime();
    });

    return allAppointments.slice(0, 8); // Show up to 8 upcoming appointments
  };

  // Get past appointments from all patients
  const getPastAppointments = () => {
    // Get start of today (00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allAppointments: Array<{ patient: Patient, appointment: any }> = [];

    patients.forEach(patient => {
      if (patient.appointments) {
        patient.appointments.forEach(apt => {
          const aptDate = new Date(apt.date);
          aptDate.setHours(0, 0, 0, 0);
          // Show appointments from yesterday and before (before today)
          if (aptDate < today) {
            allAppointments.push({ patient, appointment: apt });
          }
        });
      }
    });

    // Sort by date (most recent first)
    allAppointments.sort((a, b) => {
      const dateA = new Date(a.appointment.date);
      const dateB = new Date(b.appointment.date);
      return dateB.getTime() - dateA.getTime();
    });

    return allAppointments.slice(0, 8); // Show up to 8 past appointments
  };

  const getPatientName = (patient: Patient) => {
    const given = patient.name.given.join(' ');
    return `${given} ${patient.name.family}`.trim();
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

    // Format as "Mon, Jan 15"
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getVerificationStatus = (patient: Patient) => {
    if (!patient.verificationStatus) {
      return { label: VERIFICATION_STATUS_LABELS.NOT_STARTED, color: 'text-slate-600 dark:text-slate-400', percentage: 0 };
    }

    const { fetchPMS, documentAnalysis, apiVerification, callCenter, saveToPMS } = patient.verificationStatus;

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

  const upcomingAppointments = getUpcomingAppointments();
  const pastAppointments = getPastAppointments();



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

        {/* Bottom Section: Appointments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Upcoming Appointments */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-[700px]">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl text-blue-600 dark:text-blue-400">event</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Upcoming Patient Appointment</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{upcomingAppointments.length} scheduled</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map((item: any, index: number) => {
                      const status = getVerificationStatus(item.patient);
                      return (
                        <tr key={index} onClick={() => onSelectPatient?.(item.patient.id)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-slate-900 dark:text-white">{formatAppointmentDate(item.appointment.date)}</div>
                            <div className="text-xs text-slate-500">{item.appointment.time}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-slate-900 dark:text-white">{getPatientName(item.patient)}</div>
                            <div className="text-xs text-slate-500">Dr. {item.appointment.provider}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {item.appointment.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full w-20 overflow-hidden">
                                <div className={`h-full rounded-full ${status.percentage === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${status.percentage}%` }}></div>
                              </div>
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{status.percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">No upcoming appointments found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Past Appointments */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-[700px]">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl text-slate-600 dark:text-slate-400">history</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Past Appointments Appointment</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{pastAppointments.length} completed</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pastAppointments.length > 0 ? (
                    pastAppointments.map((item, index) => {
                      const status = getVerificationStatus(item.patient);
                      return (
                        <tr key={index} onClick={() => onSelectPatient?.(item.patient.id)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-slate-900 dark:text-white">{new Date(item.appointment.date).toLocaleDateString()}</div>
                            <div className="text-xs text-slate-500">{item.appointment.time}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-slate-900 dark:text-white">{getPatientName(item.patient)}</div>
                            <div className="text-xs text-slate-500">Dr. {item.appointment.provider}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {item.appointment.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full w-20 overflow-hidden">
                                <div className={`h-full rounded-full ${status.percentage === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${status.percentage}%` }}></div>
                              </div>
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{status.percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">No past appointments found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default PatientGuide;
