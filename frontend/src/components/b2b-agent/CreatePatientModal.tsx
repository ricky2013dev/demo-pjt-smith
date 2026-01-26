import React, { useState } from 'react';
import { PhoneInput, SSNInput, EmailInput, InsuranceProviderSelect } from '@/components/inputs';

// Tab types for the create patient form
const CREATE_PATIENT_TAB_TYPES = {
  BASIC: 'BASIC',
  ADDRESS: 'ADDRESS',
  INSURANCE: 'INSURANCE',
  APPOINTMENT: 'APPOINTMENT',
} as const;

type CreatePatientTabType = typeof CREATE_PATIENT_TAB_TYPES[keyof typeof CREATE_PATIENT_TAB_TYPES];

const CREATE_PATIENT_TAB_LABELS: Record<CreatePatientTabType, string> = {
  [CREATE_PATIENT_TAB_TYPES.BASIC]: 'Basic',
  [CREATE_PATIENT_TAB_TYPES.ADDRESS]: 'Address',
  [CREATE_PATIENT_TAB_TYPES.INSURANCE]: 'Insurance',
  [CREATE_PATIENT_TAB_TYPES.APPOINTMENT]: 'Appointment',
};

interface CreatePatientFormData {
  // Basic
  givenName: string;
  middleName: string;
  familyName: string;
  gender: string;
  birthDate: string;
  ssn: string;
  phone: string;
  email: string;
  clinicPatientId: string;

  // Address
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;

  // Insurance
  insuranceProvider: string;
  payerId: string;
  employerName: string;
  groupNumber: string;
  subscriberName: string;
  subscriberId: string;
  relationship: string;
  effectiveDate: string;
  expirationDate: string;

  // Appointment
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  appointmentProvider: string;
}

interface CreatePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: CreatePatientFormData) => Promise<void>;
  currentUser?: { name: string; username: string; email: string } | null;
}

const getDefaultAppointmentDate = (): string => {
  const date = new Date();
  // Add 7 days
  date.setDate(date.getDate() + 7);

  // If it's Saturday (6) or Sunday (0), move to Monday
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 6) {
    date.setDate(date.getDate() + 2); // Saturday -> Monday
  } else if (dayOfWeek === 0) {
    date.setDate(date.getDate() + 1); // Sunday -> Monday
  }

  // Format as YYYY-MM-DD
  return date.toISOString().split('T')[0];
};

const getInitialFormData = (userName?: string): CreatePatientFormData => ({
  givenName: '',
  middleName: '',
  familyName: '',
  gender: '',
  birthDate: '',
  ssn: '',
  phone: '',
  email: '',
  clinicPatientId: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  insuranceProvider: '',
  payerId: '',
  employerName: '',
  groupNumber: '',
  subscriberName: '',
  subscriberId: '',
  relationship: '',
  effectiveDate: '',
  expirationDate: '',
  appointmentDate: getDefaultAppointmentDate(),
  appointmentTime: '10:00',
  appointmentType: 'Consultation',
  appointmentProvider: userName || 'Dr. Smith',
});

