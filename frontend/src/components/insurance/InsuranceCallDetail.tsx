import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/Header';

interface CallRecord {
  id: string;
  callDate: string;
  callTime: string;
  patientName: string;
  dentalOffice: string;
  duration: string;
  status: 'completed' | 'failed' | 'pending';
  verificationResult?: string;
  notes?: string;
}

interface CallDetail {
  id: string;
  callDate: string;
  callTime: string;
  patientName: string;
  patientDOB: string;
  patientId: string;
  dentalOffice: string;
  dentalOfficePhone: string;
  callerName: string;
  duration: string;
  status: 'completed' | 'failed' | 'pending';
  verificationResult: string;
  coverageDetails: {
    policyNumber: string;
    groupNumber: string;
    effectiveDate: string;
    planType: string;
    annualMaximum: string;
    deductible: string;
    copay: string;
    preventiveCoverage: string;
    basicCoverage: string;
    majorCoverage: string;
    orthodonticCoverage: string;
  };
  requestedServices: Array<{
    code: string;
    description: string;
    covered: boolean;
    copay: string;
  }>;
  conversationLog: Array<{
    time: string;
    speaker: string;
    message: string;
  }>;
  notes: string;
}

const InsuranceCallDetail: React.FC = () => {
  const [location, navigate] = useLocation();
  const callId = location.split('/').pop();
  const [activeTab, setActiveTab] = useState<'overview' | 'conversation' | 'verification'>('overview');
  const [selectedCallId, setSelectedCallId] = useState<string>(callId || '');
  const [callRecords, setCallRecords] = useState<CallRecord[]>([]);
  const [selectedCallIds, setSelectedCallIds] = useState<Set<string>>(new Set());
  const [callData, setCallData] = useState<CallDetail | null>(null);

  const handleLogout = () => {
    navigate('/');
  };

  const handleCheckboxChange = (callId: string) => {
    // Only allow one checkbox to be checked at a time - the currently viewed call
    setSelectedCallIds(new Set([callId]));
  };

  useEffect(() => {
    // Set initial checkbox for the selected call
    if (selectedCallId) {
      setSelectedCallIds(new Set([selectedCallId]));
    }
  }, [selectedCallId]);

  useEffect(() => {
    const fetchCallRecords = async () => {
      try {
        const response = await fetch('/api/transactions');
        const data = await response.json();

        if (data.success && Array.isArray(data.transactions)) {
          const records: CallRecord[] = data.transactions.map((t: any) => {
            const dateObj = new Date(parseInt(t.startTime));
            return {
              id: t.id,
              callDate: dateObj.toLocaleDateString(),
              callTime: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              patientName: t.patientName,
              dentalOffice: t.runBy || 'Smith AI Dental',
              duration: t.duration || '0:00',
              status: t.status === 'SUCCESS' ? 'completed' : t.status === 'FAILED' ? 'failed' : 'pending',
              verificationResult: t.verificationScore ? `Score: ${t.verificationScore}` : (t.status === 'SUCCESS' ? 'Coverage Verified' : 'Pending'),
              notes: t.summary || t.status
            };
          });
          setCallRecords(records);

          // Select first record if none selected and records exist
          if (!selectedCallId && records.length > 0) {
            setSelectedCallId(records[0].id);
          }
        }
      } catch (error) {
      }
    };

    fetchCallRecords();
  }, []);

  // Fetch detailed call data based on selected call ID
  useEffect(() => {
    const fetchCallDetail = async () => {
      if (!selectedCallId) return;

      try {
        // Fetch transaction basic info
        const transResponse = await fetch(`/api/transactions/${selectedCallId}`);
        const transData = await transResponse.json();

        if (transData.success && transData.transaction) {
          const t = transData.transaction;
          const dateObj = new Date(parseInt(t.startTime));

          // Fetch communications
          const commResponse = await fetch(`/api/transactions/${selectedCallId}/communications`);
          const commData = await commResponse.json();
          const conversationLog = commData.success ? commData.communications.map((c: any) => ({
            time: new Date(parseInt(c.timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            speaker: c.speaker === 'AI' ? 'Insurance Agent' : (c.speaker === 'System' ? 'System' : 'Dental Office'), // Mapping AI to Agent for UI consistency
            message: c.message
          })) : [];

          // Fetch verified data
          const verifResponse = await fetch(`/api/transactions/${selectedCallId}/verified-data`);
          const verifData = await verifResponse.json();
          const requestedServices = verifData.success ? verifData.verifiedData.map((v: any) => ({
            code: 'N/A', // Data verified items are strings currently, explicit structure might be needed in future
            description: v.item,
            covered: true, // simplified assumption if verified
            copay: 'N/A'
          })) : [];

          // Parse coverage details from JSON string if available
          let coverageDetails = {
            policyNumber: 'N/A',
            groupNumber: 'N/A',
            effectiveDate: 'N/A',
            planType: 'N/A',
            annualMaximum: 'N/A',
            deductible: 'N/A',
            copay: 'N/A',
            preventiveCoverage: 'N/A',
            basicCoverage: 'N/A',
            majorCoverage: 'N/A',
            orthodonticCoverage: 'N/A'
          };

          if (t.coverageDetails) {
            try {
              const parsed = JSON.parse(t.coverageDetails);
              coverageDetails = { ...coverageDetails, ...parsed };
            } catch (e) {
            }
          }

          setCallData({
            id: t.id,
            callDate: dateObj.toLocaleDateString(),
            callTime: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            patientName: t.patientName,
            patientDOB: 'N/A', // Not in transaction directly
            patientId: t.patientId,
            dentalOffice: t.runBy || 'Smith AI Dental',
            dentalOfficePhone: 'N/A',
            callerName: t.runBy || 'Dr. Smith',
            duration: t.duration || '0:00',
            status: t.status === 'SUCCESS' ? 'completed' : t.status === 'FAILED' ? 'failed' : 'pending',
            verificationResult: t.verificationScore ? `Score: ${t.verificationScore}` : 'Coverage Verified',
            coverageDetails,
            requestedServices,
            conversationLog,
            notes: t.summary || 'No notes available'
          });
        }
      } catch (error) {
      }
    };

    fetchCallDetail();
  }, [selectedCallId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!callData && selectedCallId) {
    return <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-950 text-slate-500">Loading call details...</div>;
  }

  // If no call selected and no data (e.g. empty list), show placeholder or empty state
  if (!callData) {
    return <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-950 text-slate-500">No call selected</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950 overflow-hidden font-sans">
      {/* Header */}
      <Header
        onLogoClick={() => navigate('/insurance/dashboard')}
        onLogout={handleLogout}
        mode="insurance"
      />

      {/* Main Content - Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Call List */}
        <div className="w-[0%] border-r border-slate-200 dark:border-slate-700 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
          {/* Call List Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-2 py-2 w-8"></th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Time
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Patient
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Dental Office
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {callRecords.map((call) => (
                  <tr
                    key={call.id}
                    onClick={() => {
                      setSelectedCallId(call.id);
                      handleCheckboxChange(call.id);
                    }}
                    className={`border-b border-slate-200 dark:border-slate-700 cursor-pointer transition-colors ${selectedCallId === call.id
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                  >
                    <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedCallIds.has(call.id)}
                        onChange={() => handleCheckboxChange(call.id)}
                        className="w-3 h-3 rounded border-slate-300 dark:border-slate-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-slate-400">schedule</span>
                          <span className="text-xs font-medium text-slate-900 dark:text-white whitespace-nowrap">{call.callTime}</span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-4">{call.callDate}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <span className="text-xs font-medium text-slate-900 dark:text-white">{call.patientName}</span>
                    </td>
                    <td className="px-2 py-2">
                      <span className="text-xs text-slate-600 dark:text-slate-400">{call.dentalOffice}</span>
                    </td>
                    <td className="px-2 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(call.status)}`}>
                        {call.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel - Call Details */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="max-w-6xl mx-auto px-6 py-6">
            {/* Page Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Call Details - {callData.id}</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Verification call from {callData.dentalOffice}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(callData.status)}`}>
                    <span className="material-symbols-outlined text-sm mr-1">
                      {callData.status === 'completed' ? 'check_circle' : callData.status === 'failed' ? 'cancel' : 'pending'}
                    </span>
                    {callData.status.charAt(0).toUpperCase() + callData.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Call Information Card */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Call Information</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Date & Time</p>
                  <p className="text-sm text-slate-900 dark:text-white mt-1">{callData.callDate} at {callData.callTime}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Duration</p>
                  <p className="text-sm text-slate-900 dark:text-white mt-1">{callData.duration} minutes</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Dental Office</p>
                  <p className="text-sm text-slate-900 dark:text-white mt-1">{callData.dentalOffice}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{callData.dentalOfficePhone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Caller</p>
                  <p className="text-sm text-slate-900 dark:text-white mt-1">{callData.callerName}</p>
                </div>
              </div>
            </div>

            {/* Patient Information Card */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Patient Information</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Patient Name</p>
                  <p className="text-sm text-slate-900 dark:text-white mt-1">{callData.patientName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Date of Birth</p>
                  <p className="text-sm text-slate-900 dark:text-white mt-1">{callData.patientDOB}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Patient ID</p>
                  <p className="text-sm text-slate-900 dark:text-white mt-1">{callData.patientId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Policy Number</p>
                  <p className="text-sm text-slate-900 dark:text-white mt-1">{callData.coverageDetails.policyNumber}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-4 px-1 border-b-2 font-medium text-xs transition-colors ${activeTab === 'overview'
                      ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                  >
                    Coverage Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('conversation')}
                    className={`py-4 px-1 border-b-2 font-medium text-xs transition-colors ${activeTab === 'conversation'
                      ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                  >
                    Call Transcript
                  </button>
                  <button
                    onClick={() => setActiveTab('verification')}
                    className={`py-4 px-1 border-b-2 font-medium text-xs transition-colors ${activeTab === 'verification'
                      ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                  >
                    Service Verification
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Coverage Details</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Plan Type</p>
                          <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1">{callData.coverageDetails.planType}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Annual Maximum</p>
                          <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1">{callData.coverageDetails.annualMaximum}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Deductible</p>
                          <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1">{callData.coverageDetails.deductible}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Preventive</p>
                          <p className="text-lg font-semibold text-green-600 dark:text-green-400 mt-1">{callData.coverageDetails.preventiveCoverage}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Basic Services</p>
                          <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 mt-1">{callData.coverageDetails.basicCoverage}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Major Services</p>
                          <p className="text-lg font-semibold text-orange-600 dark:text-orange-400 mt-1">{callData.coverageDetails.majorCoverage}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'conversation' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Call Transcript</h3>
                    <div className="space-y-3">
                      {callData.conversationLog.map((entry, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg ${entry.speaker === 'Insurance Agent'
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                            : 'bg-slate-50 dark:bg-slate-700 border-l-4 border-slate-300 dark:border-slate-600'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{entry.speaker}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{entry.time}</span>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{entry.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'verification' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Requested Services</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Code
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Coverage Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Patient Responsibility
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                          {callData.requestedServices.map((service, index) => (
                            <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                                {service.code}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                                {service.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {service.covered ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    <span className="material-symbols-outlined text-sm mr-1">check_circle</span>
                                    Covered
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                    <span className="material-symbols-outlined text-sm mr-1">cancel</span>
                                    Not Covered
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                                {service.copay}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-start">
                        <span className="material-symbols-outlined text-green-600 dark:text-green-400 mr-3">info</span>
                        <div>
                          <p className="text-sm font-semibold text-green-900 dark:text-green-100">Verification Result</p>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">{callData.notes}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsuranceCallDetail;
