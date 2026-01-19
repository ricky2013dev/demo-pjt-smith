import React, { useCallback, useState } from 'react';

interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  label?: string;
  required?: boolean;
  validateOnBlur?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const validateEmail = (email: string): boolean => {
  if (!email) return true;
  return EMAIL_REGEX.test(email);
};

const EmailInput: React.FC<EmailInputProps> = ({
  value,
  onChange,
  id,
  name,
  placeholder = 'email@example.com',
  disabled = false,
  error,
  className,
  label,
  required = false,
  validateOnBlur = true,
  onValidationChange,
}) => {
  const [internalError, setInternalError] = useState<string>('');
  const [touched, setTouched] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);

      if (touched && internalError) {
        const isValid = validateEmail(newValue);
        if (isValid) {
          setInternalError('');
          onValidationChange?.(true);
        }
      }
    },
    [onChange, touched, internalError, onValidationChange]
  );

  const handleBlur = useCallback(() => {
    setTouched(true);

    if (validateOnBlur && value) {
      const isValid = validateEmail(value);
      if (!isValid) {
        setInternalError('Please enter a valid email address');
        onValidationChange?.(false);
      } else {
        setInternalError('');
        onValidationChange?.(true);
      }
    }
  }, [validateOnBlur, value, onValidationChange]);

  const displayError = error || internalError;

  const inputClassName = className ??
    'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm';

  const labelClassName = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';
  const errorClassName = 'text-xs text-red-500 mt-1';

  return (
    <div>
      {label && (
        <label htmlFor={id} className={labelClassName}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type="email"
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={`${inputClassName} ${displayError ? 'border-red-500 focus:ring-red-500' : ''}`}
        aria-invalid={!!displayError}
        aria-describedby={displayError ? `${id}-error` : undefined}
        autoComplete="email"
      />
      {displayError && (
        <p id={`${id}-error`} className={errorClassName}>
          {displayError}
        </p>
      )}
    </div>
  );
};

export { validateEmail };
export default EmailInput;
