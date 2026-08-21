import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import SsoSignInMock, {
    GoogleLogo,
    MicrosoftLogo,
    MOCK_ADMIN_ACCOUNTS,
    MOCK_DENTAL_ACCOUNTS,
    type SsoProvider,
} from './SsoSignInMock';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    userType?: 'b2b' | 'admin';
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, userType = 'b2b' }) => {
    const [, navigate] = useLocation();
    const [errorMessage, setErrorMessage] = useState('');
    const [hipaaAgreed, setHipaaAgreed] = useState(false);
    /** Which mock SSO dialog is open, or null when none is. */
    const [ssoProvider, setSsoProvider] = useState<SsoProvider | null>(null);

    const isAdmin = userType === 'admin';

    useEffect(() => {
        if (isOpen) {
            setErrorMessage('');
            setSsoProvider(null);
        }
    }, [isOpen]);

    /** Shared guard: the app is desktop/tablet only. */
    const isMobileViewport = () => window.innerWidth < 768;

    const openSsoDialog = (provider: SsoProvider) => {
        if (isMobileViewport()) {
            setErrorMessage('Mobile access not supported. This application is not available on mobile devices.');
            return;
        }
        setErrorMessage('');
        setSsoProvider(provider);
    };

    /**
     * Exchanges the account picked in the mock SSO dialog for a real session,
     * then routes to the portal the account's role belongs to. Throws so the
     * dialog can surface the failure in place.
     */
    const handleSsoApprove = async (ssoEmail: string) => {
        const response = await fetch('/api/auth/sso/mock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: ssoEmail, provider: ssoProvider }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || 'Sign-in failed. Please try again.');
        }

        // The two portals are separate: the admin portal is for the InSpline
        // system administrator, the B2B portal for clinic managers and dental
        // staff. A valid session on the wrong door is still turned away.
        if (isAdmin && data.user?.role !== 'admin') {
            await fetch('/api/auth/logout', { method: 'POST' });
            throw new Error('Access denied. System administrators only.');
        }

        if (!isAdmin && data.user?.role === 'admin') {
            await fetch('/api/auth/logout', { method: 'POST' });
            throw new Error('System administrators sign in through the admin portal.');
        }

        setSsoProvider(null);
        navigate(isAdmin ? '/admin/users' : '/b2b-agent/dashboard');
        onClose();
    };

    if (!isOpen) return null;

    const ssoButtonClass =
        'w-full py-2.5 px-4 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-950 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3';

    return (
        <>
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
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome To InSpline AI</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">
                            {isAdmin ? 'System Admin Portal' : 'B2B Agent Portal'}
                        </p>
                    </div>

                    <div className="space-y-6">
                        <p className="text-sm text-center text-slate-600 dark:text-slate-400">
                            {isAdmin
                                ? 'Sign in with the Google or Microsoft Teams account linked to your system administrator identity.'
                                : 'Sign in with the Google or Microsoft Teams account linked to your dental practice.'}
                        </p>

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
                                className="mt-0.5 w-4 h-4 text-blue-600 bg-white border-blue-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
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

                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={() => openSsoDialog('google')}
                                disabled={!hipaaAgreed}
                                className={ssoButtonClass}
                            >
                                <GoogleLogo className="w-5 h-5" />
                                <span>Sign in with Google</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => openSsoDialog('microsoft')}
                                disabled={!hipaaAgreed}
                                className={ssoButtonClass}
                            >
                                <MicrosoftLogo className="w-5 h-5" />
                                <span>Sign in with Microsoft Teams</span>
                            </button>
                        </div>

                        <p className="text-xs text-center text-slate-400 dark:text-slate-500">
                            Demo environment — the Google and Microsoft sign-in screens are simulated.
                        </p>
                    </div>
                </div>
            </div>

            <SsoSignInMock
                isOpen={ssoProvider !== null}
                provider={ssoProvider ?? 'google'}
                accounts={isAdmin ? MOCK_ADMIN_ACCOUNTS : MOCK_DENTAL_ACCOUNTS}
                onCancel={() => setSsoProvider(null)}
                onApprove={handleSsoApprove}
            />
        </>
    );
};

export default LoginModal;
