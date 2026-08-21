import React, { useEffect, useState } from 'react';
import type { Account } from './types';

/** One editable clinic field, grouped into the card it is shown in. */
interface FieldDef {
  key: keyof Account;
  label: string;
  placeholder?: string;
  required?: boolean;
  /** One column by default; `wide` takes two, for the long name fields. */
  width?: 'wide';
  type?: 'text' | 'tel' | 'email' | 'url';
  hint?: string;
}

interface SectionDef {
  title: string;
  description: string;
  icon: string;
  fields: FieldDef[];
}

const SECTIONS: SectionDef[] = [
  {
    title: 'Clinic Identity',
    description: 'How the practice is named on verifications and claims.',
    icon: 'badge',
    fields: [
      { key: 'name', label: 'Clinic Name', required: true, placeholder: 'Bright Smile Dental Group', width: 'wide' },
      { key: 'npiNumber', label: 'NPI', placeholder: '1999999984', hint: '10 digits' },
      { key: 'legalName', label: 'Legal Entity Name', placeholder: 'Bright Smile Dental Group, PLLC', width: 'wide' },
      { key: 'taxId', label: 'Tax ID (EIN)', placeholder: '74-3011882', hint: 'XX-XXXXXXX' },
    ],
  },
  {
    title: 'Contact',
    description: 'Where payers and patients reach the office.',
    icon: 'call',
    fields: [
      { key: 'phoneNumber', label: 'Phone Number', type: 'tel', placeholder: '(512) 555-0100' },
      { key: 'faxNumber', label: 'Fax Number', type: 'tel', placeholder: '(512) 555-0142' },
      { key: 'email', label: 'Office Email', type: 'email', placeholder: 'office@clinic.com' },
      { key: 'website', label: 'Website', type: 'url', placeholder: 'https://www.clinic.com' },
    ],
  },
  {
    title: 'Address',
    description: 'The service location reported on eligibility requests.',
    icon: 'location_on',
    fields: [
      { key: 'addressLine1', label: 'Address Line 1', placeholder: '1200 Congress Ave', width: 'wide' },
      { key: 'addressLine2', label: 'Address Line 2', placeholder: 'Suite 300' },
      { key: 'city', label: 'City', placeholder: 'Austin' },
      { key: 'state', label: 'State', placeholder: 'TX' },
      { key: 'zipCode', label: 'ZIP Code', placeholder: '78701', hint: '12345 or 12345-6789' },
      { key: 'timezone', label: 'Time Zone', placeholder: 'America/Chicago' },
    ],
  },
];

/** Only the maintainable fields are sent back; ids and timestamps are not. */
const EDITABLE_KEYS = SECTIONS.flatMap((section) => section.fields.map((field) => field.key));

export type ClinicFormValues = Record<string, string>;

const toFormValues = (account: Account): ClinicFormValues =>
  Object.fromEntries(EDITABLE_KEYS.map((key) => [key, (account[key] as string | null) ?? ''])) as ClinicFormValues;

interface ClinicInformationFormProps {
  account: Account;
  /** Resolves with the saved account, or rejects so the form keeps the edits. */
  onSave: (values: ClinicFormValues) => Promise<Account>;
  /** Per-field messages from the server, keyed by field name. */
  fieldErrors?: Record<string, string>;
  /** Dental users read the clinic record; only a manager may change it. */
  canEdit?: boolean;
}

const inputClassName = (hasError: boolean) =>
  `w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:disabled:bg-slate-800/60 dark:disabled:text-slate-400 ${
    hasError
      ? 'border-red-400 dark:border-red-500 focus:ring-red-400'
      : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500'
  }`;

const ClinicInformationForm: React.FC<ClinicInformationFormProps> = ({
  account,
  onSave,
  fieldErrors = {},
  canEdit = true,
}) => {
  const [values, setValues] = useState<ClinicFormValues>(() => toFormValues(account));
  const [isSaving, setIsSaving] = useState(false);
  // Sections collapse independently; everything starts open.
  const [collapsed, setCollapsed] = useState<string[]>([]);

  const isOpen = (title: string) => !collapsed.includes(title);

  const toggleSection = (title: string) =>
    setCollapsed((previous) =>
      previous.includes(title) ? previous.filter((entry) => entry !== title) : [...previous, title]
    );

  // A rejected save must not hide the field it complains about.
  useEffect(() => {
    const errored = Object.keys(fieldErrors);
    if (errored.length === 0) return;

    setCollapsed((previous) =>
      previous.filter((title) => {
        const section = SECTIONS.find((candidate) => candidate.title === title);
        return !section?.fields.some((field) => errored.includes(field.key as string));
      })
    );
  }, [fieldErrors]);

  // A save (or a reload) replaces the baseline the form edits from.
  useEffect(() => {
    setValues(toFormValues(account));
  }, [account]);

  const isDirty = EDITABLE_KEYS.some((key) => values[key as string] !== ((account[key] as string | null) ?? ''));

  const handleChange = (key: string, value: string) => {
    setValues((previous) => ({ ...previous, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await onSave(values);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!canEdit && (
        <p className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          <span className="material-symbols-outlined text-base">lock</span>
          Clinic details are maintained by a manager on this clinic. You can view them here.
        </p>
      )}

      {SECTIONS.map((section) => {
        const open = isOpen(section.title);
        const panelId = `clinic-section-${section.title.replace(/\s+/g, '-').toLowerCase()}`;

        return (
        <section
          key={section.title}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <button
            type="button"
            onClick={() => toggleSection(section.title)}
            aria-expanded={open}
            aria-controls={panelId}
            className={`flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40 ${
              open ? 'border-b border-slate-200 dark:border-slate-700' : ''
            }`}
          >
            <span className="material-symbols-outlined text-xl text-slate-500 dark:text-slate-400">{section.icon}</span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{section.title}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{section.description}</p>
            </div>
            <span className="material-symbols-outlined text-slate-400 dark:text-slate-500" style={{ fontSize: '20px' }}>
              {open ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {open && (
          <div id={panelId} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
            {section.fields.map((field) => {
              const key = field.key as string;
              const error = fieldErrors[key];
              return (
                <div key={key} className={field.width === 'wide' ? 'md:col-span-2' : undefined}>
                  <label
                    htmlFor={`clinic-${key}`}
                    className="block mb-1 text-xs font-medium text-slate-600 dark:text-slate-300"
                  >
                    {field.label}
                    {field.required && <span className="ml-0.5 text-red-500">*</span>}
                  </label>
                  <input
                    id={`clinic-${key}`}
                    type={field.type ?? 'text'}
                    value={values[key] ?? ''}
                    onChange={(event) => handleChange(key, event.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    readOnly={!canEdit}
                    disabled={!canEdit}
                    aria-invalid={error ? true : undefined}
                    className={inputClassName(!!error)}
                  />
                  {(error || field.hint) && (
                    <p
                      className={`mt-1 text-[11px] ${
                        error ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {error || field.hint}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </section>
        );
      })}

      {/* Save bar sticks to the bottom so it is reachable from any section */}
      {canEdit && <div className="sticky bottom-0 flex items-center justify-end gap-3 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur py-3">
        {isDirty && (
          <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">edit</span>
            Unsaved changes
          </span>
        )}
        <button
          type="button"
          onClick={() => setValues(toFormValues(account))}
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
              Save Changes
            </>
          )}
        </button>
      </div>}
    </form>
  );
};

export default ClinicInformationForm;
