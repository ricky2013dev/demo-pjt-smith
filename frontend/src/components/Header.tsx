import React, { useMemo } from 'react';
import { useLocation } from 'wouter';
import { useStediApi } from '@/context/StediApiContext';

interface HeaderProps {
  onLogoClick?: () => void;
  currentUser?: {
    name: string;
    email: string;
    username: string;
    dataSource?: string;
  } | null;
  onLogout?: () => void;
  onLoginClick?: () => void;
  onInsuranceLoginClick?: () => void;
  onAdminLoginClick?: () => void;
  mode?: 'b2b' | 'insurance' | 'admin';
}

const Header: React.FC<HeaderProps> = ({ onLogoClick, currentUser, onLogout, onLoginClick, onInsuranceLoginClick, onAdminLoginClick, mode = 'b2b' }) => {
  const [, navigate] = useLocation();
  const { isApiEnabled, toggleApi } = useStediApi();

  // Computed equivalent using useMemo
  const isRealDataOn = useMemo(() => {
    return !!currentUser?.dataSource
  }, [currentUser?.dataSource]); // Dependencies are explicit

  const HeaderMenuBtn: React.FC<{ buttonType: "patient" | "dashboard" }> = ({ buttonType }) => {
    const urlPath = buttonType === "patient" ? "/b2b-agent/patient-appointments" : "/b2b-agent/dashboard";
    const buttonLabel = buttonType === "patient" ? "Patient Appointments" : "Dashboard";

      return (
          <button
            onClick={() => navigate(`${urlPath}`)}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">dashboard</span>
            {buttonLabel}
          </button>
      );
    }


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

                <span className="font-handwriting tracking-wide rotate-[-0deg] font-bold text-orange-600 dark:text-orange-500 tracking-tight text-lg">Smith</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">AI Center</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] font-medium uppercase tracking-wider mt-0.5">
                {mode === 'admin' ? 'User Management' : 'Insurance Verification'}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          {onLogout && (
            <div className="flex items-center gap-2">
              {mode === 'admin' ? (
                <>
                  <button
                    onClick={() => navigate('/admin/users')}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">manage_accounts</span>
                    User Management
                  </button>
                </>
              ) : mode === 'insurance' ? (
                <>
                  <button
                    onClick={() => navigate('/insurance/dashboard')}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">dashboard</span>
                    Call Dashboard
                  </button>
                </>
              ) : (
                <>
        
                {!isRealDataOn && <HeaderMenuBtn buttonType="dashboard" />}
                <HeaderMenuBtn buttonType="patient" />
                </>
              )}
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


            {/* API Toggle Button */}
            {isRealDataOn && (
              <button
                onClick={toggleApi}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${isApiEnabled
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60'
                  : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                  }`}
                title={isApiEnabled ? 'API Enabled - Using Stedi API' : 'API Disabled - Using mock data'}
              >
                <span className="material-symbols-outlined text-xs">
                  {isApiEnabled ? 'cloud_done' : 'cloud_off'}
                </span>
                Stedi API {isApiEnabled ? 'On' : 'Off'}
              </button>
            )}
            
            {/* User Info */}
            {currentUser && (
              <div className="text-right">
                <div className="flex items-center">
                  <span className="material-symbols-outlined text-md">person</span>
            
                  <span className="text-xs ml-1">{currentUser.name}</span>
                  {isRealDataOn && (<span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500 text-white shadow-sm animate-pulse">
                    Data Mode On
                  </span>)}
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
            {onInsuranceLoginClick && isRealDataOn && (
              <button
                onClick={onInsuranceLoginClick}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 group"
              >
                <span className="material-symbols-outlined text-sm">phone</span>
                <span>Insurance Agent</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
              </button>
            )}
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
