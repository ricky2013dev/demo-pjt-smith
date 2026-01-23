import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import PatientGuide from './PatientGuide';
import Header from '@/components/Header';
import CreatePatientModal from './CreatePatientModal';
import patientsDataMockup from '@mockupdata/patients.json';
import type { Patient as PatientType } from '@/types/patient';
import { useToast } from '@/hooks/use-toast';
import { useStediApi } from '@/context/StediApiContext';

const mockupPatients = Array.isArray(patientsDataMockup) ? patientsDataMockup : (patientsDataMockup as any).default || [];

const PatientsManagement: React.FC = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { syncWithUser } = useStediApi();
  const [patients, setPatients] = useState<PatientType[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useDatabase, setUseDatabase] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isFetchingPMS, setIsFetchingPMS] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/verify', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);

        // Sync Stedi API state with user setting
        if (data.user.stediEnabled !== undefined) {
          syncWithUser(data.user.stediEnabled);
        }

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
      const response = await fetch('/api/patients', {
        credentials: 'include'
      });
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

  interface CreatePatientFormData {
    givenName: string;
    familyName: string;
    gender: string;
    birthDate: string;
    ssn: string;
    phone: string;
    email: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    insuranceType: 'Primary' | 'Secondary' | '';
    insuranceProvider: string;
    payerId: string;
    policyNumber: string;
    groupNumber: string;
    subscriberName: string;
    subscriberId: string;
    relationship: string;
    effectiveDate: string;
    expirationDate: string;
    appointmentDate: string;
    appointmentTime: string;
    appointmentType: string;
    appointmentProvider: string;
  }

  const handleCreatePatient = async (formData: CreatePatientFormData) => {
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
          insurances: formData.insuranceProvider ? [{
            type: formData.insuranceType || 'Primary',
            provider: formData.insuranceProvider,
            payerId: formData.payerId,
            policyNumber: formData.policyNumber,
            groupNumber: formData.groupNumber,
            subscriberName: formData.subscriberName,
            subscriberId: formData.subscriberId,
            relationship: formData.relationship,
            effectiveDate: formData.effectiveDate,
            expirationDate: formData.expirationDate
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
      throw error; // Re-throw to let the modal handle the error state
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
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
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
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
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
          dataSource: currentUser.dataSource,
          stediEnabled: currentUser.stediEnabled
        } : null}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden relative">
        {/* Fetch PMS Button - Only show if using database */}
        {/* {useDatabase && (
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
                  <span>PMS</span>
                </>
              )}
            </button>
          </div>
        )} */}

        <PatientGuide
          totalPatients={patients.length}
          verificationStats={verificationStats}
          patients={patients}
          onSelectPatient={handleSelectPatient}
          showAddButton={useDatabase}
          onAddNewPatient={() => setShowCreateModal(true)}
          currentUser={currentUser}
        />
      </main>

      {/* Create Patient Modal */}
      <CreatePatientModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreatePatient}
        currentUser={currentUser}
      />
    </div>
  );
};

export default PatientsManagement;
