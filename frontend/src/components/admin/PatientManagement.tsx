import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  dataSource: string | null;
}

interface Patient {
  id: string;
  userId: string;
  active: boolean;
  givenName: string;
  familyName: string;
  gender: string | null;
  birthDate: string | null;
  ssn: string | null;
  telecoms?: Array<{ system: string; value: string }>;
  addresses?: Array<{
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
  }>;
  insurances?: Array<{
    id: string;
    type: string;
    provider: string;
    policyNumber: string | null;
  }>;
}

interface PatientWithUser extends Patient {
  user: User;
}

const PatientManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [allPatients, setAllPatients] = useState<PatientWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      fetchAllPatients();
    }
  }, [users, selectedUserId]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/verify');
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch current user');
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.users);
      setError('');
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllPatients = async () => {
    try {
      setLoadingPatients(true);
      const usersToFetch = selectedUserId === 'all' ? users : users.filter(u => u.id === selectedUserId);

      const patientPromises = usersToFetch.map(async (user) => {
        const response = await fetch(`/api/admin/users/${user.id}/patients`);
        if (!response.ok) {
          throw new Error(`Failed to fetch patients for ${user.username}`);
        }
        const data = await response.json();
        return data.patients.map((patient: Patient) => ({
          ...patient,
          user: user
        }));
      });

      const results = await Promise.all(patientPromises);
      const flatPatients = results.flat();
      setAllPatients(flatPatients);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load patients');
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    if (!confirm('Are you sure you want to delete this patient? This will delete all related data including interface records.')) {
      return;
    }

    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete patient');
      }

      // Refresh the patient list
      await fetchAllPatients();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to logout');
    }
  };

  const handleUserFilterChange = (userId: string) => {
    setSelectedUserId(userId);
  };

  return (
    <AdminLayout
      title="Patient Management"
      description="Manage patients by user"
      currentUser={currentUser ? {
        name: currentUser.username,
        email: currentUser.email,
        username: currentUser.username
      } : null}
      onLogout={handleLogout}
    >
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* User Filter */}
      {!isLoading && users.length > 0 && (
        <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-4">
            <label htmlFor="userFilter" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">filter_list</span>
              Filter by User:
            </label>
            <select
              id="userFilter"
              value={selectedUserId}
              onChange={(e) => handleUserFilterChange(e.target.value)}
              className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="all">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.email}) - {user.role}
                </option>
              ))}
            </select>
            {selectedUserId !== 'all' && (
              <button
                onClick={() => handleUserFilterChange('all')}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">close</span>
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {isLoading || loadingPatients ? (
        <div className="flex items-center justify-center py-12">
          <span className="material-symbols-outlined animate-spin text-4xl text-slate-400">progress_activity</span>
        </div>
      ) : allPatients.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600">person_off</span>
          <p className="mt-4 text-slate-500 dark:text-slate-400">No patients found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Patient ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gender</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Insurance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {allPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{patient.user.username}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{patient.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                      {patient.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                      {patient.givenName} {patient.familyName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {patient.gender || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {patient.telecoms && patient.telecoms.length > 0 ? (
                        <div className="space-y-1">
                          {patient.telecoms.slice(0, 2).map((telecom, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">
                                {telecom.system === 'phone' ? 'phone' : 'email'}
                              </span>
                              <span className="text-xs">{telecom.value}</span>
                            </div>
                          ))}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {patient.insurances && patient.insurances.length > 0 ? (
                        <div className="space-y-1">
                          {patient.insurances.slice(0, 2).map((insurance, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="font-medium">{insurance.provider}</span>
                              {insurance.type && <span className="text-slate-400 ml-1">({insurance.type})</span>}
                            </div>
                          ))}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        patient.active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {patient.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeletePatient(patient.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 ml-auto"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default PatientManagement;
