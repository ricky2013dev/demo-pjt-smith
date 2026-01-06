import React, { useState, useEffect } from 'react';

const tabSwitchAnimation = `
  @keyframes slideOutToRight {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100px);
    }
  }

  @keyframes slideInFromLeft {
    from {
      opacity: 0;
      transform: translateX(-100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes pulseGreen {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
    }
    50% {
      box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
    }
  }

  @keyframes pulseBlue {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7), inset 0 0 10px rgba(59, 130, 246, 0.1);
    }
    50% {
      box-shadow: 0 0 0 12px rgba(59, 130, 246, 0), inset 0 0 20px rgba(59, 130, 246, 0.2);
    }
  }

  @keyframes verifiedBadgeScale {
    0% {
      opacity: 0;
      transform: scale(0.5);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes moveToVerified {
    0% {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
    50% {
      opacity: 0.8;
      transform: translateX(20px) scale(1.02);
    }
    100% {
      opacity: 0;
      transform: translateX(100px) scale(0.95);
    }
  }

  @keyframes highlightMove {
    0% {
      background-color: rgb(220, 252, 231);
      border-left-color: rgb(34, 197, 94);
    }
    50% {
      background-color: rgb(187, 247, 208);
      border-left-color: rgb(16, 185, 129);
    }
    100% {
      background-color: transparent;
      border-left-color: transparent;
    }
  }

  @keyframes fadeOut {
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  @keyframes statusChangeGlow {
    0% {
      background-color: rgb(220, 252, 231);
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5), inset 0 0 10px rgba(34, 197, 94, 0.2);
    }
    50% {
      background-color: rgb(187, 247, 208);
      box-shadow: 0 0 0 8px rgba(34, 197, 94, 0.1), inset 0 0 15px rgba(34, 197, 94, 0.3);
    }
    100% {
      background-color: transparent;
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0), inset 0 0 0px rgba(34, 197, 94, 0);
    }
  }

  .animate-status-change {
    animation: statusChangeGlow 3s ease-out forwards;
  }

  .animate-slide-out {
    animation: slideOutToRight 0.6s ease-in forwards;
  }

  .animate-slide-in {
    animation: slideInFromLeft 0.6s ease-out forwards;
  }

  .animate-pulse-green {
    animation: pulseGreen 1.5s ease-out;
  }

  .animate-pulse-blue {
    animation: pulseBlue 1.2s ease-in-out infinite;
  }

  .animate-verified-badge {
    animation: verifiedBadgeScale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .animate-move-verified {
    animation: moveToVerified 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }

  .animate-highlight-move {
    animation: highlightMove 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }

  .animate-fade-out {
    animation: fadeOut 0.8s ease-out forwards;
  }
`;

export interface VerificationDataRow {
  saiCode: string;
  refInsCode: string;
  category: string;
  fieldName: string;
  preStepValue: string;
  missing: string;
  aiCallValue: string;
  verifiedBy: string;
  isUpdating?: boolean;
  isChecking?: boolean;
}

interface VerificationDataPanelProps {
  data: VerificationDataRow[];
  showTabs?: boolean;
  title?: string;
  subtitle?: string;
  activeTab?: 'missing' | 'verified';
  onTabChange?: (tab: 'missing' | 'verified') => void;
}

