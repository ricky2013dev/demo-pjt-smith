import React, { useEffect, useMemo, useState } from 'react';
import type { AccountPaymentMethod } from './types';

/** Payment setup is edited as a flat map of strings, like the clinic form. */
export type PaymentFormValues = Record<string, string>;

/** Everything the clinic maintains itself. `autoPayEnabled` is kept apart, as a boolean. */
const EDITABLE_KEYS = [
  'methodType', 'planName', 'billingCycle',
  'cardBrand', 'cardLast4', 'cardExpMonth', 'cardExpYear', 'cardholderName',
  'bankName', 'bankAccountLast4', 'bankAccountType', 'bankAccountHolder',
  'billingContactName', 'billingEmail', 'billingPhone',
  'billingAddressLine1', 'billingAddressLine2', 'billingCity', 'billingState', 'billingZipCode',
] as const;

type EditableKey = typeof EDITABLE_KEYS[number];

/** What the form sends: the string fields above plus the auto-pay switch. */
export type PaymentSetupPayload = Record<string, string | boolean>;

const CARD_BRANDS = ['Visa', 'Mastercard', 'American Express', 'Discover'];

/** An empty setup, so the form works before a clinic has ever saved one. */
const EMPTY_VALUES: PaymentFormValues = Object.fromEntries(
  EDITABLE_KEYS.map((key) => [key, ''])
) as PaymentFormValues;

const toFormValues = (method: AccountPaymentMethod | null): PaymentFormValues => {
  if (!method) return { ...EMPTY_VALUES, methodType: 'card', billingCycle: 'monthly' };
  return Object.fromEntries(
    EDITABLE_KEYS.map((key) => [key, (method[key as keyof AccountPaymentMethod] as string | null) ?? ''])
  ) as PaymentFormValues;
};

interface PaymentSetupFormProps {
  /** Null until the clinic sets a method up for the first time. */
  paymentMethod: AccountPaymentMethod | null;
  /** Resolves with the saved setup, or rejects so the form keeps the edits. */
  onSave: (values: PaymentSetupPayload) => Promise<AccountPaymentMethod>;
  /** Per-field messages from the server, keyed by field name. */
  fieldErrors?: Record<string, string>;
  /** Only a manager may change billing; everyone else is kept out of the page. */
  canEdit?: boolean;
}

const inputClassName = (hasError: boolean) =>
  `w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:disabled:bg-slate-800/60 dark:disabled:text-slate-400 ${
    hasError
      ? 'border-red-400 dark:border-red-500 focus:ring-red-400'
      : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500'
  }`;

/** Icon standing in for the method on file. */
const methodIcon = (methodType: string) => (methodType === 'ach' ? 'account_balance' : 'credit_card');

/** "Visa ····4242" — how the method reads everywhere it is named. */
export const describeMethod = (method: AccountPaymentMethod | null): string => {
  if (!method) return 'No payment method on file';
  if (method.methodType === 'ach') {
    return method.bankAccountLast4
      ? `${method.bankName || 'Bank account'} ····${method.bankAccountLast4}`
      : method.bankName || 'Bank account';
  }
  return method.cardLast4
    ? `${method.cardBrand || 'Card'} ····${method.cardLast4}`
    : method.cardBrand || 'Card';
};

