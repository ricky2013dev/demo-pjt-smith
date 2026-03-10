import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';

interface PmsIfRecord {
  id: string;
  accountId: string | null;
  status: string;
  payload: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  received: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  processing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const PmsIfHistory: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<{ username: string; email: string } | null>(null);
  const [records, setRecords] = useState<PmsIfRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<PmsIfRecord | null>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchHistory();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/verify', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch {
      // Ignore
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pms-if/history', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setRecords(data.data);
      setError('');
    } catch {
      setError('Failed to load PMS interface history');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      window.location.href = '/';
    } catch {
      // Ignore
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const formatPayload = (payload: string) => {
    try {
      return JSON.stringify(JSON.parse(payload), null, 2);
    } catch {
      return payload;
    }
  };

  return (
    <AdminLayout
      title="PMS IF History"
      description="Incoming PMS interface records"
      currentUser={currentUser ? { name: currentUser.username, email: currentUser.email, username: currentUser.username } : null}
      onLogout={handleLogout}
      headerActions={
        <button
          onClick={fetchHistory}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Refresh
        </button>
      }
    >
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="material-symbols-outlined animate-spin text-4xl text-slate-400">progress_activity</span>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Account ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Received At</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 font-mono">{record.id.slice(0, 8)}...</td>
                  <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">{record.accountId || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[record.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{formatDate(record.createdAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedRecord(record)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {records.length === 0 && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">No records found</div>
          )}
        </div>
      )}

      {/* Payload Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Payload</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Account: {selectedRecord.accountId || '-'} &nbsp;|&nbsp;
                  Status: <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[selectedRecord.status] ?? ''}`}>{selectedRecord.status}</span> &nbsp;|&nbsp;
                  {formatDate(selectedRecord.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <pre className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 text-xs text-slate-700 dark:text-slate-300 overflow-auto max-h-96 font-mono whitespace-pre-wrap">
              {formatPayload(selectedRecord.payload)}
            </pre>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default PmsIfHistory;
