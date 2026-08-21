import React, { useMemo, useState } from 'react';
import SsoSignInMock, {
  GoogleLogo,
  MicrosoftLogo,
  type MockSsoAccount,
  type SsoProvider,
} from '@/components/auth/SsoSignInMock';
import type { AccountUser, TeamMemberFormValues } from './types';

/** The two providers a clinic can sign in with, in the order they are listed. */
const PROVIDERS: {
  id: SsoProvider;
  label: string;
  blurb: string;
  Logo: React.FC<{ className?: string }>;
}[] = [
  {
    id: 'google',
    label: 'Google',
    blurb: 'Sign in with a Gmail or Google Workspace account.',
    Logo: GoogleLogo,
  },
  {
    id: 'microsoft',
    label: 'Microsoft Teams',
    blurb: 'Sign in with the work account the clinic uses for Teams.',
    Logo: MicrosoftLogo,
  },
];

const ROLE_OPTIONS = [
  { value: 'dental', label: 'Dental — works the verification queue' },
  { value: 'manager', label: 'Manager — maintains the clinic and its team' },
];

const inputClassName = (hasError: boolean) =>
  `w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:disabled:bg-slate-800/60 dark:disabled:text-slate-400 ${
    hasError
      ? 'border-red-400 dark:border-red-500 focus:ring-red-400'
      : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500'
  }`;

/**
 * The accounts the provider's chooser offers. Nothing here is real: the
 * suggestion is built from the member's own address so the demo picker has
 * something plausible in it, and "Use another account" takes any address.
 */
const suggestedAccounts = (
  provider: SsoProvider,
  member: AccountUser,
  clinicName: string,
  linkedEmail?: string
): MockSsoAccount[] => {
  const localPart = member.email.split('@')[0];

  const suggestion: MockSsoAccount =
    provider === 'google'
      ? {
          email: `${localPart}@gmail.com`,
          name: member.username,
          organization: 'Google Account',
          avatarColor: 'bg-blue-600',
        }
      : {
          email: member.email,
          name: member.username,
          organization: clinicName,
          avatarColor: 'bg-sky-700',
        };

  // The address already on file belongs at the top, the way a returning
  // account does in a real chooser.
  if (linkedEmail && linkedEmail !== suggestion.email) {
    return [
      { ...suggestion, email: linkedEmail, organization: 'Currently linked' },
      suggestion,
    ];
  }

  return [suggestion];
};

interface TeamMemberEditorModalProps {
  member: AccountUser;
  /** Clinic the member signs in under, shown in the Microsoft chooser. */
  clinicName: string;
  /** True when the manager is editing their own row. */
  isSelf: boolean;
  /** Per-field messages from the server, keyed by field name. */
  fieldErrors?: Record<string, string>;
  /** Resolves once saved; rejects so the dialog stays open on failure. */
  onSave: (values: TeamMemberFormValues) => Promise<void>;
  onLinkSso: (provider: SsoProvider, email: string) => Promise<void>;
  onUnlinkSso: (provider: SsoProvider) => Promise<void>;
  onClose: () => void;
}

