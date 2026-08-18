import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/Header';
import SideNav from './SideNav';
import CreatePatientForm, { CreatePatientFormData } from './CreatePatientForm';
import { useToast } from '@/hooks/use-toast';
import { useStediApi } from '@/context/StediApiContext';

const CreatePatientPage: React.FC = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { syncWithUser } = useStediApi();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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

        if (data.user.stediMode !== undefined) {
          syncWithUser(data.user.stediMode);
        }
      } else if (response.status === 401) {
        navigate('/');
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      navigate('/');
    } catch (error) {
    }
  };

  const handleBackToPatientList = () => {
    navigate('/b2b-agent/patient-appointments');
  };

  const handleCreatePatient = async (formData: CreatePatientFormData) => {
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          patient: {
            givenName: formData.givenName,
            middleName: formData.middleName,
            familyName: formData.familyName,
            gender: formData.gender,
            birthDate: formData.birthDate,
            ssn: formData.ssn,
            clinicPatientId: formData.clinicPatientId,
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
            provider: formData.insuranceProvider,
            payerId: formData.payerId,
            employerName: formData.employerName,
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
            aiAnalysisAndCall: 'pending',
            saveToPMS: 'pending'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create patient');
      }

      toast({
        variant: "success",
        title: "Patient created successfully",
        description: "The new patient has been added to the system.",
      });

      handleBackToPatientList();
    } catch (error: any) {
      toast({
        variant: "error",
        title: "Error creating patient",
        description: error.message,
      });
      throw error; // Re-throw to let the form handle the error state
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
        onLogoClick={() => navigate('/b2b-agent/patient-appointments')}
        currentUser={currentUser ? {
          name: currentUser.username,
          email: currentUser.email,
          username: currentUser.username,
          stediMode: currentUser.stediMode,
          role: currentUser.role
        } : null}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        <SideNav />

        <CreatePatientForm
          onSubmit={handleCreatePatient}
          onCancel={handleBackToPatientList}
          currentUser={currentUser}
        />
      </main>
    </div>
  );
};

export default CreatePatientPage;
