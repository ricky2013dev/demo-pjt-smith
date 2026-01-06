import { ConsoleLogWriter } from 'drizzle-orm';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    userType?: 'b2b' | 'insurance' | 'admin';
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, userType = 'b2b' }) => {
    const [, navigate] = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [hipaaAgreed, setHipaaAgreed] = useState(false);
    const [email, setEmail] = useState(
        userType === 'insurance' ? 'insurance@smithai.com' :
        userType === 'admin' ? 'admin@smithai.com' :
        'dental@smithai.com'
    );
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (isOpen) {
            setErrorMessage("");
        }
    }, [isOpen]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        // Check if screen size is mobile (width < 768px) - allow tablets and desktop
        if (window.innerWidth < 768) {
            setErrorMessage('Mobile access not supported. This application is not available on mobile devices.');
            return;
        }

        setErrorMessage('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMessage(data.error || 'Login failed. Please try again.');
                setIsLoading(false);
                return;
            }

            // Successfully logged in
            if (userType === 'admin' ) {
                if ( data.user.role !== 'admin'){
                    setErrorMessage('Access denied. Admins only.');
                    setIsLoading(false);
                    return;
                }
                navigate('/admin/users');
            } else if (userType === 'insurance') {
                navigate('/insurance/dashboard');
            } else {
                // Dental users go directly to patient appointments
                navigate('/b2b-agent/patient-appointments');
            }
            onClose();
        } catch (error) {
            setErrorMessage('An error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                    <span className="material-symbols-outlined text-2xl">close</span>
                </button>

                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-2xl text-orange-600 dark:text-orange-500">
                            lock
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome To Smith AI Center</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        {userType === 'admin' ? 'Admin Portal' :
                         userType === 'insurance' ? 'Insurance Agent Portal' :
                         'B2B Agent Portal'}
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="••••••••"
                        />
                    </div>

                    {/* Error Message */}
                    {errorMessage && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-lg">error</span>
                                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{errorMessage}</p>
                            </div>
                        </div>
                    )}

                    {/* HIPAA Compliance Agreement */}
                    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <input
                            type="checkbox"
                            id="hipaa-agreement"
                            checked={hipaaAgreed}
                            onChange={(e) => setHipaaAgreed(e.target.checked)}
                            disabled={isLoading}
                            className="mt-0.5 w-4 h-4 text-blue-600 bg-white border-blue-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        />
                        <label htmlFor="hipaa-agreement" className="flex-1 cursor-pointer">
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-lg flex-shrink-0">verified_user</span>
                                <div>
                                    <p className="text-xs text-blue-900 dark:text-blue-100 font-medium leading-relaxed">
                                        I acknowledge and agree to HIPAA compliance standards. I understand that this system protects health information (PHI) and all data is encrypted and monitored.
                                    </p>
                                </div>
                            </div>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !hipaaAgreed}
                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-medium rounded-lg shadow-md transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                <span>Signing In...</span>
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginModal;
