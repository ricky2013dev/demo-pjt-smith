import React, { useCallback, useRef } from 'react';

interface PhoneInputProps {
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
}

const formatPhoneNumber = (digits: string): string => {
  const cleaned = digits.replace(/\D/g, '').slice(0, 10);

  if (cleaned.length === 0) return '';
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
};

const getDigitsOnly = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 10);
};

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  id,
  name,
  placeholder = '123-456-7890',
  disabled = false,
  error,
  className,
  label,
  required = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const cursorPosition = input.selectionStart ?? 0;
      const previousValue = value;
      const newRawValue = e.target.value;

      const digits = getDigitsOnly(newRawValue);
      const formattedValue = formatPhoneNumber(digits);

      onChange(formattedValue);

      requestAnimationFrame(() => {
        if (inputRef.current) {
          const previousDigitsBeforeCursor = getDigitsOnly(previousValue.slice(0, cursorPosition)).length;
          const newDigitsBeforeCursor = getDigitsOnly(newRawValue.slice(0, cursorPosition)).length;

          let newCursorPosition = cursorPosition;

          if (newDigitsBeforeCursor > previousDigitsBeforeCursor) {
            let digitCount = 0;
            for (let i = 0; i < formattedValue.length; i++) {
              if (/\d/.test(formattedValue[i])) {
                digitCount++;
              }
              if (digitCount === newDigitsBeforeCursor) {
                newCursorPosition = i + 1;
                break;
              }
            }
          } else if (newDigitsBeforeCursor < previousDigitsBeforeCursor) {
            let digitCount = 0;
            for (let i = 0; i < formattedValue.length; i++) {
              if (/\d/.test(formattedValue[i])) {
                digitCount++;
              }
              if (digitCount === newDigitsBeforeCursor) {
                newCursorPosition = i + 1;
                break;
              }
            }
            if (newDigitsBeforeCursor === 0) {
              newCursorPosition = 0;
            }
          }

          inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
        }
      });
    },
    [value, onChange]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];

    if (allowedKeys.includes(e.key)) return;

    if (e.ctrlKey || e.metaKey) return;

    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  }, []);

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
        ref={inputRef}
        type="tel"
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`${inputClassName} ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        autoComplete="tel"
      />
      {error && (
        <p id={`${id}-error`} className={errorClassName}>
          {error}
        </p>
      )}
    </div>
  );
};

export default PhoneInput;
