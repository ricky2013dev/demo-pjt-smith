import React, { useEffect, useState } from 'react';

/**
 * Mock single sign-on dialog for Google and Microsoft Teams.
 *
 * This is a demo stand-in for a real OAuth popup: nothing talks to Google or
 * Microsoft. It walks through the screens each provider actually shows
 * (account picker -> consent -> "signing you in") and then hands the selected
 * account email back to the caller, which exchanges it for a session via
 * POST /api/auth/sso/mock.
 */

export type SsoProvider = 'google' | 'microsoft';

export interface MockSsoAccount {
    email: string;
    name: string;
    /** Subtitle shown under the name in the account chooser. */
    organization: string;
    /** Background colour for the fallback avatar. */
    avatarColor: string;
}

/**
 * Demo B2B agent accounts, mirroring the dental users in the mockup database.
 * The dataset carries one account per role, so the chooser offers just the one.
 */
export const MOCK_DENTAL_ACCOUNTS: MockSsoAccount[] = [
    {
        email: 'manager01@inspline.com',
        name: 'Clinic Manager 01',
        organization: 'Bright Smile Dental Group',
        avatarColor: 'bg-blue-600',
    },
    {
        email: 'dental01@inspline.com',
        name: 'Dental Office 01',
        organization: 'Bright Smile Dental Group',
        avatarColor: 'bg-orange-600',
    },
];

/** Demo system-admin accounts. System admins belong to no clinic. */
export const MOCK_ADMIN_ACCOUNTS: MockSsoAccount[] = [
    {
        email: 'admin01@inspline.com',
        name: 'System Admin 01',
        organization: 'InSpline AI — System Administration',
        avatarColor: 'bg-slate-700',
    },
];

export const GoogleLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
);

export const MicrosoftLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
    <svg className={className} viewBox="0 0 23 23" aria-hidden="true">
        <path fill="#F25022" d="M1 1h10v10H1z" />
        <path fill="#7FBA00" d="M12 1h10v10H12z" />
        <path fill="#00A4EF" d="M1 12h10v10H1z" />
        <path fill="#FFB900" d="M12 12h10v10H12z" />
    </svg>
);

/** Per-provider chrome: everything that differs between the two dialogs. */
const PROVIDER_CONFIG: Record<SsoProvider, {
    label: string;
    authUrl: string;
    fontFamily: string;
    cardClass: string;
    buttonClass: string;
    linkClass: string;
    spinnerClass: string;
    Logo: React.FC<{ className?: string }>;
    chooseTitle: string;
    chooseSubtitle: string;
    manualPlaceholder: string;
    consentTitle: string;
    consentBlurb: string;
    scopes: { icon: string; label: string }[];
    footerNote: string;
}> = {
    google: {
        label: 'Google',
        authUrl: 'accounts.google.com/o/oauth2/auth',
        fontFamily: '"Google Sans", Roboto, Arial, sans-serif',
        cardClass: 'rounded-[28px]',
        buttonClass: 'rounded-full bg-blue-600 hover:bg-blue-700 text-white',
        linkClass: 'text-blue-600 hover:bg-blue-50',
        spinnerClass: 'text-blue-600',
        Logo: GoogleLogo,
        chooseTitle: 'Choose an account',
        chooseSubtitle: 'to continue to InSpline AI',
        manualPlaceholder: 'Email or phone',
        consentTitle: 'Sign in to InSpline AI',
        consentBlurb:
            "By continuing, Google will share your name, email address and profile picture with InSpline AI. See InSpline AI's privacy policy and terms of service.",
        scopes: [
            { icon: 'account_circle', label: 'See your personal info, including your name and photo' },
            { icon: 'mail', label: 'See your primary email address' },
        ],
        footerNote: 'English (United States)',
    },
    microsoft: {
        label: 'Microsoft Teams',
        authUrl: 'login.microsoftonline.com/common/oauth2/v2.0/authorize',
        fontFamily: '"Segoe UI", "Segoe UI Web", Arial, sans-serif',
        cardClass: 'rounded-md',
        buttonClass: 'rounded-none bg-[#0067b8] hover:bg-[#005da6] text-white',
        linkClass: 'text-[#0067b8] hover:bg-slate-100',
        spinnerClass: 'text-[#0067b8]',
        Logo: MicrosoftLogo,
        chooseTitle: 'Pick an account',
        chooseSubtitle: 'to continue to InSpline AI for Microsoft Teams',
        manualPlaceholder: 'Work or school account',
        consentTitle: 'Permissions requested',
        consentBlurb:
            'InSpline AI for Microsoft Teams needs your permission before it can sign you in. Accepting these permissions means you allow this app to use your data as specified in their terms of service and privacy statement.',
        scopes: [
            { icon: 'badge', label: 'View your basic profile' },
            { icon: 'sync_lock', label: 'Maintain access to data you have given it access to' },
        ],
        footerNote: 'Microsoft privacy statement',
    },
};

