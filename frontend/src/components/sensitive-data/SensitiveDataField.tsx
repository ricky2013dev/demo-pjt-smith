import React, { useState } from 'react';
import { decryptSensitiveData, reportSensitiveDataView } from '@/services/sensitiveDataService';

interface SensitiveDataFieldProps {
  patientId: string;
  fieldName: string;
  maskedValue: string;
  label: string;
  isEncrypted?: boolean;
  /**
   * Plain value to reveal when the decrypt endpoint has no record for this
   * patient - the mockup dataset is served from JSON rather than the database.
   * Ignored when it is itself masked, so real data mode stays server-authoritative.
   */
  fallbackValue?: string;
  /**
   * Reveal `fallbackValue` without asking the server. For values that only live
   * in the mockup fixture - the subscriber's SSN and date of birth - there is no
   * column to decrypt, so the request would only ever fail.
   */
  localOnly?: boolean;
  autoHideDelay?: number; // milliseconds, default 10000 (10 seconds)
}

const SensitiveDataField: React.FC<SensitiveDataFieldProps> = ({
  patientId,
  fieldName,
  maskedValue,
  label,
  isEncrypted = false,
  fallbackValue,
  localOnly = false,
  autoHideDelay = 10000
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [decryptedValue, setDecryptedValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleViewClick = async () => {
    if (isRevealed) {
      // Hide the sensitive data
      setIsRevealed(false);
      setDecryptedValue('');
      return;
    }

    // Show the sensitive data
    setIsLoading(true);
    setError('');

    const revealFor = (value: string) => {
      setDecryptedValue(value);
      setIsRevealed(true);

      // Auto-hide after specified delay for security (HIPAA compliance)
      setTimeout(() => {
        setIsRevealed(false);
        setDecryptedValue('');
      }, autoHideDelay);
    };

    if (localOnly) {
      revealFor(fallbackValue || maskedValue);
      reportSensitiveDataView({ patientId, fieldName, source: 'local' });
      setIsLoading(false);
      return;
    }

    try {
      revealFor(await decryptSensitiveData(patientId, fieldName));
    } catch (err: any) {
      // Mockup patients are not in the database; fall back to the local value.
      // The decrypt endpoint never ran, so the reveal is reported here instead.
      if (fallbackValue && !fallbackValue.includes('*')) {
        revealFor(fallbackValue);
        reportSensitiveDataView({ patientId, fieldName, source: 'fallback' });
      } else {
        setError(err.message || 'Failed to decrypt');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isEncrypted) {
    // If data is not encrypted, just show it normally
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-700 dark:text-slate-300">{maskedValue}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-700 dark:text-slate-300 font-mono">
        {isRevealed ? decryptedValue : maskedValue}
      </span>

      <button
        onClick={handleViewClick}
        disabled={isLoading}
        className="px-2 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
        title={isRevealed ? 'Hide sensitive data' : 'View sensitive data (HIPAA protected)'}
      >
        {isLoading ? (
          <>
            <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
            <span>Loading...</span>
          </>
        ) : isRevealed ? (
          <>
            <span className="material-symbols-outlined text-sm">visibility_off</span>
            <span>Hide</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-sm">visibility</span>
            <span>View</span>
          </>
        )}
      </button>

      {isRevealed && (
        <span className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">schedule</span>
          Auto-hides in 10s
        </span>
      )}

      {error && (
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      )}
    </div>
  );
};

export default SensitiveDataField;
