import React, { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import PatientList from './PatientList';
import PatientDetail from './PatientDetail';
import SideNav from './SideNav';
import Header from '@/components/Header';
import { Patient, FilterType, TabType, TAB_TYPES } from '@/types/patient';
import patientsDataMockup from '@mockupdata/patients.json';
import { useStediApi } from '@/context/StediApiContext';
import {
  getSelectedPatientId as getStoredPatientId,
  setSelectedPatientId as storeSelectedPatientId,
  clearSelectedPatientId,
} from '@/utils/selectedPatient';

/** "Given Family", as shown in the side nav and breadcrumb. */
const formatPatientName = (patient: Patient) =>
  `${patient.name.given.join(' ')} ${patient.name.family}`.trim();

const mockupPatients = Array.isArray(patientsDataMockup) ? patientsDataMockup : (patientsDataMockup as any).default || [];

const PatientDetailPage: React.FC = () => {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { syncWithUser } = useStediApi();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useDatabase, setUseDatabase] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>(TAB_TYPES.PATIENT_BASIC_INFO);

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
        if (data.user.stediMode !== undefined) {
          syncWithUser(data.user.stediMode);
        }

        // If stediMode is not 'mockup', use database
        if (data.user.stediMode && data.user.stediMode !== 'mockup') {
          setUseDatabase(true);
          await fetchPatientsFromDatabase();
        } else {
          // Use mockup data
          setUseDatabase(false);
          setPatients(mockupPatients);
          setIsLoading(false);
        }
      } else if (response.status === 401) {
        // Unauthorized - redirect to home page
        navigate('/');
      } else {
        // Other error - use mockup data
        setPatients(mockupPatients);
        setIsLoading(false);
      }
    } catch (error) {
      setPatients(mockupPatients);
      setIsLoading(false);
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

  // Resolve the patient from the URL, falling back to the one selected earlier
  // this session. Without a selection there is nothing to show, so send the user
  // back to the list to pick someone.
  useEffect(() => {
    if (isLoading || patients.length === 0) return;

    const searchParams = new URLSearchParams(search);
    const requestedId = searchParams.get('patientId');

    // An id we cannot resolve (the dashboard's mockup ids while in database mode,
    // a stale link) falls back to the patient selected earlier rather than
    // bouncing the user back to the list.
    const findById = (id: string | null) => (id ? patients.find(p => p.id === id) : undefined);
    const foundPatient = findById(requestedId) || findById(getStoredPatientId());

    if (foundPatient) {
      setSelectedPatientId(foundPatient.id);
      storeSelectedPatientId(foundPatient.id, formatPatientName(foundPatient));

      // Callers can pick the landing tab, e.g. the dashboard opens AI Transactions
      const requestedTab = searchParams.get('tab');
      if (requestedTab && (Object.values(TAB_TYPES) as string[]).includes(requestedTab)) {
        setActiveTab(requestedTab as TabType);
      }
    } else {
      clearSelectedPatientId();
      navigate('/b2b-agent/patient-appointments');
    }
  }, [search, patients, isLoading]);

  const filteredPatients = React.useMemo(() => {
    return patients.filter(patient => {
      // Search filter
      if (searchQuery) {
        const fullName = `${patient.name.given.join(' ')} ${patient.name.family}`.toLowerCase();
        const email = patient.telecom.find(t => t.system === 'email')?.value.toLowerCase() || '';
        const query = searchQuery.toLowerCase();

        if (!fullName.includes(query) && !email.includes(query)) {
          return false;
        }
      }

      // Active/Inactive filters
      if (activeFilters.includes('Active') && !patient.active) return false;
      if (activeFilters.includes('Inactive') && patient.active) return false;

      // Verification step filters
      const stepFilters = activeFilters.filter(f =>
        f === 'Eligibility' || f === 'Verification'
      );
      if (stepFilters.length > 0) {
        const getPatientVerificationStep = (p: Patient) => {
          if (!p.verificationStatus) return 0;
          const { fetchPMS, aiAnalysisAndCall, saveToPMS } = p.verificationStatus;

          if (saveToPMS === 'completed' || saveToPMS === 'in_progress') return 3;
          if (aiAnalysisAndCall === 'completed' || aiAnalysisAndCall === 'in_progress') return 2;
          if (fetchPMS === 'completed' || fetchPMS === 'in_progress') return 1;
          return 0;
        };

        const verificationStep = getPatientVerificationStep(patient);
        const matchesAnyStepFilter = stepFilters.some(filter => {
          if (filter === 'Eligibility') return verificationStep >= 1;
          if (filter === 'Verification') return verificationStep >= 2;
          return false;
        });

        if (!matchesAnyStepFilter) return false;
      }

      return true;
    });
  }, [patients, searchQuery, activeFilters]);

  const selectedPatient = selectedPatientId ? patients.find(p => p.id === selectedPatientId) : null;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      clearSelectedPatientId();
      setSelectedPatientId(null);
      setSearchQuery('');
      setActiveFilters([]);
      navigate('/');
    } catch (error) {
    }
  };

  const handleRemoveFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter(f => f !== filter));
  };

  const handleAddFilter = (filter: FilterType) => {
    if (!activeFilters.includes(filter)) {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  const handleSavePatient = async (updatedPatient: Partial<Patient>) => {
    if (!useDatabase) {
      throw new Error("Cannot save patient in mockup mode");
    }

    try {
      const response = await fetch(`/api/patients/${updatedPatient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedPatient)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update patient');
      }

      // Refresh patient list to get updated data
      await fetchPatientsFromDatabase();
    } catch (error) {
      throw error;
    }
  };

  const handleBackToDashboard = () => {
    navigate('/b2b-agent/patient-appointments');
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
        onLogoClick={() => navigate('/b2b-agent/patient-appointments')}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        <SideNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          patientSelected={!!selectedPatient}
          patientName={selectedPatient ? formatPatientName(selectedPatient) : undefined}
          onClearPatient={() => setSelectedPatientId(null)}
        />

        {selectedPatient && (
          <PatientDetail
            patient={selectedPatient}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isAdmin={false}
            canEdit={useDatabase}
            onSavePatient={handleSavePatient}
            onBackToScheduleJobs={handleBackToDashboard}
          />
        )}
      </main>
    </div>
  );
};

export default PatientDetailPage;
