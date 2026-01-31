import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import AdminLayout from './AdminLayout';

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  stediMode: string;
  providerId: string | null;
}

interface Provider {
  id: string;
  name: string;
  npiNumber: string;
  faxNumber: string | null;
  phoneNumber: string | null;
  address: string | null;
  taxNumber: string | null;
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

interface InterfaceTransaction {
  id: string;
  transactionId: string;
  requestId: string;
  patientId: string;
  patientName: string;
  insuranceProvider: string;
  policyNumber: string;
  groupNumber: string;
  subscriberId: string;
  status: string;
  createdAt: string;
}

interface InterfaceCoverageCode {
  id: string;
  ifCallTransactionId: string;
  saiCode: string;
  refInsCode: string;
  category: string;
  fieldName: string;
  verified: boolean;
  createdAt: string;
}

interface InterfaceMessage {
  id: string;
  ifCallTransactionId: string;
  timestamp: string;
  speaker: string;
  message: string;
  type: string;
  createdAt: string;
}

type MainTab = 'patients' | 'call-interface' | 'provider';
type DetailTabType = 'coverage' | 'messages';

const UserRelatedData: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<MainTab>('patients');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Patient state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Call interface state
  const [transactions, setTransactions] = useState<InterfaceTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [expandedTxnId, setExpandedTxnId] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTabType>('coverage');
  const [coverageCodes, setCoverageCodes] = useState<InterfaceCoverageCode[]>([]);
  const [messages, setMessages] = useState<InterfaceMessage[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Provider state
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loadingProvider, setLoadingProvider] = useState(false);
  const [showEditProviderModal, setShowEditProviderModal] = useState(false);
  const [providerFormData, setProviderFormData] = useState({
    name: '',
    npiNumber: '',
    faxNumber: '',
    phoneNumber: '',
    address: '',
    taxNumber: ''
  });

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchPatients(selectedUserId);
      fetchTransactions(selectedUserId);
      fetchProvider(selectedUserId);
      // Reset expanded transaction when user changes
      setExpandedTxnId(null);
      setCoverageCodes([]);
      setMessages([]);
    } else {
      setPatients([]);
      setTransactions([]);
      setProvider(null);
    }
  }, [selectedUserId]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/verify', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch {
      console.error('Failed to fetch current user');
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.users.filter((u: User) => u.role === 'dental'));
      setError('');
    } catch {
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  // Patient data fetching
  const fetchPatients = async (userId: string) => {
    try {
      setLoadingPatients(true);
      const response = await fetch(`/api/admin/users/${userId}/patients`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch patients');
      const data = await response.json();
      setPatients(data.patients);
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
      const response = await fetch(`/api/patients/${patientId}`, { method: 'DELETE', credentials: 'include' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete patient');
      }
      if (selectedUserId) {
        await fetchPatients(selectedUserId);
        await fetchTransactions(selectedUserId);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Call interface data fetching
  const fetchTransactions = async (userId: string) => {
    try {
      setLoadingTransactions(true);
      const response = await fetch(`/api/admin/interface/transactions?userId=${userId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoadingTransactions(false);
    }
  };

  const fetchTransactionDetails = async (transactionId: string) => {
    setDetailLoading(true);
    try {
      const [coverageRes, messagesRes] = await Promise.all([
        fetch(`/api/admin/interface/coverage-codes?transactionId=${transactionId}`, { credentials: 'include' }),
        fetch(`/api/admin/interface/messages?transactionId=${transactionId}`, { credentials: 'include' })
      ]);
      if (!coverageRes.ok || !messagesRes.ok) throw new Error('Failed to fetch transaction details');
      const coverageData = await coverageRes.json();
      const messagesData = await messagesRes.json();
      setCoverageCodes(coverageData);
      setMessages(messagesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleExpand = async (txnId: string) => {
    if (expandedTxnId === txnId) {
      setExpandedTxnId(null);
      setCoverageCodes([]);
      setMessages([]);
    } else {
      setExpandedTxnId(txnId);
      setActiveDetailTab('coverage');
      await fetchTransactionDetails(txnId);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction? This will also delete all related coverage codes and messages.')) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/interface/transactions/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!response.ok) throw new Error('Failed to delete transaction');
      if (selectedUserId) fetchTransactions(selectedUserId);
      if (expandedTxnId === id) {
        setExpandedTxnId(null);
        setCoverageCodes([]);
        setMessages([]);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Provider data fetching
  const fetchProvider = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user?.providerId) {
      setProvider(null);
      return;
    }
    try {
      setLoadingProvider(true);
      const response = await fetch('/api/providers', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch providers');
      const data = await response.json();
      const matched = data.find((p: Provider) => p.id === user.providerId);
      setProvider(matched || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load provider');
    } finally {
      setLoadingProvider(false);
    }
  };

  const openEditProviderModal = () => {
    if (!provider) return;
    setProviderFormData({
      name: provider.name,
      npiNumber: provider.npiNumber,
      faxNumber: provider.faxNumber || '',
      phoneNumber: provider.phoneNumber || '',
      address: provider.address || '',
      taxNumber: provider.taxNumber || ''
    });
    setShowEditProviderModal(true);
  };

  const handleUpdateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider) return;
    try {
      const response = await fetch(`/api/providers/${provider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(providerFormData)
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update provider');
      }
      setShowEditProviderModal(false);
      if (selectedUserId) fetchProvider(selectedUserId);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      window.location.href = '/';
    } catch {
      console.error('Failed to logout');
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  // Render patient table
  const renderPatientTab = () => {
    if (loadingPatients) {
      return (
        <div className="flex items-center justify-center py-12">
          <span className="material-symbols-outlined animate-spin text-4xl text-slate-400">progress_activity</span>
        </div>
      );
    }

    if (patients.length === 0) {
      return (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600">person_off</span>
          <p className="mt-4 text-slate-500 dark:text-slate-400">No patients found for this user</p>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
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
              {patients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
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
    );
  };

  // Render coverage codes sub-tab
  const renderCoverageCodesTab = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">SAI Code</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ref Ins Code</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Category</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Field Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Verified</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {coverageCodes.map((code) => (
            <tr key={code.id}>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{code.saiCode}</td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">{code.refInsCode}</td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">{code.category}</td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">{code.fieldName}</td>
              <td className="px-4 py-3">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  code.verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {code.verified ? 'Yes' : 'No'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {coverageCodes.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">No coverage codes found</div>
      )}
    </div>
  );

  // Render messages sub-tab
  const renderMessagesTab = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Timestamp</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Speaker</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Message</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {messages.map((msg) => (
            <tr key={msg.id}>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">{msg.timestamp}</td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">{msg.speaker}</td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">{msg.type}</td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">{msg.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {messages.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">No messages found</div>
      )}
    </div>
  );

  // Render call interface table
  const renderCallInterfaceTab = () => {
    if (loadingTransactions) {
      return (
        <div className="flex items-center justify-center py-12">
          <span className="material-symbols-outlined animate-spin text-4xl text-slate-400">progress_activity</span>
        </div>
      );
    }

    if (transactions.length === 0) {
      return (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600">call_end</span>
          <p className="mt-4 text-slate-500 dark:text-slate-400">No transactions found for this user</p>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12"></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Request ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900">
              {transactions.map((txn) => (
                <React.Fragment key={txn.id}>
                  <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleExpand(txn.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {expandedTxnId === txn.id ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{txn.requestId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{txn.patientName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{txn.insuranceProvider}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        txn.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                        txn.status === 'Waiting' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {new Date(txn.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteTransaction(txn.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>

                  {expandedTxnId === txn.id && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                          <div className="border-b border-gray-200 dark:border-gray-700">
                            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                              <button
                                onClick={() => setActiveDetailTab('coverage')}
                                className={`${
                                  activeDetailTab === 'coverage'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                              >
                                Coverage Codes
                                <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-0.5 px-2.5 rounded-full text-xs font-medium">
                                  {coverageCodes.length}
                                </span>
                              </button>
                              <button
                                onClick={() => setActiveDetailTab('messages')}
                                className={`${
                                  activeDetailTab === 'messages'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                              >
                                Messages
                                <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-0.5 px-2.5 rounded-full text-xs font-medium">
                                  {messages.length}
                                </span>
                              </button>
                            </nav>
                          </div>
                          <div className="p-4">
                            {detailLoading ? (
                              <div className="text-center py-8">
                                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
                                <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">Loading details...</p>
                              </div>
                            ) : (
                              <>
                                {activeDetailTab === 'coverage' && renderCoverageCodesTab()}
                                {activeDetailTab === 'messages' && renderMessagesTab()}
                              </>
                            )}
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
    );
  };

  // Render provider tab
  const renderProviderTab = () => {
    if (loadingProvider) {
      return (
        <div className="flex items-center justify-center py-12">
          <span className="material-symbols-outlined animate-spin text-4xl text-slate-400">progress_activity</span>
        </div>
      );
    }

    if (!provider) {
      return (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600">business_center</span>
          <p className="mt-4 text-slate-500 dark:text-slate-400">No provider assigned to this user</p>
        </div>
      );
    }

    return (
      <>
        <div className="mb-4 flex justify-end">
          <button
            onClick={openEditProviderModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            Edit Provider
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">NPI Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">TAX Number</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white font-medium">{provider.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">{provider.npiNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                  <div>{provider.phoneNumber || '-'}</div>
                  <div className="text-xs">{provider.faxNumber ? `Fax: ${provider.faxNumber}` : ''}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs" title={provider.address || ''}>
                  {provider.address || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{provider.taxNumber || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    );
  };

  return (
    <AdminLayout
      title="User Related Data"
      description="View patient and call interface data by user"
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

      {/* User Selector */}
      {!isLoading && users.length > 0 && (
        <div className="mb-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-4">
            <label htmlFor="userSelector" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">person</span>
              Select User:
            </label>
            <select
              id="userSelector"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="">-- Select a user --</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.email}) - {user.role}
                </option>
              ))}
            </select>
            {selectedUserId && (
              <button
                onClick={() => setSelectedUserId('')}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">close</span>
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <span className="material-symbols-outlined animate-spin text-4xl text-slate-400">progress_activity</span>
        </div>
      ) : !selectedUserId ? (
        /* Prompt to select user */
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600">person_search</span>
          <p className="mt-4 text-lg font-medium text-slate-600 dark:text-slate-400">Please select a user to view data</p>
          <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">Choose a user from the dropdown above to see their patient and call interface data</p>
        </div>
      ) : (
        <>
          {/* Selected user info */}
          {selectedUser && (
            <div className="mb-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Viewing data for: <span className="font-semibold">{selectedUser.username}</span> ({selectedUser.email}) - {selectedUser.role}
              </p>
            </div>
          )}

          {/* Main Tabs */}
          <div className="mb-6">
            <div className="border-b border-slate-200 dark:border-slate-700">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('patients')}
                  className={`${
                    activeTab === 'patients'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <span className="material-symbols-outlined text-lg">group</span>
                  Patient Data
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 py-0.5 px-2.5 rounded-full text-xs font-medium">
                    {patients.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('call-interface')}
                  className={`${
                    activeTab === 'call-interface'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <span className="material-symbols-outlined text-lg">database</span>
                  Call Interface Data
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 py-0.5 px-2.5 rounded-full text-xs font-medium">
                    {transactions.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('provider')}
                  className={`${
                    activeTab === 'provider'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <span className="material-symbols-outlined text-lg">stethoscope</span>
                  Provider Data
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 py-0.5 px-2.5 rounded-full text-xs font-medium">
                    {provider ? 1 : 0}
                  </span>
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'patients' && renderPatientTab()}
            {activeTab === 'call-interface' && renderCallInterfaceTab()}
            {activeTab === 'provider' && renderProviderTab()}
          </div>
        </>
      )}

      {/* Edit Provider Modal */}
      {showEditProviderModal && provider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Edit Provider</h2>
            <form onSubmit={handleUpdateProvider} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Provider Name</label>
                <input type="text" value={providerFormData.name} onChange={(e) => setProviderFormData({ ...providerFormData, name: e.target.value })} required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">NPI Number</label>
                <input type="text" value={providerFormData.npiNumber} onChange={(e) => setProviderFormData({ ...providerFormData, npiNumber: e.target.value })} required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input type="text" value={providerFormData.phoneNumber} onChange={(e) => setProviderFormData({ ...providerFormData, phoneNumber: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fax Number</label>
                  <input type="text" value={providerFormData.faxNumber} onChange={(e) => setProviderFormData({ ...providerFormData, faxNumber: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
                <textarea value={providerFormData.address} onChange={(e) => setProviderFormData({ ...providerFormData, address: e.target.value })} rows={3} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">TAX Number</label>
                <input type="text" value={providerFormData.taxNumber} onChange={(e) => setProviderFormData({ ...providerFormData, taxNumber: e.target.value })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">Update</button>
                <button type="button" onClick={() => setShowEditProviderModal(false)} className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default UserRelatedData;