type Step = 'choose' | 'another' | 'consent' | 'connecting';

interface SsoSignInMockProps {
    isOpen: boolean;
    /** Which provider's screens to render. */
    provider: SsoProvider;
    /** Accounts listed in the picker. */
    accounts: MockSsoAccount[];
    onCancel: () => void;
    /**
     * Called once the user has picked an account and approved consent. Should
     * resolve when the session is established; reject/throw with a message to
     * show the error inside the dialog.
     */
    onApprove: (email: string) => Promise<void>;
}

const SsoSignInMock: React.FC<SsoSignInMockProps> = ({ isOpen, provider, accounts, onCancel, onApprove }) => {
    const [step, setStep] = useState<Step>('choose');
    const [selected, setSelected] = useState<MockSsoAccount | null>(null);
    const [manualEmail, setManualEmail] = useState('');
    const [error, setError] = useState('');

    const config = PROVIDER_CONFIG[provider];
    const isMicrosoft = provider === 'microsoft';

    // Reset the flow every time the dialog is opened or the provider changes.
    useEffect(() => {
        if (isOpen) {
            setStep('choose');
            setSelected(null);
            setManualEmail('');
            setError('');
        }
    }, [isOpen, provider]);

    if (!isOpen) return null;

    const chooseAccount = (account: MockSsoAccount) => {
        setError('');
        setSelected(account);
        setStep('consent');
    };

    const submitManualEmail = (e: React.FormEvent) => {
        e.preventDefault();
        const email = manualEmail.trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
            setError('Enter a valid email address.');
            return;
        }
        chooseAccount({
            email,
            name: email.split('@')[0],
            organization: isMicrosoft ? 'Work or school account' : 'Google Account',
            avatarColor: 'bg-slate-600',
        });
    };

    const approve = async () => {
        if (!selected) return;
        setError('');
        setStep('connecting');
        try {
            // A short pause so the dummy "signing you in" screen is visible.
            await new Promise((resolve) => setTimeout(resolve, 900));
            await onApprove(selected.email);
        } catch (err: any) {
            setError(err?.message || `${config.label} sign-in failed. Please try again.`);
            setStep('consent');
        }
    };

    const avatar = (account: MockSsoAccount, size = 'w-9 h-9 text-sm') => (
        <div
            className={`${size} ${account.avatarColor} ${isMicrosoft ? 'rounded-sm' : 'rounded-full'} flex items-center justify-center text-white font-medium flex-shrink-0`}
        >
            {account.name.charAt(0).toUpperCase()}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
            <div
                className={`w-full max-w-[420px] bg-white ${config.cardClass} shadow-2xl overflow-hidden`}
                style={{ fontFamily: config.fontFamily }}
                role="dialog"
                aria-modal="true"
                aria-label={`Sign in with ${config.label}`}
            >
                {/* Fake browser chrome so it reads as a provider popup window */}
                <div className="flex items-center gap-2 px-5 py-3 bg-slate-100 border-b border-slate-200">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="ml-2 flex-1 truncate text-xs text-slate-500">{config.authUrl}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Demo</span>
                </div>

                <div className={`px-8 py-8 ${isMicrosoft ? 'bg-white' : ''}`}>
                    <div className={`flex flex-col mb-6 ${isMicrosoft ? 'items-start text-left' : 'items-center text-center'}`}>
                        <config.Logo className="w-8 h-8 mb-4" />
                        {step === 'choose' && (
                            <>
                                <h2 className="text-2xl text-slate-900">{config.chooseTitle}</h2>
                                <p className="text-sm text-slate-600 mt-1">{config.chooseSubtitle}</p>
                            </>
                        )}
                        {step === 'another' && (
                            <>
                                <h2 className="text-2xl text-slate-900">Sign in</h2>
                                <p className="text-sm text-slate-600 mt-1">
                                    Use your {config.label} account to continue to InSpline AI
                                </p>
                            </>
                        )}
                        {(step === 'consent' || step === 'connecting') && selected && (
                            <>
                                <h2 className="text-2xl text-slate-900">
                                    {step === 'connecting' ? 'Signing you in' : config.consentTitle}
                                </h2>
                                <div
                                    className={`mt-3 inline-flex items-center gap-2 border border-slate-300 pl-1 pr-4 py-1 ${isMicrosoft ? 'rounded-sm' : 'rounded-full'}`}
                                >
                                    {avatar(selected, 'w-7 h-7 text-xs')}
                                    <span className="text-sm text-slate-700">{selected.email}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {step === 'choose' && (
                        <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
                            {accounts.map((account) => (
                                <button
                                    key={account.email}
                                    type="button"
                                    onClick={() => chooseAccount(account)}
                                    className="w-full flex items-center gap-3 px-2 py-3 text-left hover:bg-slate-50 transition-colors"
                                >
                                    {avatar(account)}
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm text-slate-900 truncate">{account.name}</span>
                                        <span className="block text-xs text-slate-500 truncate">{account.email}</span>
                                        <span className="block text-xs text-slate-400 truncate">{account.organization}</span>
                                    </span>
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => { setError(''); setStep('another'); }}
                                className="w-full flex items-center gap-3 px-2 py-3 text-left hover:bg-slate-50 transition-colors"
                            >
                                <span
                                    className={`w-9 h-9 border border-slate-300 flex items-center justify-center text-slate-500 ${isMicrosoft ? 'rounded-sm' : 'rounded-full'}`}
                                >
                                    <span className="material-symbols-outlined text-lg">person_add</span>
                                </span>
                                <span className="text-sm text-slate-900">Use another account</span>
                            </button>
                        </div>
                    )}

                    {step === 'another' && (
                        <form onSubmit={submitManualEmail} className="space-y-6">
                            <input
                                type="email"
                                autoFocus
                                value={manualEmail}
                                onChange={(e) => setManualEmail(e.target.value)}
                                placeholder={config.manualPlaceholder}
                                className={`w-full px-4 py-3 border border-slate-400 text-slate-900 outline-none focus:border-[#0067b8] focus:ring-1 focus:ring-[#0067b8] ${isMicrosoft ? 'rounded-none' : 'rounded'}`}
                            />
                            {error && <p className="text-sm text-red-600">{error}</p>}
                            <div className="flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => { setError(''); setStep('choose'); }}
                                    className={`text-sm font-medium px-3 py-2 rounded ${config.linkClass}`}
                                >
                                    Back
                                </button>
                                <button type="submit" className={`px-6 py-2 text-sm font-medium ${config.buttonClass}`}>
                                    Next
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 'consent' && selected && (
                        <div className="space-y-5">
                            <p className="text-sm text-slate-600 leading-relaxed">{config.consentBlurb}</p>
                            <ul className="space-y-3">
                                {config.scopes.map((scope) => (
                                    <li key={scope.icon} className="flex items-start gap-3 text-sm text-slate-700">
                                        <span className="material-symbols-outlined text-slate-500 text-xl">{scope.icon}</span>
                                        <span>
                                            {scope.icon === 'mail' ? `${scope.label} (${selected.email})` : scope.label}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            {error && <p className="text-sm text-red-600">{error}</p>}
                            <div className="flex items-center justify-between pt-2">
                                <button
                                    type="button"
                                    onClick={() => setStep('choose')}
                                    className={`text-sm font-medium px-3 py-2 rounded ${config.linkClass}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={approve}
                                    className={`px-6 py-2 text-sm font-medium ${config.buttonClass}`}
                                >
                                    {isMicrosoft ? 'Accept' : 'Continue'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'connecting' && (
                        <div className="flex flex-col items-center gap-4 py-6">
                            <span className={`material-symbols-outlined animate-spin text-3xl ${config.spinnerClass}`}>
                                progress_activity
                            </span>
                            <p className="text-sm text-slate-600">Redirecting you back to InSpline AI…</p>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between px-8 py-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
                    <span>{config.footerNote}</span>
                    <button type="button" onClick={onCancel} className="hover:text-slate-700">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SsoSignInMock;
