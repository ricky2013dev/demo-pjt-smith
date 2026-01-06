import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import PatientList from './PatientList';
import PatientDetail from './PatientDetail';
import Header from '@/components/Header';
import { Patient, FilterType, TabType, TAB_TYPES } from '@/types/patient';
import patientsDataMockup from '@mockupdata/patients.json';

const mockupPatients = Array.isArray(patientsDataMockup) ? patientsDataMockup : (patientsDataMockup as any).default || [];

const PatientDetailPage: React.FC = () => {
  const [location, navigate] = useLocation();
  const [patients, setPatients] = useState<Patient[]>(mockupPatients);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useDatabase, setUseDatabase] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>(TAB_TYPES.AI_CALL_HISTORY);

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

  // Extract patientId from URL query params
  useEffect(() => {
    if (isLoading || patients.length === 0) return;

    const searchParams = new URLSearchParams(location.split('?')[1] || '');
    const id = searchParams.get('patientId');

    if (id) {
      const foundPatient = patients.find(p => p.id === id);
      if (foundPatient) {
        setSelectedPatientId(id);
      }
    } else {
      // Default to first patient if no patientId is provided
      if (patients.length > 0) {
        setSelectedPatientId(patients[0].id);
      }
    }
  }, [location, patients, isLoading]);

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
          const { fetchPMS, documentAnalysis, apiVerification, callCenter, saveToPMS } = p.verificationStatus;

          if (saveToPMS === 'completed' || saveToPMS === 'in_progress') return 5;
          if (callCenter === 'completed' || callCenter === 'in_progress') return 4;
          if (apiVerification === 'completed' || apiVerification === 'in_progress') return 3;
          if (documentAnalysis === 'completed' || documentAnalysis === 'in_progress') return 2;
          if (fetchPMS === 'completed' || fetchPMS === 'in_progress') return 1;
          return 0;
        };

        const verificationStep = getPatientVerificationStep(patient);
        const matchesAnyStepFilter = stepFilters.some(filter => {
          if (filter === 'Eligibility') return verificationStep >= 1;
          if (filter === 'Verification') return verificationStep >= 3;
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
      await fetch('/api/auth/logout', { method: 'POST' });
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
        currentUser={currentUser ? {
          name: currentUser.username,
          email: currentUser.email,
          username: currentUser.username,
          dataSource: currentUser.dataSource
        } : null}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {selectedPatient && (
          <div className="flex w-full">
            <PatientList
              patients={filteredPatients}
              selectedPatientId={selectedPatientId}
              searchQuery={searchQuery}
              activeFilters={activeFilters}
              onSelectPatient={setSelectedPatientId}
              onSearchChange={setSearchQuery}
              onRemoveFilter={handleRemoveFilter}
              onAddFilter={handleAddFilter}
              isAdmin={false}
              onBackToScheduleJobs={handleBackToDashboard}
            />

            <PatientDetail
              patient={selectedPatient}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              isAdmin={false}
              canEdit={useDatabase}
              onSavePatient={handleSavePatient}
              onBackToScheduleJobs={handleBackToDashboard}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default PatientDetailPage;