const VerificationDataPanel: React.FC<VerificationDataPanelProps> = ({
  data,
  showTabs = true,
  title = "Live Verification Data Updates",
  subtitle = "Watching",
  activeTab: propActiveTab,
  onTabChange: propOnTabChange
}) => {
  const [internalTab, setInternalTab] = useState<'missing' | 'verified'>('verified');
  const [recentlyVerified, setRecentlyVerified] = useState<Set<string>>(new Set());
  const [animatingOut, setAnimatingOut] = useState<Set<string>>(new Set());
  const [showBadge, setShowBadge] = useState<Set<string>>(new Set());
  const [statusChanged, setStatusChanged] = useState<Set<string>>(new Set());

  const verificationTab = propActiveTab ?? internalTab;

  // Track newly verified items
  useEffect(() => {
    const newlyVerified = data.filter(r => r.missing === 'N' && r.isUpdating).map(r => r.saiCode);
    newlyVerified.forEach(code => {
      if (!recentlyVerified.has(code)) {
        setRecentlyVerified(prev => new Set([...prev, code]));

        // Immediately highlight status change (Yes/No change)
        setStatusChanged(prev => new Set([...prev, code]));

        // Show verified badge after a delay
        setTimeout(() => {
          setShowBadge(prev => new Set([...prev, code]));
        }, 800);

        // Let user see the verified status change and badge for 3 seconds
        // Then start animation out to let record leave the tab
        setTimeout(() => {
          setAnimatingOut(prev => new Set([...prev, code]));
        }, 3800);

        // Remove from recently verified after animation completes
        // Total time: 0ms (status highlight) + 3800ms (view status + badge) + 1200ms (animation) = 5000ms
        setTimeout(() => {
          setRecentlyVerified(prev => {
            const updated = new Set(prev);
            updated.delete(code);
            return updated;
          });
          setAnimatingOut(prev => {
            const updated = new Set(prev);
            updated.delete(code);
            return updated;
          });
          setShowBadge(prev => {
            const updated = new Set(prev);
            updated.delete(code);
            return updated;
          });
          setStatusChanged(prev => {
            const updated = new Set(prev);
            updated.delete(code);
            return updated;
          });
        }, 5000);
      }
    });
  }, [data, recentlyVerified]);

  const setVerificationTab = (tab: 'missing' | 'verified') => {
    setInternalTab(tab);
    propOnTabChange?.(tab);
  };

  const filteredData = showTabs
    ? data.filter(row =>
        verificationTab === 'missing'
          ? row.missing === 'Y'
          : row.missing === 'N'
      )
    : data;

  const missingCount = data.filter(r => r.missing === 'Y').length;
  const verifiedCount = data.filter(r => r.missing === 'N').length;

  return (
    <>
      <style>{tabSwitchAnimation}</style>
      <div className="flex-1 bg-white dark:bg-slate-900 overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700 rounded-lg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {subtitle} {data.length} fields
        </p>
      </div>

      {/* Verification Tabs - Only show if showTabs is true */}
      {showTabs && (
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setVerificationTab('missing')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-2 ${
              verificationTab === 'missing'
                ? 'bg-status-red/10 text-status-red border border-status-red/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-sm">pending</span>
            Missing Fields ({missingCount})
          </button>
          <button
            onClick={() => setVerificationTab('verified')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-2 ${
              verificationTab === 'verified'
                ? 'bg-status-green/10 text-status-green border border-status-green/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-sm">check_circle</span>
            Verified Fields ({verifiedCount})
          </button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-400 w-20">Insurance Code</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-400 w-40">Field Name</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-400 flex-1">Value</th>
              <th className="px-3 py-2 text-center font-medium text-slate-600 dark:text-slate-400 w-16">Status</th>
              <th className="px-3 py-2 text-center font-medium text-slate-600 dark:text-slate-400 w-24">Verified By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredData.map((row, index) => (
              <tr
                key={index}
                className={`transition-all duration-500 ${
                  row.isChecking
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 animate-pulse-blue shadow-lg'
                    : row.isUpdating
                      ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 animate-pulse-green'
                      : animatingOut.has(row.saiCode)
                        ? 'bg-green-100 dark:bg-green-900/40 border-l-4 border-green-500 animate-move-verified animate-highlight-move'
                        : recentlyVerified.has(row.saiCode)
                          ? 'bg-green-100 dark:bg-green-900/40 border-l-4 border-green-500'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <td className="px-3 py-2 font-mono text-slate-900 dark:text-white w-20">
                  <div className="flex items-center gap-2">
                    {row.isChecking && (
                      <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {row.refInsCode}
                  </div>
                </td>
                <td className="px-3 py-2 text-slate-700 dark:text-slate-300 w-40">
                  <div className="flex items-center gap-2">
                    {row.fieldName}
                    {row.isChecking && (
                      <span className="text-blue-600 dark:text-blue-400 text-[10px] font-semibold animate-pulse">
                        Checking...
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-slate-900 dark:text-white font-medium flex-1">
                  {row.aiCallValue || (
                    <span className="text-slate-400 dark:text-slate-500 italic">Pending...</span>
                  )}
                </td>
                <td className={`px-3 py-2 text-center w-16 ${
                  statusChanged.has(row.saiCode) ? 'animate-status-change' : ''
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded transition-all ${
                      statusChanged.has(row.saiCode)
                        ? 'bg-green-200/50 dark:bg-green-800/30 ring-2 ring-green-400 dark:ring-green-500'
                        : ''
                    } ${row.aiCallValue
                      ? row.verifiedBy === 'CALL'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-status-green'
                      : 'text-status-red'
                      }`}>
                      {row.aiCallValue ? 'Yes' : 'No'}
                    </span>
                    {(recentlyVerified.has(row.saiCode) || animatingOut.has(row.saiCode)) && (
                      <div className={`flex items-center gap-1 text-[10px] font-semibold transition-all ${
                        animatingOut.has(row.saiCode)
                          ? 'text-green-700 dark:text-green-300 animate-bounce'
                          : 'text-green-600 dark:text-green-400 animate-pulse'
                      }`}>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        Moving to Verified
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-center w-24">
                  {row.aiCallValue && (
                    <div className="flex items-center justify-center">
                      {row.verifiedBy === 'CALL' ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-[10px] font-semibold transition-all ${
                          showBadge.has(row.saiCode) ? 'animate-verified-badge' : ''
                        }`}>
                          <span className="material-symbols-outlined text-xs">phone</span>
                          AI Call
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-[10px] font-semibold transition-all ${
                          showBadge.has(row.saiCode) ? 'animate-verified-badge' : ''
                        }`}>
                          <span className="material-symbols-outlined text-xs">api</span>
                          API
                        </span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
};

export default VerificationDataPanel;
