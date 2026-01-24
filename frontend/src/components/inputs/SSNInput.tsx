import React, { useCallback, useRef, useState } from 'react';

interface SSNInputProps {
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
  showToggle?: boolean;
}

const formatSSN = (digits: string): string => {
  const cleaned = digits.replace(/\D/g, '').slice(0, 9);

  if (cleaned.length === 0) return '';
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
};

const maskSSN = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return '\u2022'.repeat(digits.length);
  if (digits.length <= 5) return `\u2022\u2022\u2022-${'\u2022'.repeat(digits.length - 3)}`;
  return `\u2022\u2022\u2022-\u2022\u2022-${digits.slice(5)}`;
};

const getDigitsOnly = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 9);
};

const SSNInput: React.FC<SSNInputProps> = ({
  value,
  onChange,
  id,
  name,
  placeholder = '123-45-6789',
  disabled = false,
  error,
  className,
  label,
  required = false,
  showToggle = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Determine if the input should be shown based on manual toggle OR focus state
  const effectiveIsVisible = isVisible || isFocused;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const cursorPosition = input.selectionStart ?? 0;
      const previousValue = value;
      const newRawValue = e.target.value;

      const digits = getDigitsOnly(newRawValue);
      const formattedValue = formatSSN(digits);

      onChange(formattedValue);

      requestAnimationFrame(() => {
        if (inputRef.current) {
          // If visible or focused, we are editing raw values, so cursor logic applies
          if (effectiveIsVisible) {
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
        }
      });
    },
    [value, onChange, effectiveIsVisible]
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

  const toggleVisibility = useCallback(() => {
    if (effectiveIsVisible) {
      // Currently visible: user wants to Hide
      setIsVisible(false);
      // If focused, we must blur to allow masking to take effect (editing disabled when hidden)
      if (isFocused) {
        inputRef.current?.blur();
      }
    } else {
      // Currently hidden: user wants to Show
      setIsVisible(true);
    }
  }, [effectiveIsVisible, isFocused]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const displayValue = effectiveIsVisible ? value : maskSSN(value);

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
          <span className="ml-2 text-blue-600 dark:text-blue-400 text-xs">(HIPAA Protected)</span>
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`${inputClassName} ${showToggle ? 'pr-10' : ''} ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          autoComplete="off"
          data-sensitive="true"
        />
        {showToggle && (
          <button
            type="button"
            onClick={toggleVisibility}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 focus:outline-none"
            aria-label={effectiveIsVisible ? 'Hide SSN' : 'Show SSN'}
            disabled={disabled}
            onMouseDown={(e) => {
              // Prevent the button click from causing the input to blur before the click is processed
              e.preventDefault();
            }}
          >
            <span className="material-symbols-outlined text-xl">
              {effectiveIsVisible ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className={errorClassName}>
          {error}
        </p>
      )}
    </div>
  );
};

export default SSNInput;