const TeamMemberEditorModal: React.FC<TeamMemberEditorModalProps> = ({
  member,
  clinicName,
  isSelf,
  fieldErrors = {},
  onSave,
  onLinkSso,
  onUnlinkSso,
  onClose,
}) => {
  const [values, setValues] = useState<TeamMemberFormValues>({
    username: member.username,
    email: member.email,
    role: member.role,
  });
  const [isSaving, setIsSaving] = useState(false);
  /** Which provider's sign-in dialog is open, if any. */
  const [connecting, setConnecting] = useState<SsoProvider | null>(null);
  /** The provider currently being unlinked, so its button can show progress. */
  const [unlinking, setUnlinking] = useState<SsoProvider | null>(null);

  const identities = useMemo(
    () => Object.fromEntries((member.ssoIdentities ?? []).map((identity) => [identity.provider, identity])),
    [member.ssoIdentities]
  );

  const isDirty =
    values.username !== member.username || values.email !== member.email || values.role !== member.role;

  const handleChange = (key: keyof TeamMemberFormValues, value: string) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await onSave(values);
    } catch {
      // The page has already reported it; the dialog keeps the edits.
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnlink = async (provider: SsoProvider) => {
    setUnlinking(provider);
    try {
      await onUnlinkSso(provider);
    } catch {
      // Reported by the page.
    } finally {
      setUnlinking(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-member-editor-title"
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700"
      >
        <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 id="team-member-editor-title" className="text-sm font-semibold text-slate-900 dark:text-white">
              Edit {member.username}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Their details on {clinicName}, and how they sign in.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="member-username" className="block mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                Name<span className="ml-0.5 text-red-500">*</span>
              </label>
              <input
                id="member-username"
                value={values.username}
                onChange={(event) => handleChange('username', event.target.value)}
                required
                aria-invalid={fieldErrors.username ? true : undefined}
                className={inputClassName(!!fieldErrors.username)}
              />
              <p className={`mt-1 text-[11px] ${fieldErrors.username ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {fieldErrors.username || 'The name they sign in with.'}
              </p>
            </div>

            <div>
              <label htmlFor="member-email" className="block mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                Email<span className="ml-0.5 text-red-500">*</span>
              </label>
              <input
                id="member-email"
                type="email"
                value={values.email}
                onChange={(event) => handleChange('email', event.target.value)}
                required
                aria-invalid={fieldErrors.email ? true : undefined}
                className={inputClassName(!!fieldErrors.email)}
              />
              <p className={`mt-1 text-[11px] ${fieldErrors.email ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {fieldErrors.email || 'Their InSpline address.'}
              </p>
            </div>

            <div>
              <label htmlFor="member-role" className="block mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                Role
              </label>
              <select
                id="member-role"
                value={values.role}
                onChange={(event) => handleChange('role', event.target.value)}
                disabled={isSelf}
                aria-invalid={fieldErrors.role ? true : undefined}
                className={inputClassName(!!fieldErrors.role)}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className={`mt-1 text-[11px] ${fieldErrors.role ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {fieldErrors.role || (isSelf ? 'You cannot change your own role.' : 'What they may do on this clinic.')}
              </p>
            </div>

            <div>
              <label htmlFor="member-data-mode" className="block mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                Data Mode
              </label>
              <input
                id="member-data-mode"
                value={member.stediMode}
                readOnly
                disabled
                className={inputClassName(false)}
              />
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                Set by the InSpline administrator.
              </p>
            </div>
          </div>

          <section className="rounded-lg border border-slate-200 dark:border-slate-700">
            <header className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white">Sign-in accounts</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Link an account so {member.username} can sign in without a password.
              </p>
            </header>

            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {PROVIDERS.map(({ id, label, blurb, Logo }) => {
                const identity = identities[id];
                return (
                  <li key={id} className="flex items-center gap-3 px-4 py-3">
                    <Logo className="w-5 h-5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-900 dark:text-white">{label}</p>
                      <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {identity ? identity.email : blurb}
                      </p>
                    </div>

                    {identity && (
                      <button
                        type="button"
                        onClick={() => handleUnlink(id)}
                        disabled={unlinking === id}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 disabled:opacity-40"
                      >
                        {unlinking === id ? 'Removing…' : 'Remove'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setConnecting(id)}
                      className="rounded-lg border border-slate-300 dark:border-slate-600 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      {identity ? 'Change' : 'Connect'}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={!isDirty || isSaving}
              className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold shadow-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                  Saving…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">save</span>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* The same demo provider popup the sign-in page uses, run for a link. */}
      {connecting && (
        <SsoSignInMock
          isOpen
          provider={connecting}
          accounts={suggestedAccounts(connecting, member, clinicName, identities[connecting]?.email)}
          onCancel={() => setConnecting(null)}
          onApprove={async (email) => {
            await onLinkSso(connecting, email);
            setConnecting(null);
          }}
        />
      )}
    </div>
  );
};

export default TeamMemberEditorModal;