const PaymentSetupForm: React.FC<PaymentSetupFormProps> = ({
  paymentMethod,
  onSave,
  fieldErrors = {},
  canEdit = true,
}) => {
  const [values, setValues] = useState<PaymentFormValues>(() => toFormValues(paymentMethod));
  const [autoPay, setAutoPay] = useState<boolean>(paymentMethod?.autoPayEnabled ?? true);
  const [isSaving, setIsSaving] = useState(false);

  // A save (or a reload) replaces the baseline the form edits from.
  useEffect(() => {
    setValues(toFormValues(paymentMethod));
    setAutoPay(paymentMethod?.autoPayEnabled ?? true);
  }, [paymentMethod]);

  const baseline = useMemo(() => toFormValues(paymentMethod), [paymentMethod]);

  const isDirty =
    EDITABLE_KEYS.some((key) => values[key] !== baseline[key]) ||
    autoPay !== (paymentMethod?.autoPayEnabled ?? true);

  const isCard = values.methodType !== 'ach';

  const handleChange = (key: EditableKey, value: string) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  const handleReset = () => {
    setValues(toFormValues(paymentMethod));
    setAutoPay(paymentMethod?.autoPayEnabled ?? true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await onSave({ ...values, autoPayEnabled: autoPay });
    } finally {
      setIsSaving(false);
    }
  };

  /** One labelled input, with its server error or hint underneath. */
  const field = (
    key: EditableKey,
    label: string,
    options: {
      placeholder?: string;
      hint?: string;
      type?: string;
      wide?: boolean;
      maxLength?: number;
      inputMode?: 'text' | 'numeric';
    } = {}
  ) => {
    const error = fieldErrors[key];
    return (
      <div key={key} className={options.wide ? 'md:col-span-2' : undefined}>
        <label htmlFor={`payment-${key}`} className="block mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
          {label}
        </label>
        <input
          id={`payment-${key}`}
          type={options.type ?? 'text'}
          value={values[key] ?? ''}
          onChange={(event) => handleChange(key, event.target.value)}
          placeholder={options.placeholder}
          maxLength={options.maxLength}
          inputMode={options.inputMode}
          readOnly={!canEdit}
          disabled={!canEdit}
          aria-invalid={error ? true : undefined}
          className={inputClassName(!!error)}
        />
        {(error || options.hint) && (
          <p
            className={`mt-1 text-[11px] ${
              error ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {error || options.hint}
          </p>
        )}
      </div>
    );
  };

  const sectionClassName =
    'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden';

  const sectionHeader = (icon: string, title: string, description: string) => (
    <header className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700">
      <span className="material-symbols-outlined text-xl text-slate-500 dark:text-slate-400">{icon}</span>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
    </header>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* What is on file today, before the fields that change it */}
      <section className={sectionClassName}>
        <div className="flex flex-wrap items-center gap-4 px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-900">
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">
              {methodIcon(paymentMethod?.methodType ?? values.methodType)}
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{describeMethod(paymentMethod)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {paymentMethod
                ? [
                    paymentMethod.planName,
                    paymentMethod.billingCycle === 'annual' ? 'Billed annually' : 'Billed monthly',
                    paymentMethod.methodType === 'card' && paymentMethod.cardExpMonth
                      ? `Expires ${paymentMethod.cardExpMonth}/${paymentMethod.cardExpYear}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : 'Fill in the details below to start billing this clinic.'}
            </p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              (paymentMethod?.autoPayEnabled ?? autoPay)
                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
            }`}
          >
            {(paymentMethod?.autoPayEnabled ?? autoPay) ? 'Auto-pay on' : 'Auto-pay off'}
          </span>
        </div>
      </section>

      <section className={sectionClassName}>
        {sectionHeader('receipt_long', 'Plan & Billing', 'What this clinic is billed for, and how often.')}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
          {field('planName', 'Plan', { placeholder: 'InSpline Verify — Practice', wide: true })}

          <div>
            <label htmlFor="payment-billingCycle" className="block mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
              Billing Cycle
            </label>
            <select
              id="payment-billingCycle"
              value={values.billingCycle || 'monthly'}
              onChange={(event) => handleChange('billingCycle', event.target.value)}
              disabled={!canEdit}
              aria-invalid={fieldErrors.billingCycle ? true : undefined}
              className={inputClassName(!!fieldErrors.billingCycle)}
            >
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
            </select>
            {fieldErrors.billingCycle && (
              <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{fieldErrors.billingCycle}</p>
            )}
          </div>

          <div className="md:col-span-2 xl:col-span-3">
            <label className="flex items-start gap-3 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoPay}
                onChange={(event) => setAutoPay(event.target.checked)}
                disabled={!canEdit}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-600 accent-slate-900 dark:accent-white"
              />
              <span>
                <span className="block text-sm font-medium text-slate-900 dark:text-white">Automatic payment</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  Charge the method below when an invoice is issued. With this off, invoices wait to be paid by hand.
                </span>
              </span>
            </label>
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        {sectionHeader('credit_card', 'Payment Method', 'The card or bank account invoices are charged to.')}

        <div className="p-5 space-y-4">
          {/* Card or bank: the two sets of fields below are exclusive */}
          <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-600 p-0.5">
            {(['card', 'ach'] as const).map((type) => {
              const selected = isCard === (type === 'card');
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleChange('methodType', type)}
                  disabled={!canEdit}
                  aria-pressed={selected}
                  className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                    selected
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{methodIcon(type)}</span>
                  {type === 'card' ? 'Credit / Debit Card' : 'Bank Account (ACH)'}
                </button>
              );
            })}
          </div>

          <p className="flex items-start gap-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-base">lock</span>
            Full card and account numbers are held by the payment processor and never stored here. Enter the last four
            digits so the method is recognisable on invoices.
          </p>

          {isCard ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div>
                <label htmlFor="payment-cardBrand" className="block mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                  Card Brand
                </label>
                <select
                  id="payment-cardBrand"
                  value={values.cardBrand || ''}
                  onChange={(event) => handleChange('cardBrand', event.target.value)}
                  disabled={!canEdit}
                  className={inputClassName(!!fieldErrors.cardBrand)}
                >
                  <option value="">Select a brand</option>
                  {CARD_BRANDS.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
                {fieldErrors.cardBrand && (
                  <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{fieldErrors.cardBrand}</p>
                )}
              </div>
              {field('cardLast4', 'Card Number (last 4)', {
                placeholder: '4242',
                maxLength: 4,
                inputMode: 'numeric',
                hint: '4 digits',
              })}
              {field('cardholderName', 'Name on Card', { placeholder: 'Bright Smile Dental Group' })}
              {field('cardExpMonth', 'Expiry Month', { placeholder: '09', maxLength: 2, inputMode: 'numeric', hint: '01–12' })}
              {field('cardExpYear', 'Expiry Year', { placeholder: '2028', maxLength: 4, inputMode: 'numeric', hint: '4 digits' })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {field('bankName', 'Bank Name', { placeholder: 'First Illinois Bank' })}
              {field('bankAccountLast4', 'Account Number (last 4)', {
                placeholder: '8815',
                maxLength: 4,
                inputMode: 'numeric',
                hint: '4 digits',
              })}
              <div>
                <label
                  htmlFor="payment-bankAccountType"
                  className="block mb-1 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Account Type
                </label>
                <select
                  id="payment-bankAccountType"
                  value={values.bankAccountType || ''}
                  onChange={(event) => handleChange('bankAccountType', event.target.value)}
                  disabled={!canEdit}
                  className={inputClassName(!!fieldErrors.bankAccountType)}
                >
                  <option value="">Select a type</option>
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                </select>
                {fieldErrors.bankAccountType && (
                  <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{fieldErrors.bankAccountType}</p>
                )}
              </div>
              {field('bankAccountHolder', 'Account Holder', {
                placeholder: 'Riverside Family Dentistry, LLC',
                wide: true,
              })}
            </div>
          )}
        </div>
      </section>

      <section className={sectionClassName}>
        {sectionHeader('mail', 'Billing Contact', 'Where invoices and receipts are sent.')}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
          {field('billingContactName', 'Contact Name', { placeholder: 'Dana Whitfield' })}
          {field('billingEmail', 'Billing Email', { placeholder: 'billing@clinic.com', type: 'email' })}
          {field('billingPhone', 'Billing Phone', { placeholder: '(512) 555-0100', type: 'tel' })}
          {field('billingAddressLine1', 'Address Line 1', { placeholder: '1200 Congress Ave', wide: true })}
          {field('billingAddressLine2', 'Address Line 2', { placeholder: 'Suite 300' })}
          {field('billingCity', 'City', { placeholder: 'Austin' })}
          {field('billingState', 'State', { placeholder: 'TX' })}
          {field('billingZipCode', 'ZIP Code', { placeholder: '78701', hint: '12345 or 12345-6789' })}
        </div>
      </section>

      {/* Save bar sticks to the bottom so it is reachable from any section */}
      {canEdit && (
        <div className="sticky bottom-0 flex items-center justify-end gap-3 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur py-3">
          {isDirty && (
            <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">edit</span>
              Unsaved changes
            </span>
          )}
          <button
            type="button"
            onClick={handleReset}
            disabled={!isDirty || isSaving}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={!isDirty || isSaving}
            className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold shadow-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                Saving…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">save</span>
                Save Payment Setup
              </>
            )}
          </button>
        </div>
      )}
    </form>
  );
};

export default PaymentSetupForm;
