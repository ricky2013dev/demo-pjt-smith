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

        if (status.saveToPMS === 'completed' || status.saveToPMS === 'in_progress') return 5;
        if (status.callCenter === 'completed' || status.callCenter === 'in_progress') return 4;
        if (status.documentAnalysis === 'completed' || status.documentAnalysis === 'in_progress') return 3;
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
        { key: 'documentAnalysis', icon: 'description', label: VERIFICATION_STATUS_LABELS.DOCUMENT_ANALYSIS },
        { key: 'callCenter', icon: 'phone', label: VERIFICATION_STATUS_LABELS.CALL_CENTER },
        { key: 'saveToPMS', icon: 'save', label: VERIFICATION_STATUS_LABELS.SAVE_TO_PMS },
    ] as const;

    // Completion checks helpers
    const isCompleted = (key: keyof VerificationStatus) => status?.[key] === 'completed';
    const isInProgress = (key: keyof VerificationStatus) => status?.[key] === 'in_progress';

    // Render step count text
    const renderStepCount = () => (
        <span className={`font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap ${layout === 'detail' ? 'text-[10px]' : 'text-xs'}`}>
            Step {currentStep} of 5
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
                {/* We have 5 steps, so 4 connections: 1-2, 2-3, 3-4, 4-5 */}
                {/* Positions: 10%, 30%, 50%, 70% based on 5 items each taking 20% width centered at 10, 30, 50, 70, 90 */}
                {/* Step centers: 
            Step 1: 10%
            Step 2: 30%
            Step 3: 50%
            Step 4: 70%
            Step 5: 90%
           Lines connect centers.
           Line 1 (1->2): Left 10%, Width 20% (from 10 to 30)
           Wait, original code used Left 10%, Width 18% (to leave gap?) or 15% in Table view.
           Let's use consistent logic.
        */}

                {[0, 1, 2, 3].map((index) => {
                    // Line between step[index] and step[index+1]
                    // Logic for line color: if step[index] is completed, line is colored? 
                    // Original code: `isFetchPMSCompleted ? 'bg-green-500' : ...` for first line.
                    // So if the starting point is completed, the line is completed?
                    // Actually, usually line is filled if *both* are completed or if we are progressing to next.
                    // Original Detail: isFetchPMSCompleted() ? green : slate.
                    // Original Table: isFetchPMSCompleted ? green : slate.

                    const stepKey = steps[index].key;
                    const isLineActive = isCompleted(stepKey);

                    return (
                        <div
                            key={index}
                            className={`absolute top-4 h-0.5 transition-colors ${isLineActive ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                                }`}
                            style={{
                                left: `${10 + (index * 20)}%`,
                                width: '20%'
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
                            <div key={step.key} className="flex flex-col items-center" style={{ width: '20%' }}>
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
