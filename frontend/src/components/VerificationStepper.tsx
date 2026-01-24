import React from 'react';
import { VerificationStatus } from '@/utils/transactionStatus';
import { VERIFICATION_STATUS_LABELS } from '@/constants/verificationStatus';

interface VerificationStepperProps {
    status: VerificationStatus | undefined; // Allow undefined to handle cases where status isn't ready
    layout?: 'detail' | 'table'; // 'detail' for PatientDetail (stacked), 'table' for PatientGuide (inline)
    className?: string;
}

const VerificationStepper: React.FC<VerificationStepperProps> = ({
    status,
    layout = 'detail',
    className = ''
}) => {

    // Helper to calculate current step number
    const getVerificationStep = () => {
        if (!status) return 1;

        if (status.saveToPMS === 'completed' || status.saveToPMS === 'in_progress') return 4;
        if (status.aiAnalysisAndCall === 'completed' || status.aiAnalysisAndCall === 'in_progress') return 3;
        if (status.apiVerification === 'completed' || status.apiVerification === 'in_progress') return 2;
        if (status.fetchPMS === 'completed') return 2;
        if (status.fetchPMS === 'in_progress') return 1;
        return 1;
    };

    const currentStep = getVerificationStep();

    // Define steps configuration
    const steps = [
        { key: 'fetchPMS', icon: 'download', label: VERIFICATION_STATUS_LABELS.FETCH_PMS },
        { key: 'apiVerification', icon: 'api', label: VERIFICATION_STATUS_LABELS.API_VERIFICATION },
        { key: 'aiAnalysisAndCall', icon: 'smart_toy', label: VERIFICATION_STATUS_LABELS.AI_ANALYSIS_AND_CALL },
        { key: 'saveToPMS', icon: 'save', label: VERIFICATION_STATUS_LABELS.SAVE_TO_PMS },
    ] as const;

    // Completion checks helpers
    const isCompleted = (key: keyof VerificationStatus) => status?.[key] === 'completed';
    const isInProgress = (key: keyof VerificationStatus) => status?.[key] === 'in_progress';

    // Render step count text
    const renderStepCount = () => (
        <span className={`font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap ${layout === 'detail' ? 'text-[10px]' : 'text-xs'}`}>
            Step {currentStep} of 4
        </span>
    );

    return (
        <div className={`flex ${layout === 'table' ? 'items-center gap-3' : 'flex-col'} ${className}`}>

            {/* Step Count - Top Right for Detail view */}
            {layout === 'detail' && (
                <div className="flex items-center justify-end mb-1">
                    {renderStepCount()}
                </div>
            )}

            {/* Step Count - Left for Table view */}
            {layout === 'table' && renderStepCount()}

            {/* Stepper Visualization */}
            <div className={`relative ${layout === 'detail' ? 'py-1' : ''} flex-1`}>
                {/* Connector Lines */}
                {/* We have 4 steps, so 3 connections: 1-2, 2-3, 3-4 */}
                {/* Positions: 12.5%, 37.5%, 62.5%, 87.5% based on 4 items each taking 25% width */}
                {[0, 1, 2].map((index) => {
                    const stepKey = steps[index].key;
                    const isLineActive = isCompleted(stepKey);

                    return (
                        <div
                            key={index}
                            className={`absolute top-4 h-0.5 transition-colors ${isLineActive ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                                }`}
                            style={{
                                left: `${12.5 + (index * 25)}%`,
                                width: '25%'
                            }}
                        />
                    );
                })}

                {/* Steps */}
                <div className="relative flex items-start justify-between">
                    {steps.map((step) => {
                        const stepStatus = status?.[step.key] || 'pending';
                        const completed = stepStatus === 'completed';
                        const inProgress = stepStatus === 'in_progress';

                        // Styles
                        let bgColor = 'bg-slate-300 dark:bg-slate-600'; // Default pending
                        let textColor = 'text-slate-600 dark:text-slate-400';
                        let iconColor = ''; // Inherits usually

                        if (completed) {
                            bgColor = 'bg-green-500 dark:bg-green-600';
                            textColor = 'text-white';
                        } else if (inProgress) {
                            bgColor = 'bg-blue-500 dark:bg-blue-600';
                            textColor = 'text-white';
                        }

                        // Icon
                        const iconName = completed ? 'check' : (inProgress ? 'sync' : step.icon);

                        // Text below circle
                        const labelColor = (completed || inProgress)
                            // Note: Original table view used 'text-slate-500' always for label, possibly error?
                            // Detail view used: statusColor which is green/blue/slate.
                            // Let's stick to Detail view logic as it is "richer".
                            ? (completed ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400')
                            : 'text-slate-600 dark:text-slate-400';

                        // In table view original: label was always slate-500/400.
                        // "text-[8px] text-slate-500 dark:text-slate-400"
                        // Let's use the slightly "cleaner" table style for Table variant?
                        // User wants "identical component". Let's unify on the nicer one (Detail view uses colors for labels).
                        // But if it's too colorful in a table row, it might be distracting.
                        // Let's honor the "variant".

                        const finalLabelColor = layout === 'detail'
                            ? labelColor
                            : 'text-slate-500 dark:text-slate-400';

                        // Text size
                        const labelSize = layout === 'detail' ? 'text-[9px]' : 'text-[8px]';

                        return (
                            <div key={step.key} className="flex flex-col items-center" style={{ width: '25%' }}>
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${bgColor} ${textColor} shrink-0 relative z-10 border-2 border-white dark:border-slate-900 transition-colors`}>
                                    <span className={`material-symbols-outlined text-sm ${inProgress ? 'animate-spin' : ''}`}>
                                        {iconName}
                                    </span>
                                </div>
                                <p className={`${labelSize} ${finalLabelColor} mt-1 text-center leading-tight px-0.5 whitespace-nowrap`}>
                                    {step.label}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default VerificationStepper;
