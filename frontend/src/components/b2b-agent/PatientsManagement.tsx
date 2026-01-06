import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import PatientGuide from './PatientGuide';
import Header from '@/components/Header';
import patientsDataMockup from '@mockupdata/patients.json';
import type { Patient as PatientType } from '@/types/patient';
import { useToast } from '@/hooks/use-toast';

const mockupPatients = Array.isArray(patientsDataMockup) ? patientsDataMockup : (patientsDataMockup as any).default || [];

const PatientsManagement: React.FC = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [patients, setPatients] = useState<PatientType[]>(mockupPatients);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useDatabase, setUseDatabase] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    givenName: '',
    familyName: '',
    gender: '',
    birthDate: '',
    ssn: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    appointmentDate: '',
    appointmentTime: '',
    appointmentType: '',
    appointmentProvider: '',
  });
  const [isFetchingPMS, setIsFetchingPMS] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/verify');
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);

        // If user has dataSource, use database
        if (data.user.dataSource) {
          setUseDatabase(true);
          await fetchPatientsFromDatabase();
        } else {
          // Use mockup data
          setPatients(mockupPatients);
          setIsLoading(false);
        }
      } else if (response.status === 401) {
        // Unauthorized - redirect to login
        navigate('/');
      } else {
        // Other errors - use mockup data
        setPatients(mockupPatients);
        setIsLoading(false);
      }
    } catch (error) {
      // On error, redirect to login
      navigate('/');
    }
  };

  const fetchPatientsFromDatabase = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/patients');
      if (response.ok) {
        const data = await response.json();
        // Server already sends data in the correct format with proper transformations
        setPatients(data.patients);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient: {
            givenName: formData.givenName,
            familyName: formData.familyName,
            gender: formData.gender,
            birthDate: formData.birthDate,
            ssn: formData.ssn,
            active: true
          },
          telecoms: [
            formData.phone ? { system: 'phone', value: formData.phone } : null,
            formData.email ? { system: 'email', value: formData.email } : null
          ].filter(Boolean),
          addresses: formData.addressLine1 ? [{
            line1: formData.addressLine1,
            line2: formData.addressLine2,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode
          }] : [],
          appointments: formData.appointmentDate && formData.appointmentTime && formData.appointmentType ? [{
            date: formData.appointmentDate,
            time: formData.appointmentTime,
            type: formData.appointmentType,
            status: 'scheduled',
            provider: formData.appointmentProvider || 'Dr. Smith'
          }] : [],
          treatments: [],
          verificationStatus: {
            fetchPMS: 'pending',
            documentAnalysis: 'pending',
            apiVerification: 'pending',
            callCenter: 'pending',
            saveToPMS: 'pending'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create patient');
      }

      setShowCreateModal(false);
      setFormData({
        givenName: '',
        familyName: '',
        gender: '',
        birthDate: '',
        ssn: '',
        phone: '',
        email: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        appointmentDate: '',
        appointmentTime: '',
        appointmentType: '',
        appointmentProvider: '',
      });

      // Refresh patient list
      await fetchPatientsFromDatabase();

      toast({
        variant: "success",
        title: "Patient created successfully",
        description: "The new patient has been added to the system.",
      });
    } catch (error: any) {
      toast({
        variant: "error",
        title: "Error creating patient",
        description: error.message,
      });
    }
  };

  const calculateVerificationStats = () => {
    let verified = 0;
    let inProgress = 0;
    let pending = 0;
    let notStarted = 0;

    patients.forEach(patient => {
      if (!patient.verificationStatus) {
        notStarted++;
        return;
      }

      const { fetchPMS, documentAnalysis, apiVerification, callCenter, saveToPMS } = patient.verificationStatus;

      // Fully verified
      if (saveToPMS === 'completed') {
        verified++;
      }
      // In progress (any step in progress)
      else if (
        fetchPMS === 'in_progress' ||
        documentAnalysis === 'in_progress' ||
        apiVerification === 'in_progress' ||
        callCenter === 'in_progress' ||
        saveToPMS === 'in_progress'
      ) {
        inProgress++;
      }
      // Pending (at least one step completed but not all)
      else if (
        fetchPMS === 'completed' ||
        documentAnalysis === 'completed' ||
        apiVerification === 'completed' ||
        callCenter === 'completed'
      ) {
        pending++;
      }
      // Not started
      else {
        notStarted++;
      }
    });

    return { verified, inProgress, pending, notStarted };
  };

  const verificationStats = calculateVerificationStats();

  const handleHeaderClick = () => {
    navigate('/b2b-agent/patient-appointments');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      navigate('/');
    } catch (error) {
    }
  };

  const handleSelectPatient = (patientId: string) => {
    // Navigate to patient detail page
    navigate(`/b2b-agent/patient-detail?patientId=${patientId}`);
  };

  const handleFetchPMS = async () => {
    try {
      setIsFetchingPMS(true);
      const response = await fetch('/api/patients/fetch-pms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch PMS data');
      }

      const data = await response.json();

      // Refresh patient list
      await fetchPatientsFromDatabase();

      toast({
        variant: "success",
        title: "PMS data fetched successfully",
        description: data.patientsCreated
          ? `Successfully created ${data.patientsCreated} patients with upcoming appointments!`
          : "Patient data has been synchronized.",
      });
    } catch (error: any) {
      toast({
        variant: "error",
        title: "Failed to fetch PMS data",
        description: error.message || 'An error occurred while fetching PMS data',
      });
    } finally {
      setIsFetchingPMS(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-slate-400">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col">
      {/* Header */}
      <Header
        onLogoClick={handleHeaderClick}
        currentUser={currentUser ? {
          name: currentUser.username,
          email: currentUser.email,
          username: currentUser.username,
          dataSource: currentUser.dataSource
        } : null}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden relative">
        {/* Buttons - Only show if using database */}
        {useDatabase && (
          <div className="absolute top-4 right-4 z-10 flex gap-3">
            <button
              onClick={handleFetchPMS}
              disabled={isFetchingPMS}
              className="px-3 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-sm rounded-lg font-medium flex items-center gap-1.5 shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFetchingPMS ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">cloud_download</span>
                  <span>Fetch PMS</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-slate-900 text-sm  dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg font-medium flex items-center gap-2 shadow-lg transition-colors"
            >
              <span className="material-symbols-outlined">add</span>
              <span>New </span>
            </button>
          </div>
        )}

        <PatientGuide
          totalPatients={patients.length}
          verificationStats={verificationStats}
          patients={patients}
          onSelectPatient={handleSelectPatient}
        />
      </main>

      {/* Create Patient Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Create New Patient</h2>
            <form onSubmit={handleCreatePatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Patient ID</label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Auto-generated (e.g., P0000001)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={formData.givenName}
                    onChange={(e) => setFormData({ ...formData, givenName: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={formData.familyName}
                    onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Birth Date</label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    SSN <span className="text-xs text-orange-600">(HIPAA Protected - Will be encrypted)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ssn}
                    onChange={(e) => setFormData({ ...formData, ssn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="XXX-XX-XXXX"
                    maxLength={11}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="patient@example.com"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address Line 1</label>
                  <input
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="123 Main St"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Apt 4B"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="CA"
                    maxLength={2}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="90210"
                  />
                </div>

                {/* Appointment Information */}
                <div className="col-span-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Appointment Information</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Appointment Date</label>
                  <input
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Appointment Time</label>
                  <input
                    type="time"
                    value={formData.appointmentTime}
                    onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Appointment Type</label>
                  <select
                    value={formData.appointmentType}
                    onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="">Select Type</option>
                    <option value="Routine Cleaning">Routine Cleaning</option>
                    <option value="Dental Exam">Dental Exam</option>
                    <option value="X-Ray">X-Ray</option>
                    <option value="Filling">Filling</option>
                    <option value="Root Canal">Root Canal</option>
                    <option value="Crown">Crown</option>
                    <option value="Extraction">Extraction</option>
                    <option value="Whitening">Whitening</option>
                    <option value="Consultation">Consultation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Provider Name</label>
                  <input
                    type="text"
                    value={formData.appointmentProvider}
                    onChange={(e) => setFormData({ ...formData, appointmentProvider: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Dr. Smith"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                >
                  Create Patient
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientsManagement;
