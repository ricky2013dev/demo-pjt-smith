import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';

interface Payer {
    id: string;
    name: string;
    payerId: string;
    faxNumber: string | null;
    phoneNumber: string | null;
}

const PayerManagement: React.FC = () => {
    const [payers, setPayers] = useState<Payer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedPayer, setSelectedPayer] = useState<Payer | null>(null);
    const [currentUser, setCurrentUser] = useState<{ username: string; email: string } | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        payerId: '',
        faxNumber: '',
        phoneNumber: ''
    });

    useEffect(() => {
        fetchCurrentUser();
        fetchPayers();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const response = await fetch('/api/auth/verify', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setCurrentUser(data.user);
            }
        } catch (error) {
            // Ignore error
        }
    };

    const fetchPayers = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/payers');
            if (!response.ok) {
                throw new Error('Failed to fetch payers');
            }
            const data = await response.json();
            setPayers(data);
            setError('');
        } catch (err) {
            setError('Failed to load payers');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreatePayer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/payers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create payer');
            }

            setShowCreateModal(false);
            setFormData({ name: '', payerId: '', faxNumber: '', phoneNumber: '' });
            fetchPayers();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleUpdatePayer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPayer) return;

        try {
            const response = await fetch(`/api/payers/${selectedPayer.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update payer');
            }

            setShowEditModal(false);
            setSelectedPayer(null);
            setFormData({ name: '', payerId: '', faxNumber: '', phoneNumber: '' });
            fetchPayers();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDeletePayer = async (payerId: string) => {
        if (!confirm('Are you sure you want to delete this payer?')) return;

        try {
            const response = await fetch(`/api/payers/${payerId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete payer');
            }

            fetchPayers();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const openEditModal = (payer: Payer) => {
        setSelectedPayer(payer);
        setFormData({
            name: payer.name,
            payerId: payer.payerId,
            faxNumber: payer.faxNumber || '',
            phoneNumber: payer.phoneNumber || ''
        });
        setShowEditModal(true);
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            window.location.href = '/';
        } catch (error) {
            // Ignore
        }
    };

    return (
        <AdminLayout
            title="Payer Management"
            description="Manage insurance payers list"
            currentUser={currentUser ? {
                name: currentUser.username,
                email: currentUser.email,
                username: currentUser.username
            } : null}
            onLogout={handleLogout}
            headerActions={
                <button
                    onClick={() => {
                        setFormData({ name: '', payerId: '', faxNumber: '', phoneNumber: '' });
                        setShowCreateModal(true);
                    }}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                    <span className="material-symbols-outlined">add</span>
                    Add Payer
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

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <span className="material-symbols-outlined animate-spin text-4xl text-slate-400">progress_activity</span>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Payer Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Payer ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fax Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone Number</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {payers.map((payer) => (
                                <tr key={payer.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white font-medium">{payer.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">{payer.payerId}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{payer.faxNumber || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{payer.phoneNumber || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => openEditModal(payer)}
                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeletePayer(payer.id)}
                                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Payer Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Add New Payer</h2>
                        <form onSubmit={handleCreatePayer} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payer Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payer ID</label>
                                <input
                                    type="text"
                                    value={formData.payerId}
                                    onChange={(e) => setFormData({ ...formData, payerId: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fax Number</label>
                                <input
                                    type="text"
                                    value={formData.faxNumber}
                                    onChange={(e) => setFormData({ ...formData, faxNumber: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Create
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Payer Modal */}
            {showEditModal && selectedPayer && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Edit Payer</h2>
                        <form onSubmit={handleUpdatePayer} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payer Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payer ID</label>
                                <input
                                    type="text"
                                    value={formData.payerId}
                                    onChange={(e) => setFormData({ ...formData, payerId: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fax Number</label>
                                <input
                                    type="text"
                                    value={formData.faxNumber}
                                    onChange={(e) => setFormData({ ...formData, faxNumber: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Update
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default PayerManagement;