const CreatePatientModal: React.FC<CreatePatientModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<CreatePatientTabType>(CREATE_PATIENT_TAB_TYPES.BASIC);
  const [formData, setFormData] = useState<CreatePatientFormData>(getInitialFormData(currentUser?.username || currentUser?.name));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleChange = (field: keyof CreatePatientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Basic tab validation - required fields
    if (!formData.givenName.trim()) {
      errors.givenName = 'First name is required';
    }
    if (!formData.familyName.trim()) {
      errors.familyName = 'Last name is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const hasTabErrors = (tab: CreatePatientTabType): boolean => {
    switch (tab) {
      case CREATE_PATIENT_TAB_TYPES.BASIC:
        return !!(validationErrors.givenName || validationErrors.familyName);
      default:
        return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Switch to Basic tab if there are validation errors there
      if (hasTabErrors(CREATE_PATIENT_TAB_TYPES.BASIC)) {
        setActiveTab(CREATE_PATIENT_TAB_TYPES.BASIC);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData(getInitialFormData(currentUser?.username || currentUser?.name));
      setActiveTab(CREATE_PATIENT_TAB_TYPES.BASIC);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData(getInitialFormData(currentUser?.username || currentUser?.name));
    setActiveTab(CREATE_PATIENT_TAB_TYPES.BASIC);
    setValidationErrors({});
    onClose();
  };

  const fillDummyData = () => {
    setFormData({
      ...formData,
      givenName: "Jordan",
      middleName: "Lee",
      familyName: "Doe",
      gender: "male",
      birthDate: "2015-09-20",
      ssn: "123-45-6789",
      phone: "212-233-2234",
      email: "jordan.doe@example.com",
      clinicPatientId: "CL-00123",
      addressLine1: "11305 Ocean Rd",
      addressLine2: "",
      city: "Frisco",
      state: "TX",
      postalCode: "75035",
      insuranceProvider: "Cigna Dental",
      payerId: "CIGNA",
      employerName: "Acme Corp",
      groupNumber: "GRP-12345",
      subscriberName: "Jordan Doe",
      subscriberId: "CIGNAJTUxNm",
      relationship: "Self",
      effectiveDate: "2024-01-01",
      expirationDate: "2024-12-31",
      appointmentDate: getDefaultAppointmentDate(),
      appointmentTime: "10:00",
      appointmentType: "Consultation",
      appointmentProvider: "Dr. Smith"
    });
  };

  const inputClassName = "w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none text-sm";
  const labelClassName = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";
  const errorClassName = "text-xs text-red-500 mt-1";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-3xl w-full my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Patient</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={fillDummyData}
              className="text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors mr-2"
              title="Fill Dummy Data"
            >
              <span className="material-symbols-outlined">smart_toy</span>
            </button>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 dark:border-slate-700 px-6 shrink-0">
          <nav aria-label="Tabs" className="flex -mb-px gap-1">
            {Object.values(CREATE_PATIENT_TAB_TYPES).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === tab
                  ? "text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
              >
                {CREATE_PATIENT_TAB_LABELS[tab]}
                {hasTabErrors(tab) && (
                  <span className="material-symbols-outlined text-red-500 text-base">error</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {/* Basic Tab */}
            {activeTab === CREATE_PATIENT_TAB_TYPES.BASIC && (
              <div className="space-y-4 animate-fadeIn">
                <div className="col-span-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Patient ID</label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Auto-generated (e.g., P0000001)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClassName}>First Name *</label>
                    <input
                      type="text"
                      value={formData.givenName}
                      onChange={(e) => handleChange('givenName', e.target.value)}
                      className={`${inputClassName} ${validationErrors.givenName ? 'border-red-500' : ''}`}
                      placeholder="John"
                    />
                    {validationErrors.givenName && (
                      <p className={errorClassName}>{validationErrors.givenName}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelClassName}>Middle Name</label>
                    <input
                      type="text"
                      value={formData.middleName}
                      onChange={(e) => handleChange('middleName', e.target.value)}
                      className={inputClassName}
                      placeholder="Lee"
                    />
                  </div>

                  <div>
                    <label className={labelClassName}>Last Name *</label>
                    <input
                      type="text"
                      value={formData.familyName}
                      onChange={(e) => handleChange('familyName', e.target.value)}
                      className={`${inputClassName} ${validationErrors.familyName ? 'border-red-500' : ''}`}
                      placeholder="Doe"
                    />
                    {validationErrors.familyName && (
                      <p className={errorClassName}>{validationErrors.familyName}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelClassName}>Clinic Patient ID #</label>
                    <input
                      type="text"
                      value={formData.clinicPatientId}
                      onChange={(e) => handleChange('clinicPatientId', e.target.value)}
                      className={inputClassName}
                      placeholder="CL-00123"
                    />
                  </div>

                  <div>
                    <label className={labelClassName}>Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleChange('gender', e.target.value)}
                      className={inputClassName}
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClassName}>Birth Date</label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => handleChange('birthDate', e.target.value)}
                      className={inputClassName}
                    />
                  </div>

                  <SSNInput
                    value={formData.ssn}
                    onChange={(value) => handleChange('ssn', value)}
                    label="SSN"
                    id="create-patient-ssn"
                    showToggle={false}
                  />

                  <PhoneInput
                    value={formData.phone}
                    onChange={(value) => handleChange('phone', value)}
                    label="Phone"
                    id="create-patient-phone"
                  />

                  <div className="col-span-2">
                    <EmailInput
                      value={formData.email}
                      onChange={(value) => handleChange('email', value)}
                      label="Email"
                      id="create-patient-email"
                      validateOnBlur
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Address Tab */}
            {activeTab === CREATE_PATIENT_TAB_TYPES.ADDRESS && (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={labelClassName}>Address Line 1</label>
                    <input
                      type="text"
                      value={formData.addressLine1}
                      onChange={(e) => handleChange('addressLine1', e.target.value)}
                      className={inputClassName}
                      placeholder="123 Main St"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className={labelClassName}>Address Line 2</label>
                    <input
                      type="text"
                      value={formData.addressLine2}
                      onChange={(e) => handleChange('addressLine2', e.target.value)}
                      className={inputClassName}
                      placeholder="Apt 4B"
                    />
                  </div>

                  <div>
                    <label className={labelClassName}>City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className={inputClassName}
                      placeholder="Los Angeles"
                    />
                  </div>

                  <div>
                    <label className={labelClassName}>State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      className={inputClassName}
                      placeholder="CA"
                      maxLength={2}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className={labelClassName}>Postal Code</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => handleChange('postalCode', e.target.value)}
                      className={inputClassName}
                      placeholder="90210"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Insurance Tab */}
            {activeTab === CREATE_PATIENT_TAB_TYPES.INSURANCE && (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <InsuranceProviderSelect
                      label="Insurance(Payer)"
                      value={formData.payerId}
                      onChange={(payerId, payerName) => {
                        handleChange('payerId', payerId);
                        handleChange('insuranceProvider', payerName);
                      }}
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label className={labelClassName}>Employer Name</label>
                    <input
                      type="text"
                      value={formData.employerName}
                      onChange={(e) => handleChange('employerName', e.target.value)}
                      className={inputClassName}
                      placeholder="Acme Corp"
                    />
                  </div>

                  <div>
                    <label className={labelClassName}>
                      Group Number <span className="text-xs text-orange-600">(HIPAA Protected)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.groupNumber}
                      onChange={(e) => handleChange('groupNumber', e.target.value)}
                      className={inputClassName}
                      placeholder="GRP-12345"
                    />
                  </div>

                  <div>
                    <label className={labelClassName}>Subscriber Name</label>
                    <input
                      type="text"
                      value={formData.subscriberName}
                      onChange={(e) => handleChange('subscriberName', e.target.value)}
                      className={inputClassName}
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className={labelClassName}>
                      Subscriber ID <span className="text-xs text-orange-600">(HIPAA Protected)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.subscriberId}
                      onChange={(e) => handleChange('subscriberId', e.target.value)}
                      className={inputClassName}
                      placeholder="SUB-123456"
                    />
                  </div>

                  <div>
                    <label className={labelClassName}>Relationship to Subscriber</label>
                    <select
                      value={formData.relationship}
                      onChange={(e) => handleChange('relationship', e.target.value)}
                      className={inputClassName}
                    >
                      <option value="">Select Relationship</option>
                      <option value="Self">Self</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Child">Child</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClassName}>Effective Date</label>
                    <input
                      type="date"
                      value={formData.effectiveDate}
                      onChange={(e) => handleChange('effectiveDate', e.target.value)}
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label className={labelClassName}>Expiration Date</label>
                    <input
                      type="date"
                      value={formData.expirationDate}
                      onChange={(e) => handleChange('expirationDate', e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Appointment Tab */}
            {activeTab === CREATE_PATIENT_TAB_TYPES.APPOINTMENT && (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClassName}>Appointment Date</label>
                    <input
                      type="date"
                      value={formData.appointmentDate}
                      onChange={(e) => handleChange('appointmentDate', e.target.value)}
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label className={labelClassName}>Appointment Time</label>
                    <input
                      type="time"
                      value={formData.appointmentTime}
                      onChange={(e) => handleChange('appointmentTime', e.target.value)}
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label className={labelClassName}>Appointment Type</label>
                    <select
                      value={formData.appointmentType}
                      onChange={(e) => handleChange('appointmentType', e.target.value)}
                      className={inputClassName}
                    >
                      <option value="">Select Type</option>
                      <option value="Routine Cleaning">Routine Cleaning</option>
                      <option value="Dental Exam">Dental Exam</option>
                      <option value="X-Ray">X-Ray</option>
                      <option value="Filling">Filling</option>
                      <option value="Root Canal">Root Canal</option>
                      <option value="Crown">Crown</option>
                      <option value="Extraction">Extraction</option>
                      <option value="Whitening">Whitening</option>
                      <option value="Consultation">Consultation</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClassName}>Provider Name</label>
                    <input
                      type="text"
                      value={formData.appointmentProvider}
                      onChange={(e) => handleChange('appointmentProvider', e.target.value)}
                      className={inputClassName}
                      placeholder="Dr. Smith"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex gap-3 shrink-0">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                  Creating...
                </>
              ) : (
                'Create Patient'
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePatientModal;
