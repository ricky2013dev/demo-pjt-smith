import React, { useEffect, useState } from 'react';

// Type definition for payer list item
interface Payer {
    id: string;
    payerId: string;
    name: string;
    faxNumber?: string;
    phoneNumber?: string;
}

interface InsuranceProviderSelectProps {
    value: string; // This should be the payerId
    onChange: (payerId: string, payerName: string) => void;
    className?: string;
    error?: boolean;
    disabled?: boolean;
    id?: string;
    label?: string;
    required?: boolean;
}

const InsuranceProviderSelect: React.FC<InsuranceProviderSelectProps> = ({
    value,
    onChange,
    className = '',
    error = false,
    disabled = false,
    id,
    label,
    required = false,
}) => {
    const [payers, setPayers] = useState<Payer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayers = async () => {
            try {
                const response = await fetch('/api/payers');
                if (response.ok) {
                    const data = await response.json();
                    setPayers(data);
                } else {
                    console.error('Failed to fetch payers');
                }
            } catch (error) {
                console.error('Error fetching payers:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPayers();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        const selectedPayer = payers.find((p) => p.payerId === selectedId);
        onChange(selectedId, selectedPayer?.name || '');
    };

    const inputClasses = `w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-slate-600'
        } ${className}`;

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className={`block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1`}>
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <select
                id={id}
                value={value}
                onChange={handleChange}
                disabled={disabled || loading}
                className={inputClasses}
                required={required}
            >
                <option value="">{loading ? 'Loading Payers...' : 'Select Payer'}</option>
                {payers.map((payer) => (
                    <option key={payer.id} value={payer.payerId}>
                        {payer.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default InsuranceProviderSelect;
