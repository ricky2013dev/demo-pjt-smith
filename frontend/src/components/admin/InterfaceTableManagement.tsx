import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import AdminLayout from './AdminLayout';

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

type DetailTabType = 'coverage' | 'messages';

const InterfaceTableManagement: React.FC = () => {
  const [transactions, setTransactions] = useState<InterfaceTransaction[]>([]);
  const [expandedTxnId, setExpandedTxnId] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTabType>('coverage');
  const [coverageCodes, setCoverageCodes] = useState<InterfaceCoverageCode[]>([]);
  const [messages, setMessages] = useState<InterfaceMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/interface/transactions');
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionDetails = async (transactionId: string) => {
    setDetailLoading(true);
    try {
      const [coverageRes, messagesRes] = await Promise.all([
        fetch(`/api/admin/interface/coverage-codes?transactionId=${transactionId}`),
        fetch(`/api/admin/interface/messages?transactionId=${transactionId}`)
      ]);

      if (!coverageRes.ok || !messagesRes.ok) {
        throw new Error('Failed to fetch transaction details');
      }

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
      const response = await fetch(`/api/admin/interface/transactions/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete transaction');
      fetchTransactions();
      if (expandedTxnId === id) {
        setExpandedTxnId(null);
        setCoverageCodes([]);
        setMessages([]);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const renderCoverageCodesTab = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
              SAI Code
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
              Ref Ins Code
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
              Category
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
              Field Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
              Verified
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {coverageCodes.map((code) => (
            <tr key={code.id}>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                {code.saiCode}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">
                {code.refInsCode}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">
                {code.category}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">
                {code.fieldName}
              </td>
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
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
          No coverage codes found
        </div>
      )}
    </div>
  );

  const renderMessagesTab = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
              Timestamp
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
              Speaker
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
              Message
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {messages.map((msg) => (
            <tr key={msg.id}>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                {msg.timestamp}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">
                {msg.speaker}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">
                {msg.type}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">
                {msg.message}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {messages.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
          No messages found
        </div>
      )}
    </div>
  );

  return (
    <AdminLayout
      title="Call Interface Management"
      description="Manage CALL transaction interface tables"
    >
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="p-6">
            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Loading...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12">
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Request ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Created At
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900">
                    {transactions.map((txn) => (
                      <React.Fragment key={txn.id}>
                        {/* Main transaction row */}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {txn.requestId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {txn.patientName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {txn.insuranceProvider}
                          </td>
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

                        {/* Expanded detail row */}
                        {expandedTxnId === txn.id && (
                          <tr>
                            <td colSpan={7} className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
                              <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                                {/* Detail tabs */}
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

                                {/* Detail content */}
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
                {transactions.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No transactions found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
    </AdminLayout>
  );
};

export default InterfaceTableManagement;
