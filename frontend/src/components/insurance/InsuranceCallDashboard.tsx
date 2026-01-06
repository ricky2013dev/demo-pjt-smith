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

type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'all';

const InsuranceCallDashboard: React.FC = () => {
  const [, navigate] = useLocation();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('daily');
  const [callRecords, setCallRecords] = useState<CallRecord[]>([]);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalCalls: 0,
    completedCalls: 0,
    failedCalls: 0,
    pendingCalls: 0,
    avgDuration: '0:00'
  });

  const handleLogout = () => {
    navigate('/');
  };

  useEffect(() => {
    // Generate realistic mock data - 20 calls per day
    const patientNames = [
      'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'Robert Wilson',
      'Jennifer Martinez', 'David Lee', 'Lisa Anderson', 'James Taylor', 'Mary Thomas',
      'Christopher White', 'Patricia Harris', 'Daniel Clark', 'Jessica Lewis', 'Matthew Robinson',
      'Nancy Walker', 'Anthony Young', 'Karen Hall', 'Mark Allen', 'Betty King'
    ];

    const dentalOffices = [
      'Bright Smiles Dental', 'Family Dental Care', 'Downtown Dental', 'Smile Center',
      'Advanced Dentistry', 'Oak Street Dental', 'Riverside Dental Group', 'Premier Dental Associates',
      'Gentle Care Dentistry', 'Modern Dental Clinic', 'City Dental Practice', 'Northside Dental Care'
    ];

    const verificationNotes = [
      'Active coverage verified, $25 copay for exam',
      'Full coverage for preventive care, deductible met',
      'Coverage active, annual maximum $1,500 remaining',
      'Patient has PPO plan, all services covered at 80%',
      'Orthodontic coverage included, lifetime max $2,000',
      'Waiting period for major services has passed',
      'Coverage verified, pre-authorization required for crowns',
      'Patient has HMO plan, no out-of-network benefits',
      'Coverage active, no deductible for cleanings',
      'Pending verification of dependent eligibility',
      'Coverage lapsed, patient needs to contact employer',
      'Unable to verify, system temporarily unavailable',
      'Active coverage, $50 deductible remaining',
      'Full coverage for restorative work approved',
      'Awaiting callback for specialist referral verification'
    ];

    const mockCalls: CallRecord[] = [];
    const today = new Date('2025-12-08');

    for (let i = 0; i < 20; i++) {
      const hour = 8 + Math.floor(i / 2.5); // Spread across work hours 8 AM - 5 PM
      const minute = (i * 23) % 60; // Varying minutes
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;

      // 70% completed, 20% pending, 10% failed
      let status: 'completed' | 'failed' | 'pending';
      const rand = Math.random();
      if (rand < 0.7) status = 'completed';
      else if (rand < 0.9) status = 'pending';
      else status = 'failed';

      const durationMinutes = 3 + Math.floor(Math.random() * 7); // 3-9 minutes
      const durationSeconds = Math.floor(Math.random() * 60);
      const duration = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;

      mockCalls.push({
        id: `CALL-${(i + 1).toString().padStart(3, '0')}`,
        callDate: today.toISOString().split('T')[0],
        callTime: timeString,
        patientName: patientNames[i],
        dentalOffice: dentalOffices[i % dentalOffices.length],
        duration: duration,
        status: status,
        verificationResult: status === 'completed' ? 'Coverage Verified' : undefined,
        notes: verificationNotes[i % verificationNotes.length]
      });
    }

    setCallRecords(mockCalls);

    // Calculate stats
    const completed = mockCalls.filter(c => c.status === 'completed').length;
    const failed = mockCalls.filter(c => c.status === 'failed').length;
    const pending = mockCalls.filter(c => c.status === 'pending').length;

    // Calculate average duration
    const totalSeconds = mockCalls.reduce((acc, call) => {
      const [min, sec] = call.duration.split(':').map(Number);
      return acc + (min * 60) + sec;
    }, 0);
    const avgSeconds = totalSeconds / mockCalls.length;
    const avgMin = Math.floor(avgSeconds / 60);
    const avgSec = Math.floor(avgSeconds % 60);

    setStats({
      totalCalls: mockCalls.length,
      completedCalls: completed,
      failedCalls: failed,
      pendingCalls: pending,
      avgDuration: `${avgMin}:${avgSec.toString().padStart(2, '0')}`
    });
  }, [timeFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="material-symbols-outlined text-xl text-green-600">check_circle</span>;
      case 'failed':
        return <span className="material-symbols-outlined text-xl text-red-600">cancel</span>;
      case 'pending':
        return <span className="material-symbols-outlined text-xl text-yellow-600">pending</span>;
      default:
        return null;
    }
  };

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

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950 overflow-hidden font-sans">
      {/* Header */}
      <Header
        onLogoClick={() => navigate('/insurance/dashboard')}
        onLogout={handleLogout}
        mode="insurance"
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Time Filter Tabs */}
        <div className="mb-6">
          <div className="flex space-x-2 bg-white dark:bg-slate-800 p-1 rounded-lg shadow-sm inline-flex">
            {(['daily', 'weekly', 'monthly', 'all'] as TimeFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                  timeFilter === filter
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Calls</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalCalls}</p>
              </div>
              <span className="material-symbols-outlined text-3xl text-blue-500">phone</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.completedCalls}</p>
              </div>
              <span className="material-symbols-outlined text-3xl text-green-500">check_circle</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.failedCalls}</p>
              </div>
              <span className="material-symbols-outlined text-3xl text-red-500">cancel</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pendingCalls}</p>
              </div>
              <span className="material-symbols-outlined text-3xl text-yellow-500">pending</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.avgDuration}</p>
              </div>
              <span className="material-symbols-outlined text-3xl text-purple-500">schedule</span>
            </div>
          </div>
        </div>

        {/* Call History Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Call History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-3 w-12"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dental Office
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {callRecords.map((call) => (
                  <React.Fragment key={call.id}>
                    <tr
                      onClick={() => setExpandedCallId(expandedCallId === call.id ? null : call.id)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-2 py-4 text-center">
                        <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                          <span className="material-symbols-outlined text-gray-500 text-lg">
                            {expandedCallId === call.id ? 'expand_less' : 'expand_more'}
                          </span>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="material-symbols-outlined text-base text-gray-400 mr-2">calendar_today</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{call.callDate}</div>
                            <div className="text-sm text-gray-500">{call.callTime}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="material-symbols-outlined text-base text-gray-400 mr-2">person</span>
                          <div className="text-sm font-medium text-gray-900">{call.patientName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="material-symbols-outlined text-base text-gray-400 mr-2">business</span>
                          <div className="text-sm text-gray-900">{call.dentalOffice}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="material-symbols-outlined text-base text-gray-400 mr-2">schedule</span>
                          <div className="text-sm text-gray-900">{call.duration}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(call.status)}
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(call.status)}`}>
                            {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={call.notes}>
                          {call.notes}
                        </div>
                      </td>
                    </tr>
                    {expandedCallId === call.id && (
                      <tr>
                        <td colSpan={7} className="px-6 py-6 bg-gray-50">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2 mr-8">
                              <h3 className="text-lg font-semibold text-gray-900">Call Summary</h3>
                               <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/insurance/call/${call.id}`);
                                }}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5"
                              >
                                <span>View Full Details</span>
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                              </button> 
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Patient Information</p>
                                <p className="text-sm text-gray-900 mt-1">{call.patientName}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Dental Office</p>
                                <p className="text-sm text-gray-900 mt-1">{call.dentalOffice}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Call Duration</p>
                                <p className="text-sm text-gray-900 mt-1">{call.duration} minutes</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Verification Status</p>
                                <p className="text-sm text-gray-900 mt-1">{call.verificationResult || 'Pending'}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm font-medium text-gray-600">Notes</p>
                                <p className="text-sm text-gray-900 mt-1">{call.notes}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {callRecords.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-gray-400 mx-auto mb-4 block">phone</span>
            <p className="text-gray-600 text-lg">No call records found for this time period</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default InsuranceCallDashboard;
