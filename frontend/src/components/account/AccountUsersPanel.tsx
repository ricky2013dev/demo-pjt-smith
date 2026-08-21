import React, { useState } from 'react';
import { GoogleLogo, MicrosoftLogo, type SsoProvider } from '@/components/auth/SsoSignInMock';
import TeamMemberEditorModal from './TeamMemberEditorModal';
import type { Account, AccountUser, SsoIdentity, TeamMemberFormValues } from './types';

interface AccountUsersPanelProps {
  account: Account;
  users: AccountUser[];
  /** Highlights the row of the signed-in user. */
  currentUserId?: string;
  /** Dental users read the team; only a manager may change it. */
  canEdit?: boolean;
  /** Per-field messages from the server, keyed by field name. */
  fieldErrors?: Record<string, string>;
  /** Resolves once saved; rejects so the editor keeps the edits. */
  onSaveMember?: (userId: string, values: TeamMemberFormValues) => Promise<void>;
  onLinkSso?: (userId: string, provider: SsoProvider, email: string) => Promise<void>;
  onUnlinkSso?: (userId: string, provider: SsoProvider) => Promise<void>;
}

/** Clinic roles. The system admin belongs to no account, so it never shows up here. */
const ROLE_STYLES: Record<string, string> = {
  manager: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  dental: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
};

const roleClassName = (role: string) =>
  ROLE_STYLES[role] ?? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';

/** The logo standing in for each linked identity in the table. */
const PROVIDER_LOGOS: Record<string, React.FC<{ className?: string }>> = {
  google: GoogleLogo,
  microsoft: MicrosoftLogo,
};

/** Chips for the accounts a member can sign in with, password included. */
const SignInMethods: React.FC<{ identities: SsoIdentity[] }> = ({ identities }) => {
  if (identities.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <span className="material-symbols-outlined text-sm">password</span>
        Password only
      </span>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {identities.map((identity) => {
        const Logo = PROVIDER_LOGOS[identity.provider];
        return (
          <span
            key={identity.provider}
            title={identity.email}
            className="inline-flex max-w-[15rem] items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-600 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300"
          >
            {Logo ? <Logo className="w-3.5 h-3.5" /> : null}
            <span className="truncate">{identity.email}</span>
          </span>
        );
      })}
    </span>
  );
};

const AccountUsersPanel: React.FC<AccountUsersPanelProps> = ({
  account,
  users,
  currentUserId,
  canEdit = false,
  fieldErrors = {},
  onSaveMember,
  onLinkSso,
  onUnlinkSso,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  // The row is re-read from `users` so a save refreshes the open editor.
  const editing = users.find((user) => user.id === editingId) ?? null;

  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-xl text-slate-500 dark:text-slate-400">group</span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Team Members</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              The logins on {account.name}.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {users.length} {users.length === 1 ? 'member' : 'members'}
        </span>
      </header>

      {users.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          No team members are assigned to this clinic yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-medium">Member</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Data Mode</th>
                <th className="px-5 py-3 font-medium">Sign-in</th>
                {canEdit && <th className="px-5 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                    <span className="flex items-center gap-2">
                      {user.username}
                      {user.id === currentUserId && (
                        <span className="px-1.5 py-0.5 rounded-full bg-slate-900 dark:bg-white text-[10px] font-bold text-white dark:text-slate-900">
                          You
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{user.email}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${roleClassName(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{user.stediMode}</td>
                  <td className="px-5 py-3">
                    <SignInMethods identities={user.ssoIdentities ?? []} />
                  </td>
                  {canEdit && (
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingId(user.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-600 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500">
        {canEdit
          ? 'Managers maintain the clinic’s details and their team’s. Adding and removing users is done by the InSpline system administrator.'
          : 'Managers maintain the clinic’s details; dental users work the verification queue. Adding and removing users is done by the InSpline system administrator.'}
      </p>

      {canEdit && editing && onSaveMember && onLinkSso && onUnlinkSso && (
        <TeamMemberEditorModal
          member={editing}
          clinicName={account.name}
          isSelf={editing.id === currentUserId}
          fieldErrors={fieldErrors}
          onSave={(values) => onSaveMember(editing.id, values)}
          onLinkSso={(provider, email) => onLinkSso(editing.id, provider, email)}
          onUnlinkSso={(provider) => onUnlinkSso(editing.id, provider)}
          onClose={() => setEditingId(null)}
        />
      )}
    </section>
  );
};

export default AccountUsersPanel;
