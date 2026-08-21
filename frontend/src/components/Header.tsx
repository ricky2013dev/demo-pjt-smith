import React, { useMemo } from 'react';
import { useLocation } from 'wouter';
import { useStediApi } from '@/context/StediApiContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';

/** How each role is named and tinted next to the user's name. */
const ROLE_BADGES: Record<string, { label: string; className: string }> = {
  admin: { label: 'System Admin', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  manager: { label: 'Manager', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  dental: { label: 'Dental', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
};

/** What the header shows about the person signed in. */
interface HeaderUser {
  name: string;
  email: string;
  username: string;
  stediMode?: string;
  role?: string;
  /** Clinic the user belongs to, as returned by /api/auth/verify. */
  provider?: {
    id?: string;
    name: string;
    npiNumber?: string;
  } | null;
}

interface HeaderProps {
  onLogoClick?: () => void;
  /**
   * Optional. The header reads the session itself, so a page only passes this
   * to override what is shown.
   */
  currentUser?: Partial<HeaderUser> | null;
  onLogout?: () => void;
  onLoginClick?: () => void;
  onAdminLoginClick?: () => void;
  mode?: 'b2b' | 'admin';
}

const Header: React.FC<HeaderProps> = ({ onLogoClick, currentUser, onLogout, onLoginClick, onAdminLoginClick, mode = 'b2b' }) => {
  const [location, navigate] = useLocation();
  const { stediMode, setStediMode } = useStediApi();
  const { user } = useCurrentUser();

  const isPatientDetailPage = location === '/b2b-agent/patient-detail';

  /**
   * Every page gets the same header: it falls back to the verified session, so
   * a page that passes nothing still names the signed-in user. Anything a page
   * does pass wins, field by field.
   */
  const activeUser: HeaderUser | null = useMemo(() => {
    const fromSession: HeaderUser | null = user
      ? {
          name: user.username,
          email: user.email,
          username: user.username,
          stediMode: user.stediMode,
          role: user.role,
          provider: user.account ? { id: user.account.id, name: user.account.name } : user.provider ?? null,
        }
      : null;

    if (!currentUser) return fromSession;

    const overrides = Object.fromEntries(
      Object.entries(currentUser).filter(([, value]) => value !== undefined)
    );
    return { ...(fromSession ?? ({} as HeaderUser)), ...overrides } as HeaderUser;
  }, [currentUser, user]);

  // Computed equivalent using useMemo - if stediMode is not 'mockup', real data is on
  const isRealDataOn = useMemo(() => {
    return activeUser?.stediMode !== undefined && activeUser?.stediMode !== 'mockup';
  }, [activeUser?.stediMode]); // Dependencies are explicit

  // Two-letter avatar label, e.g. "dental01" -> "DE", "Jane Doe" -> "JD".
  const userInitials = useMemo(() => {
    const source = (activeUser?.name || activeUser?.username || '').trim();
    if (!source) return '?';
    const parts = source.split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
  }, [activeUser?.name, activeUser?.username]);

  const clinicName = activeUser?.provider?.name;
  const roleBadge = activeUser?.role ? ROLE_BADGES[activeUser.role] : undefined;
  // The system admin has no clinic; saying so beats "no clinic assigned".
  const affiliation = clinicName || (mode === 'admin' ? 'System administration' : 'No clinic assigned');

  return (
    <header className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-3 shrink-0 sticky top-0 z-50">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-8 flex-1">
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-70 transition-opacity w-fit"
            onClick={onLogoClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onLogoClick?.();
              }
            }}
          >
            {/* Robot Logo */}
            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl text-slate-700 dark:text-slate-300">
                smart_toy
              </span>
            </div>

            {/* Title and Subtitle */}
            <div>
              <h1 className="flex items-baseline gap-1">

                <span className="font-handwriting tracking-wide rotate-[-0deg] font-bold text-orange-600 dark:text-orange-500 tracking-tight text-lg">InSpline</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">AI</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] font-medium uppercase tracking-wider mt-0.5">
                {mode === 'admin' ? 'User Management' : 'Insurance Verification'}
              </p>
            </div>
          </div>

          {/* Navigation Links - b2b navigation lives in the side nav */}
          {onLogout && mode === 'admin' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/admin/users')}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">manage_accounts</span>
                User Management
              </button>
            </div>
          )}
        </div>


        {/* HIPAA Compliance, User Info and Logout */}
        {onLogout ? (
          <div className="flex items-center gap-4">


            {/* HIPAA Compliance Notice - Hover to expand */}
            <div className="group relative">
              {/* Compact Title - Always Visible */}
              <div className="flex items-center gap-2 px-3 py-1.5  dark:bg-blue-900/40 rounded-lg cursor-pointer dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors">
                <span className="material-symbols-outlined text-sm text-blue-600 dark:text-blue-400">verified_user</span>
                <span className="text-xs font-semibold text-blue-900 dark:text-blue-100 whitespace-nowrap">
                  HIPAA Compliance
                </span>
              </div>

              {/* Expanded Message on Hover */}
              <div className="absolute top-full right-0 mt-2 w-96 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-blue-50 dark:bg-blue-900/95 border border-blue-200 dark:border-blue-800 rounded-lg shadow-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-lg text-blue-600 dark:text-blue-400">verified_user</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        HIPAA Compliance
                      </h3>
                      <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                        This system follows HIPAA (Health Insurance Portability and Accountability Act) compliance standards to ensure the security and privacy of protected health information (PHI). All data is encrypted and access is monitored.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* Stedi API Menu - clinic manager (and system admin) only */}
            {(activeUser?.role === 'manager' || activeUser?.role === 'admin') && isPatientDetailPage && (
              <div className="group relative">
                {/* Main Button */}
                <button
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${stediMode === 'real-data'
                    ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                    : stediMode === 'test-data'
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  title="Stedi API Settings"
                >
                  <span className="material-symbols-outlined text-xs">
                    {stediMode === 'real-data' ? 'cloud_done' : stediMode === 'test-data' ? 'cloud_sync' : 'cloud_off'}
                  </span>
                  Stedi: {stediMode === 'real-data' ? 'Real' : stediMode === 'test-data' ? 'Test' : 'Mock'}
                  <span className="material-symbols-outlined text-xs">expand_more</span>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 mt-1 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1">
                    {/* Mockup Option */}
                    <button
                      onClick={() => setStediMode('mockup')}
                      className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center gap-2 ${stediMode === 'mockup' ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                    >
                      <span className="material-symbols-outlined text-sm">cloud_off</span>
                      Mockup Mode
                    </button>

                    {/* Test Data Option */}
                    <button
                      onClick={() => setStediMode('test-data')}
                      className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center gap-2 ${stediMode === 'test-data' ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                    >
                      <span className="material-symbols-outlined text-sm">cloud_sync</span>
                      Test Data (John Doe)
                    </button>

                    {/* Real Data Option */}
                    <button
                      onClick={() => setStediMode('real-data')}
                      className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center gap-2 ${stediMode === 'real-data' ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                    >
                      <span className="material-symbols-outlined text-sm">cloud_done</span>
                      Real Patient Data
                    </button>

                    {/* Divider */}
                    <div className="border-t border-slate-200 dark:border-slate-700 my-1" />

                    {/* Stedi Check Option */}
                    <button
                      onClick={() => navigate('/admin/stedi-api-tester')}
                      className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">api</span>
                      Stedi API Tester
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Signed-in user: profile icon, username and clinic */}
            {activeUser && (
              <div
                className="flex items-center gap-2.5 pl-4 border-l border-slate-200 dark:border-slate-700"
                title={`${activeUser.name}${roleBadge ? ` — ${roleBadge.label}` : ''}${activeUser.email ? ` (${activeUser.email})` : ''}${clinicName ? ` — ${clinicName}` : ''}`}
              >
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-300/60 dark:border-slate-600 flex items-center justify-center">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 tracking-wide">
                      {userInitials}
                    </span>
                  </div>
                  {/* Green dot mirrors the old person-icon tint: real data mode is on. */}
                  {isRealDataOn && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-slate-50 dark:border-slate-900"
                      title="Real data mode"
                    />
                  )}
                </div>

                <div className="leading-tight min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[180px]">
                      {activeUser.name}
                    </span>
                    {roleBadge && (
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${roleBadge.className}`}>
                        {roleBadge.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined leading-none" style={{ fontSize: '12px' }}>
                      {clinicName ? 'domain' : mode === 'admin' ? 'shield_person' : 'domain_disabled'}
                    </span>
                    <span className="truncate max-w-[170px]">
                      {affiliation}
                    </span>
                  </div>
                </div>
              </div>
            )}




            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 text-xs font-medium transition-colors"
              title="Logout"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Logout
            </button>
          </div>
        ) : onLoginClick ? (
          /* Login Buttons for Home Page */
          <div className="flex items-center gap-3">
            <button
              onClick={onLoginClick}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 group"
            >
              <span>Dental Office</span>
              <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
            </button>
            {onAdminLoginClick && (
              <button
                onClick={onAdminLoginClick}
                className="px-3 py-1.5  text-xs font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 group"
              >
                <span className="material-symbols-outlined text-sm">settings</span>

              </button>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
};

export default Header;
