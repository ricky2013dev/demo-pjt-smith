import React, { useRef, useState } from "react";
import { Patient } from '@/types/patient';
import verificationData from "@mockupdata/verificationData.json";
// import availityService from "../services/availityService"; // Not currently used

interface VerificationFormProps {
  patient: Patient;
}

const VerificationForm: React.FC<VerificationFormProps> = ({ patient }) => {
  const formRef = useRef<HTMLDivElement>(null);

  // Use empty form data for new patients, otherwise use sample data
  const isNewPatient = patient.id.startsWith('new-');
  const emptyFormData = {
    patientName: '',
    patientSSN: '',
    patientDOB: '',
    relationshipToSubscriber: '',
    subscriberName: '',
    subscriberSSN: '',
    subscriberDOB: '',
    subscriberID: '',
    insuranceCompany: '',
    insurerType: { primary: true, secondary: false },
    insuranceAddress: '',
    insurancePhone: '',
    employer: '',
    groupNumber: '',
    effectiveDate: '',
    renewalMonth: '',
    yearlyMax: '',
    deductiblePerIndividual: '',
    deductiblePerFamily: '',
    deductibleAppliesTo: { preventative: false, basic: false, major: false },
    preventativeCoveredAt: '',
    preventativeWaitingPeriod: false,
    preventativeEffectiveDate: '',
    bitewingFrequency: '',
    prophylaxisExamFrequency: '',
    lastFMS: '',
    eligibleForFMSNow: false,
    eligibleForFMSEvery: '',
    fluorideVarnishFrequency: '',
    fluorideAgeLimitExists: false,
    fluorideAgeLimit: '',
    sealantCoverage: false,
    sealantTeethCovered: { molars: false, premolars: false },
    sealantAgeLimitExists: false,
    sealantAgeLimit: '',
    sealantReplacement: '',
    basicCoveredAt: '',
    basicWaitingPeriod: false,
    basicEffectiveDate: '',
    basicIncludes: '',
    majorCoveredAt: '',
    majorWaitingPeriod: false,
    majorEffectiveDate: '',
    majorIncludes: '',
    srpHistory: false,
    srpHistoryDate: '',
    srpCovered: false,
    srpFrequency: '',
    srpAllQuadrantsSameVisit: false,
    srpWaitingPeriod: '',
    adultProphylaxisWithSRP: false,
    adultProphylaxisWaitingPeriod: '',
    periodontalMaintenanceCovered: false,
    periodontalMaintenanceFrequency: '',
    endostealImplantsCovered: false,
    endostealImplantsCoveredAt: '',
    boneReplacementGraftsCovered: false,
    boneReplacementGraftsCoveredAt: '',
    guidedTissueRegenerationCovered: false,
    guidedTissueRegenerationCoveredAt: '',
    implantAbutmentsCovered: false,
    implantAbutmentsCoveredAt: '',
    implantCrownsCovered: false,
    implantCrownsCoveredAt: '',
    implantPreDeterminationRequired: false,
    orthodonticsCovered: false,
    orthodonticsCoveredAt: '',
    orthodonticsAgeLimitExists: false,
    orthodonticsAgeLimit: '',
    orthodonticsLifetimeMaxExists: false,
    orthodonticsLifetimeMax: '',
    nightguardsCovered: false,
    nightguardsCoveredAt: '',
    nitrousOxideCovered: false,
    nitrousOxideCoveredAt: '',
    crownsAndBridgesReplacement: '',
    denturesReplacement: '',
    missingToothClauseCovered: false,
    additionalNotes: ''
  };

  const [formData] = useState(isNewPatient ? emptyFormData : verificationData);
  const [showPatientSSN, setShowPatientSSN] = useState(false);
  const [showSubscriberSSN, setShowSubscriberSSN] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<{[key: string]: boolean}>({
    patient: false,
    subscriber: false,
    insurance: false,
    preventative: false,
    basic: false,
    major: false,
    periodontal: false,
    implant: false,
    orthodontic: false,
    miscellaneous: false,
    notes: false,
  });

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedFormData, setEditedFormData] = useState(isNewPatient ? emptyFormData : verificationData);

  // Initialize editedFormData with patient data
  React.useEffect(() => {
    setEditedFormData((prev: any) => ({
      ...prev,
      patientName: getFullName(),
      patientDOB: patient.birthDate,
    }));
  }, [patient]);

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle save changes
  const handleSave = () => {
    // Here you would typically call an API to save the changes
    setIsEditing(false);
  };

  // Handle cancel editing
  const handleCancel = () => {
    setEditedFormData(verificationData);
    setIsEditing(false);
  };

  // Handle form field change
  const handleFieldChange = (field: string, value: any) => {
    setEditedFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  // Commented out - not currently used in UI
  // const handleStartVerification = async () => {
  //   // Validate coverage ID
  //   if (!coverageId || coverageId.trim() === '') {
  //     setVerificationError('Please enter a Coverage ID');
  //     setIsModalOpen(true);
  //     return;
  //   }

  //   setIsVerifying(true);
  //   setVerificationError(null);
  //   setIsModalOpen(true);

  //   try {
  //     // Get access token first
  //     const accessToken = await availityService.getAccessToken();

  //     // Generate curl command with actual token for testing
  //     const baseUrl = import.meta.env.VITE_AVAILITY_API_BASE_URL;
  //     const curl = `curl --request GET \\
  // --url ${baseUrl}/coverages/${coverageId.trim()} \\
  // --header 'Authorization: Bearer ${accessToken}' \\
  // --header 'accept: application/json'`;
  //     setCurlCommand(curl);

  //     const data = await availityService.startVerification(coverageId.trim());
  //     setCoverageData(data);
  //   } catch (error) {
  //     const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
  //     setVerificationError(errorMessage);
  //     console.error('Verification failed:', error);
  //   } finally {
  //     setIsVerifying(false);
  //   }
  // };

  // const handleVerifyByPayerId = async () => {
  //   // Validate payer ID
  //   if (!payerId || payerId.trim() === '') {
  //     setVerificationError('Please enter a Payer ID');
  //     setIsModalOpen(true);
  //     return;
  //   }

  //   setIsVerifyingByPayerId(true);
  //   setVerificationError(null);
  //   setIsModalOpen(true);

  //   try {
  //     // Get access token first
  //     const accessToken = await availityService.getAccessToken();

  //     // Generate curl command with actual token for testing
  //     const baseUrl = import.meta.env.VITE_AVAILITY_API_BASE_URL;
  //     const curl = `curl --request POST \\
  // --url ${baseUrl}/coverages \\
  // --header 'Authorization: Bearer ${accessToken}' \\
  // --header 'accept: application/json' \\
  // --header 'content-type: application/x-www-form-urlencoded' \\
  // --data payerId=${payerId.trim()}`;
  //     setCurlCommand(curl);

  //     const data = await availityService.startVerificationByPayerId(payerId.trim());
  //     setCoverageData(data);
  //   } catch (error) {
  //     const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
  //     setVerificationError(errorMessage);
  //     console.error('Verification by Payer ID failed:', error);
  //   } finally {
  //     setIsVerifyingByPayerId(false);
  //   }
  // };

  const getFullName = () => {
    const given = patient.name.given.join(" ");
    return `${given} ${patient.name.family}`.trim();
  };

  const maskSSN = (_ssn: string) => {
    // Hide all digits
    return '***-**-****';
  };

  const handlePrint = () => {
    if (!formRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Dental Insurance Verification Form</title>
          <style>
            @page {
              size: letter;
              margin: 0.75in 0.5in 0.5in 0.5in;
            }

            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 11pt;
              line-height: 1.3;
              color: #000;
              background: #fff;
              padding-top: 10px;
              overflow-x: hidden;
            }

            .header {
              text-align: center;
              margin-bottom: 25px;
              border-bottom: 4px double #000;
              padding-bottom: 8px;
            }

            .header h1 {
              font-size: 14pt;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin-bottom: 6px;
            }

            .header p {
              font-size: 9pt;
              margin-top: 6px;
            }

            .section {
              margin-top: 15px;
              margin-bottom: 20px;
              page-break-inside: avoid;
              border: 2px solid #333;
              padding: 15px 20px 20px 20px;
              position: relative;
            }

            .section-header {
              position: absolute;
              top: -12px;
              left: 15px;
              background: #fff;
              padding: 0 8px;
              font-weight: bold;
              font-size: 10pt;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #000;
            }

            .field-group {
              margin-bottom: 8px;
            }

            .field-group-full {
              margin-bottom: 8px;
            }

            .field {
              margin-bottom: 10px;
              display: flex;
              align-items: baseline;
              gap: 8px;
            }

            .field-label {
              font-size: 9pt;
              font-weight: normal;
              white-space: nowrap;
              color: #000;
            }

            .field-value {
              border-bottom: 1px solid #000;
              flex: 1;
              min-height: 16px;
              padding: 0 4px 1px 4px;
              font-size: 9pt;
            }

            .field-inline {
              display: inline-flex;
              align-items: baseline;
              gap: 8px;
              margin-right: 25px;
              margin-bottom: 10px;
            }

            .field-inline .field-value {
              min-width: 150px;
            }

            .field-value.large {
              min-height: 60px;
              border: 1px solid #000;
              padding: 5px;
            }

            .checkbox-group {
              display: inline-flex;
              gap: 15px;
              align-items: center;
            }

            .checkbox-item {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              font-size: 9pt;
            }

            .checkbox {
              width: 14px;
              height: 14px;
              border: 1.5px solid #000;
              display: inline-block;
              vertical-align: middle;
            }

            .radio {
              width: 14px;
              height: 14px;
              border: 1.5px solid #000;
              border-radius: 50%;
              display: inline-block;
              vertical-align: middle;
            }

            .footer {
              margin-top: 20px;
              page-break-inside: avoid;
            }

            .signature-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-top: 20px;
            }

            .signature-line {
              border-bottom: 2px solid #000;
              margin-top: 30px;
              margin-bottom: 5px;
            }

            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }

              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Dental Insurance Verification Form</h1>
            <p>Form Date: ${new Date().toLocaleDateString()}</p>
          </div>

          ${generatePrintContent()}

          <div class="section">
            <div class="section-header">Additional Notes</div>
            <div class=" large">${formData.additionalNotes}</div>
          </div>

          <div class="footer">
            <div class="signature-section">
              <div>
                <div class="signature-line"></div>
                <div class="field-label">Signature</div>
              </div>
              <div>
                <div class="signature-line"></div>
                <div class="field-label">Date</div>
              </div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleExportCSV = () => {
    const csvRows: string[] = [];

    // Add CSV header
    csvRows.push('Category,Field Name,Value');

    // Helper function to escape CSV values
    const escapeCSV = (value: string | number | boolean): string => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // Escape double quotes and wrap in quotes if contains comma, newline, or quote
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Patient Information
    csvRows.push(`Patient Information,Patient Name,${escapeCSV(getFullName())}`);
    csvRows.push(`Patient Information,Patient SSN,${escapeCSV(formData.patientSSN)}`);
    csvRows.push(`Patient Information,Patient Date of Birth,${escapeCSV(patient.birthDate)}`);
    csvRows.push(`Patient Information,Relationship to Subscriber,${escapeCSV(formData.relationshipToSubscriber)}`);

    // Subscriber Information
    csvRows.push(`Subscriber Information,Subscriber Name,${escapeCSV(formData.subscriberName)}`);
    csvRows.push(`Subscriber Information,Subscriber SSN,${escapeCSV(formData.subscriberSSN)}`);
    csvRows.push(`Subscriber Information,Subscriber Date of Birth,${escapeCSV(formData.subscriberDOB)}`);
    csvRows.push(`Subscriber Information,Subscriber ID Number,${escapeCSV(formData.subscriberID)}`);

    // Insurance Information
    csvRows.push(`Insurance Information,Insurance Company,${escapeCSV(formData.insuranceCompany)}`);
    csvRows.push(`Insurance Information,Insurer Type - Primary,${escapeCSV(formData.insurerType.primary ? 'Yes' : 'No')}`);
    csvRows.push(`Insurance Information,Insurer Type - Secondary,${escapeCSV(formData.insurerType.secondary ? 'Yes' : 'No')}`);
    csvRows.push(`Insurance Information,Insurance Address,${escapeCSV(formData.insuranceAddress)}`);
    csvRows.push(`Insurance Information,Insurance Phone,${escapeCSV(formData.insurancePhone)}`);
    csvRows.push(`Insurance Information,Employer,${escapeCSV(formData.employer)}`);
    csvRows.push(`Insurance Information,Group Number,${escapeCSV(formData.groupNumber)}`);
    csvRows.push(`Insurance Information,Effective Date,${escapeCSV(formData.effectiveDate)}`);
    csvRows.push(`Insurance Information,Renewal Month,${escapeCSV(formData.renewalMonth)}`);
    csvRows.push(`Insurance Information,Yearly Maximum,${escapeCSV(formData.yearlyMax)}`);
    csvRows.push(`Insurance Information,Deductible Per Individual,${escapeCSV(formData.deductiblePerIndividual)}`);
    csvRows.push(`Insurance Information,Deductible Per Family,${escapeCSV(formData.deductiblePerFamily)}`);
    csvRows.push(`Insurance Information,Deductible Applies To - Preventative,${escapeCSV(formData.deductibleAppliesTo.preventative ? 'Yes' : 'No')}`);
    csvRows.push(`Insurance Information,Deductible Applies To - Basic,${escapeCSV(formData.deductibleAppliesTo.basic ? 'Yes' : 'No')}`);
    csvRows.push(`Insurance Information,Deductible Applies To - Major,${escapeCSV(formData.deductibleAppliesTo.major ? 'Yes' : 'No')}`);

    // Preventative Coverage
    csvRows.push(`Preventative Coverage,Preventative Covered At (%),${escapeCSV(formData.preventativeCoveredAt)}`);
    csvRows.push(`Preventative Coverage,Preventative Waiting Period,${escapeCSV(formData.preventativeWaitingPeriod ? 'Yes' : 'No')}`);
    csvRows.push(`Preventative Coverage,Preventative Effective Date,${escapeCSV(formData.preventativeEffectiveDate)}`);
    csvRows.push(`Preventative Coverage,Bitewing Frequency,${escapeCSV(formData.bitewingFrequency)}`);
    csvRows.push(`Preventative Coverage,Prophylaxis/Exam Frequency,${escapeCSV(formData.prophylaxisExamFrequency)}`);
    csvRows.push(`Preventative Coverage,Last FMS,${escapeCSV(formData.lastFMS)}`);
    csvRows.push(`Preventative Coverage,Eligible for FMS Now,${escapeCSV(formData.eligibleForFMSNow ? 'Yes' : 'No')}`);
    csvRows.push(`Preventative Coverage,Eligible for FMS Every (Years),${escapeCSV(formData.eligibleForFMSEvery)}`);
    csvRows.push(`Preventative Coverage,Fluoride Varnish Frequency,${escapeCSV(formData.fluorideVarnishFrequency)}`);
    csvRows.push(`Preventative Coverage,Fluoride Age Limit Exists,${escapeCSV(formData.fluorideAgeLimitExists ? 'Yes' : 'No')}`);
    csvRows.push(`Preventative Coverage,Fluoride Age Limit,${escapeCSV(formData.fluorideAgeLimit)}`);
    csvRows.push(`Preventative Coverage,Sealant Coverage,${escapeCSV(formData.sealantCoverage ? 'Yes' : 'No')}`);
    csvRows.push(`Preventative Coverage,Sealant Teeth Covered - Molars,${escapeCSV(formData.sealantTeethCovered.molars ? 'Yes' : 'No')}`);
    csvRows.push(`Preventative Coverage,Sealant Teeth Covered - Premolars,${escapeCSV(formData.sealantTeethCovered.premolars ? 'Yes' : 'No')}`);
    csvRows.push(`Preventative Coverage,Sealant Age Limit Exists,${escapeCSV(formData.sealantAgeLimitExists ? 'Yes' : 'No')}`);
    csvRows.push(`Preventative Coverage,Sealant Age Limit,${escapeCSV(formData.sealantAgeLimit)}`);
    csvRows.push(`Preventative Coverage,Sealant Replacement,${escapeCSV(formData.sealantReplacement)}`);

    // Basic Coverage
    csvRows.push(`Basic Coverage,Basic Covered At (%),${escapeCSV(formData.basicCoveredAt)}`);
    csvRows.push(`Basic Coverage,Basic Waiting Period,${escapeCSV(formData.basicWaitingPeriod ? 'Yes' : 'No')}`);
    csvRows.push(`Basic Coverage,Basic Effective Date,${escapeCSV(formData.basicEffectiveDate)}`);
    csvRows.push(`Basic Coverage,Basic Includes,${escapeCSV(formData.basicIncludes)}`);

    // Major Coverage
    csvRows.push(`Major Coverage,Major Covered At (%),${escapeCSV(formData.majorCoveredAt)}`);
    csvRows.push(`Major Coverage,Major Waiting Period,${escapeCSV(formData.majorWaitingPeriod ? 'Yes' : 'No')}`);
    csvRows.push(`Major Coverage,Major Effective Date,${escapeCSV(formData.majorEffectiveDate)}`);
    csvRows.push(`Major Coverage,Major Includes,${escapeCSV(formData.majorIncludes)}`);

    // Periodontal Coverage
    csvRows.push(`Periodontal Coverage,SRP History,${escapeCSV(formData.srpHistory ? 'Yes' : 'No')}`);
    csvRows.push(`Periodontal Coverage,SRP History Date,${escapeCSV(formData.srpHistoryDate)}`);
    csvRows.push(`Periodontal Coverage,SRP Covered,${escapeCSV(formData.srpCovered ? 'Yes' : 'No')}`);
    csvRows.push(`Periodontal Coverage,SRP Frequency,${escapeCSV(formData.srpFrequency)}`);
    csvRows.push(`Periodontal Coverage,SRP All Quadrants Same Visit,${escapeCSV(formData.srpAllQuadrantsSameVisit ? 'Yes' : 'No')}`);
    csvRows.push(`Periodontal Coverage,SRP Waiting Period,${escapeCSV(formData.srpWaitingPeriod)}`);
    csvRows.push(`Periodontal Coverage,Adult Prophylaxis with SRP,${escapeCSV(formData.adultProphylaxisWithSRP ? 'Yes' : 'No')}`);
    csvRows.push(`Periodontal Coverage,Adult Prophylaxis Waiting Period,${escapeCSV(formData.adultProphylaxisWaitingPeriod)}`);
    csvRows.push(`Periodontal Coverage,Periodontal Maintenance Covered,${escapeCSV(formData.periodontalMaintenanceCovered ? 'Yes' : 'No')}`);
    csvRows.push(`Periodontal Coverage,Periodontal Maintenance Frequency,${escapeCSV(formData.periodontalMaintenanceFrequency)}`);

    // Implant Coverage
    csvRows.push(`Implant Coverage,Endosteal Implants Covered,${escapeCSV(formData.endostealImplantsCovered ? 'Yes' : 'No')}`);
    csvRows.push(`Implant Coverage,Endosteal Implants Covered At (%),${escapeCSV(formData.endostealImplantsCoveredAt)}`);
    csvRows.push(`Implant Coverage,Bone Replacement Grafts Covered,${escapeCSV(formData.boneReplacementGraftsCovered ? 'Yes' : 'No')}`);
    csvRows.push(`Implant Coverage,Bone Replacement Grafts Covered At (%),${escapeCSV(formData.boneReplacementGraftsCoveredAt)}`);
    csvRows.push(`Implant Coverage,Guided Tissue Regeneration Covered,${escapeCSV(formData.guidedTissueRegenerationCovered ? 'Yes' : 'No')}`);
    csvRows.push(`Implant Coverage,Guided Tissue Regeneration Covered At (%),${escapeCSV(formData.guidedTissueRegenerationCoveredAt)}`);
    csvRows.push(`Implant Coverage,Implant Abutments Covered,${escapeCSV(formData.implantAbutmentsCovered ? 'Yes' : 'No')}`);
    csvRows.push(`Implant Coverage,Implant Abutments Covered At (%),${escapeCSV(formData.implantAbutmentsCoveredAt)}`);
    csvRows.push(`Implant Coverage,Implant Crowns Covered,${escapeCSV(formData.implantCrownsCovered ? 'Yes' : 'No')}`);
    csvRows.push(`Implant Coverage,Implant Crowns Covered At (%),${escapeCSV(formData.implantCrownsCoveredAt)}`);
    csvRows.push(`Implant Coverage,Implant Pre-determination Required,${escapeCSV(formData.implantPreDeterminationRequired ? 'Yes' : 'No')}`);

    // Orthodontic Coverage
    csvRows.push(`Orthodontic Coverage,Orthodontics Covered,${escapeCSV(formData.orthodonticsCovered ? 'Yes' : 'No')}`);
    csvRows.push(`Orthodontic Coverage,Orthodontics Covered At (%),${escapeCSV(formData.orthodonticsCoveredAt)}`);
    csvRows.push(`Orthodontic Coverage,Orthodontics Age Limit Exists,${escapeCSV(formData.orthodonticsAgeLimitExists ? 'Yes' : 'No')}`);
    csvRows.push(`Orthodontic Coverage,Orthodontics Age Limit,${escapeCSV(formData.orthodonticsAgeLimit)}`);
    csvRows.push(`Orthodontic Coverage,Orthodontics Lifetime Max Exists,${escapeCSV(formData.orthodonticsLifetimeMaxExists ? 'Yes' : 'No')}`);
    csvRows.push(`Orthodontic Coverage,Orthodontics Lifetime Max,${escapeCSV(formData.orthodonticsLifetimeMax)}`);

    // Miscellaneous
    csvRows.push(`Miscellaneous,Nightguards Covered,${escapeCSV(formData.nightguardsCovered ? 'Yes' : 'No')}`);
    csvRows.push(`Miscellaneous,Nightguards Covered At (%),${escapeCSV(formData.nightguardsCoveredAt)}`);
    csvRows.push(`Miscellaneous,Nitrous Oxide Covered,${escapeCSV(formData.nitrousOxideCovered ? 'Yes' : 'No')}`);
    csvRows.push(`Miscellaneous,Nitrous Oxide Covered At (%),${escapeCSV(formData.nitrousOxideCoveredAt)}`);
    csvRows.push(`Miscellaneous,Crowns and Bridges Replacement (Years),${escapeCSV(formData.crownsAndBridgesReplacement)}`);
    csvRows.push(`Miscellaneous,Dentures Replacement (Years),${escapeCSV(formData.denturesReplacement)}`);
    csvRows.push(`Miscellaneous,Missing Tooth Clause Covered,${escapeCSV(formData.missingToothClauseCovered ? 'Yes' : 'No')}`);

    // Additional Notes
    csvRows.push(`Additional Notes,Additional Notes,${escapeCSV(formData.additionalNotes)}`);

    // Create CSV content
    const csvContent = csvRows.join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `verification-form-${getFullName().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePrintContent = (): string => {
    return `
      <div class="section">
        <div class="section-header">Patient Information</div>
        <div class="field-group">
          <div class="field">
            <span class="field-label">Patient Name:</span>
            <div class="field-value">${getFullName()}</div>
          </div>
          <div class="field">
            <span class="field-label">SSN:</span>
            <div class="field-value">${formData.patientSSN}</div>
          </div>
          <div class="field">
            <span class="field-label">Date of Birth:</span>
            <div class="field-value">${patient.birthDate}</div>
          </div>
          <div class="field">
            <span class="field-label">Relationship to Subscriber:</span>
            <div class="field-value">${formData.relationshipToSubscriber}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">Subscriber Information</div>
        <div class="field-group">
          <div class="field">
            <span class="field-label">Subscriber Name:</span>
            <div class="field-value">${formData.subscriberName}</div>
          </div>
          <div class="field">
            <span class="field-label">SSN:</span>
            <div class="field-value">${formData.subscriberSSN}</div>
          </div>
          <div class="field">
            <span class="field-label">Date of Birth:</span>
            <div class="field-value">${formData.subscriberDOB}</div>
          </div>
          <div class="field">
            <span class="field-label">Subscriber ID Number:</span>
            <div class="field-value">${formData.subscriberID}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">Insurance Information</div>
        <div class="field-group">
          <div class="field">
            <span class="field-label">Insurance Company:</span>
            <div class="field-value">${formData.insuranceCompany}</div>
          </div>
          <div class="field">
            <span class="field-label">Insurer Type:</span>
            <div class="checkbox-group">
              <span class="checkbox-item"><span class="checkbox">${formData.insurerType.primary ? '✓' : ''}</span> Primary</span>
              <span class="checkbox-item"><span class="checkbox">${formData.insurerType.secondary ? '✓' : ''}</span> Secondary</span>
            </div>
          </div>
          <div class="field">
            <span class="field-label">Address:</span>
            <div class="field-value">${formData.insuranceAddress}</div>
          </div>
          <div class="field">
            <span class="field-label">Phone:</span>
            <div class="field-value">${formData.insurancePhone}</div>
          </div>
          <div class="field">
            <span class="field-label">Employer:</span>
            <div class="field-value">${formData.employer}</div>
          </div>
          <div class="field">
            <span class="field-label">Group Number:</span>
            <div class="field-value">${formData.groupNumber}</div>
          </div>
          <div class="field">
            <span class="field-label">Effective Date:</span>
            <div class="field-value">${formData.effectiveDate}</div>
          </div>
          <div class="field">
            <span class="field-label">Renewal Month:</span>
            <div class="field-value">${formData.renewalMonth}</div>
          </div>
          <div class="field">
            <span class="field-label">Yearly Max:</span>
            <div class="field-value">${formData.yearlyMax}</div>
          </div>
          <div class="field">
            <span class="field-label">Deductible Per Individual:</span>
            <div class="field-value">${formData.deductiblePerIndividual}</div>
          </div>
          <div class="field">
            <span class="field-label">Deductible Per Family:</span>
            <div class="field-value">${formData.deductiblePerFamily}</div>
          </div>
        </div>
        <div class="field-group-full">
          <div class="field">
            <span class="field-label">Deductible Applies To:</span>
            <div class="checkbox-group">
              <span class="checkbox-item"><span class="checkbox">${formData.deductibleAppliesTo.preventative ? '✓' : ''}</span> Preventative</span>
              <span class="checkbox-item"><span class="checkbox">${formData.deductibleAppliesTo.basic ? '✓' : ''}</span> Basic</span>
              <span class="checkbox-item"><span class="checkbox">${formData.deductibleAppliesTo.major ? '✓' : ''}</span> Major</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">Preventative Coverage</div>
        <div class="field-group">
          <div class="field">
            <span class="field-label">Covered at:</span>
            <div class="field-value">${formData.preventativeCoveredAt}%</div>
          </div>
          <div class="field">
            <span class="field-label">Waiting Period:</span>
            <div class="checkbox-group">
              <span class="checkbox-item"><span class="radio">${formData.preventativeWaitingPeriod ? '●' : '○'}</span> Yes</span>
              <span class="checkbox-item"><span class="radio">${!formData.preventativeWaitingPeriod ? '●' : '○'}</span> No</span>
            </div>
          </div>
          <div class="field">
            <span class="field-label">Effective Date:</span>
            <div class="field-value">${formData.preventativeEffectiveDate}</div>
          </div>
          <div class="field">
            <span class="field-label">Bitewing Frequency:</span>
            <div class="field-value">${formData.bitewingFrequency}</div>
          </div>
          <div class="field">
            <span class="field-label">Prophylaxis/Exam Frequency:</span>
            <div class="field-value">${formData.prophylaxisExamFrequency}</div>
          </div>
          <div class="field">
            <span class="field-label">Last FMS:</span>
            <div class="field-value">${formData.lastFMS}</div>
          </div>
          <div class="field">
            <span class="field-label">Eligible for FMS Now:</span>
            <div class="checkbox-group">
              <span class="checkbox-item"><span class="radio">${formData.eligibleForFMSNow ? '●' : '○'}</span> Yes</span>
              <span class="checkbox-item"><span class="radio">${!formData.eligibleForFMSNow ? '●' : '○'}</span> No</span>
            </div>
          </div>
          <div class="field">
            <span class="field-label">Eligible for FMS Every:</span>
            <div class="field-value">${formData.eligibleForFMSEvery} Years</div>
          </div>
        </div>
        <div class="field-group-full">
          <div class="field">
            <span class="field-label">Fluoride Varnish Frequency:</span>
            <div class="field-value">${formData.fluorideVarnishFrequency}</div>
          </div>
          <div class="field">
            <span class="field-label">Sealant Coverage:</span>
            <div class="checkbox-group">
              <span class="checkbox-item"><span class="checkbox">${formData.sealantTeethCovered.molars ? '✓' : ''}</span> Molars</span>
              <span class="checkbox-item"><span class="checkbox">${formData.sealantTeethCovered.premolars ? '✓' : ''}</span> Premolars</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">Basic Coverage</div>
        <div class="field-group">
          <div class="field">
            <span class="field-label">Covered at:</span>
            <div class="field-value">${formData.basicCoveredAt}%</div>
          </div>
          <div class="field">
            <span class="field-label">Waiting Period:</span>
            <div class="checkbox-group">
              <span class="checkbox-item"><span class="radio">${formData.basicWaitingPeriod ? '●' : '○'}</span> Yes</span>
              <span class="checkbox-item"><span class="radio">${!formData.basicWaitingPeriod ? '●' : '○'}</span> No</span>
            </div>
          </div>
          <div class="field">
            <span class="field-label">Effective Date:</span>
            <div class="field-value">${formData.basicEffectiveDate}</div>
          </div>
        </div>
        <div class="field-group-full">
          <div class="field">
            <span class="field-label">Includes:</span>
            <div class="field-value">${formData.basicIncludes}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">Major Coverage</div>
        <div class="field-group">
          <div class="field">
            <span class="field-label">Covered at:</span>
            <div class="field-value">${formData.majorCoveredAt}%</div>
          </div>
          <div class="field">
            <span class="field-label">Waiting Period:</span>
            <div class="checkbox-group">
              <span class="checkbox-item"><span class="radio">${formData.majorWaitingPeriod ? '●' : '○'}</span> Yes</span>
              <span class="checkbox-item"><span class="radio">${!formData.majorWaitingPeriod ? '●' : '○'}</span> No</span>
            </div>
          </div>
          <div class="field">
            <span class="field-label">Effective Date:</span>
            <div class="field-value">${formData.majorEffectiveDate}</div>
          </div>
        </div>
        <div class="field-group-full">
          <div class="field">
            <span class="field-label">Includes:</span>
            <div class="field-value">${formData.majorIncludes}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">Periodontal Coverage</div>
        <div class="field-group">
          <div class="field">
            <span class="field-label">SRP History:</span>
            <div class="checkbox-group">
              <span class="checkbox-item"><span class="radio">${formData.srpHistory ? '●' : '○'}</span> Yes</span>
              <span class="checkbox-item"><span class="radio">${!formData.srpHistory ? '●' : '○'}</span> No</span>
            </div>
          </div>
          <div class="field">
            <span class="field-label">SRP History Date:</span>
            <div class="field-value">${formData.srpHistoryDate}</div>
          </div>
          <div class="field">
            <span class="field-label">SRP Frequency:</span>
            <div class="field-value">${formData.srpFrequency}</div>
          </div>
          <div class="field">
            <span class="field-label">Periodontal Maintenance Frequency:</span>
            <div class="field-value">${formData.periodontalMaintenanceFrequency}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">Implant & Orthodontic Coverage</div>
        <div class="field-group">
          <div class="field">
            <span class="field-label">Endosteal Implants:</span>
            <div class="field-value">${formData.endostealImplantsCovered ? formData.endostealImplantsCoveredAt + '%' : 'Not Covered'}</div>
          </div>
          <div class="field">
            <span class="field-label">Orthodontics:</span>
            <div class="field-value">${formData.orthodonticsCovered ? formData.orthodonticsCoveredAt + '%' : 'Not Covered'}</div>
          </div>
          <div class="field">
            <span class="field-label">Orthodontics Lifetime Max:</span>
            <div class="field-value">${formData.orthodonticsLifetimeMaxExists ? formData.orthodonticsLifetimeMax : 'N/A'}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">Miscellaneous</div>
        <div class="field-group">
          <div class="field">
            <span class="field-label">Nightguards:</span>
            <div class="field-value">${formData.nightguardsCovered ? formData.nightguardsCoveredAt + '%' : 'Not Covered'}</div>
          </div>
          <div class="field">
            <span class="field-label">Nitrous Oxide:</span>
            <div class="field-value">${formData.nitrousOxideCovered ? formData.nitrousOxideCoveredAt + '%' : 'Not Covered'}</div>
          </div>
          <div class="field">
            <span class="field-label">Replacement on Crowns/Bridges:</span>
            <div class="field-value">${formData.crownsAndBridgesReplacement} Years</div>
          </div>
          <div class="field">
            <span class="field-label">Replacement on Dentures:</span>
            <div class="field-value">${formData.denturesReplacement} Years</div>
          </div>
          <div class="field">
            <span class="field-label">Missing Tooth Clause:</span>
            <div class="checkbox-group">
              <span class="checkbox-item"><span class="radio">${formData.missingToothClauseCovered ? '●' : '○'}</span> Yes</span>
              <span class="checkbox-item"><span class="radio">${!formData.missingToothClauseCovered ? '●' : '○'}</span> No</span>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  return (
    <div key={patient.id}>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {/* Header with Title and Action Buttons - Sticky */}
        <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-md rounded-t-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined">assignment</span>
              Verification Form
            </h3>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 bg-white dark:bg-slate-900 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-1.5 text-sm"
                  >
                    <span className="material-symbols-outlined text-base">save</span>
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 bg-white dark:bg-slate-900 text-sm"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                    Edit
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 bg-white dark:bg-slate-900 text-sm"
                  >
                    <span className="material-symbols-outlined text-base">download</span>
                    Export CSV
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 bg-white dark:bg-slate-900 text-sm"
                  >
                    <span className="material-symbols-outlined text-base">print</span>
                    Print
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div ref={formRef} className="p-6 space-y-8">
          {/* Patient & Subscriber Information Section */}
          <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <button
              onClick={() => toggleSection('patient')}
              className="w-full px-4 py-3 flex items-center gap-2 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group border-b-2 border-slate-200 dark:border-slate-700"
            >
              <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">
                {collapsedSections.patient ? 'expand_more' : 'expand_less'}
              </span>
              <span className="material-symbols-outlined text-slate-900 dark:text-white">account_circle</span>
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                PATIENT & SUBSCRIBER INFORMATION
              </h4>
            </button>
            {!collapsedSections.patient && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Patient Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.patientName}
                    onChange={(e) => handleFieldChange('patientName', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{getFullName()}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Patient SSN
                </label>
                <div className="relative">
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      value={editedFormData.patientSSN}
                      onChange={(e) => handleFieldChange('patientSSN', e.target.value)}
                    />
                  ) : (
                    <>
                      <p className="w-full px-3 py-2 pr-10 text-slate-900 dark:text-white">
                        {showPatientSSN ? formData.patientSSN : maskSSN(formData.patientSSN)}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowPatientSSN(!showPatientSSN)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {showPatientSSN ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Patient DOB
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.patientDOB}
                    onChange={(e) => handleFieldChange('patientDOB', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{patient.birthDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Relationship to Subscriber
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.relationshipToSubscriber}
                    onChange={(e) => handleFieldChange('relationshipToSubscriber', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.relationshipToSubscriber}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Subscriber Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.subscriberName}
                    onChange={(e) => handleFieldChange('subscriberName', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.subscriberName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Subscriber SSN
                </label>
                <div className="relative">
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      value={editedFormData.subscriberSSN}
                      onChange={(e) => handleFieldChange('subscriberSSN', e.target.value)}
                    />
                  ) : (
                    <>
                      <p className="w-full px-3 py-2 pr-10 text-slate-900 dark:text-white">
                        {showSubscriberSSN ? formData.subscriberSSN : maskSSN(formData.subscriberSSN)}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowSubscriberSSN(!showSubscriberSSN)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {showSubscriberSSN ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Subscriber DOB
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.subscriberDOB}
                    onChange={(e) => handleFieldChange('subscriberDOB', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.subscriberDOB}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Subscriber ID Number
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.subscriberID}
                    onChange={(e) => handleFieldChange('subscriberID', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.subscriberID}</p>
                )}
              </div>
            </div>
            )}
          </div>

          {/* Insurance Information Section */}
          <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <button
              onClick={() => toggleSection('insurance')}
              className="w-full px-4 py-3 flex items-center gap-2 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group border-b-2 border-slate-200 dark:border-slate-700"
            >
              <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">
                {collapsedSections.insurance ? 'expand_more' : 'expand_less'}
              </span>
              <span className="material-symbols-outlined text-slate-900 dark:text-white">health_and_safety</span>
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                INSURANCE INFORMATION
              </h4>
            </button>
            {!collapsedSections.insurance && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Insurance Company
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.insuranceCompany}
                    onChange={(e) => handleFieldChange('insuranceCompany', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.insuranceCompany}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Insurer Type
                </label>
                {isEditing ? (
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={editedFormData.insurerType.primary}
                        onChange={(e) => handleFieldChange('insurerType', { ...editedFormData.insurerType, primary: e.target.checked })}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Primary</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={editedFormData.insurerType.secondary}
                        onChange={(e) => handleFieldChange('insurerType', { ...editedFormData.insurerType, secondary: e.target.checked })}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Secondary</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">
                    {[formData.insurerType.primary && 'Primary', formData.insurerType.secondary && 'Secondary'].filter(Boolean).join(', ') || 'None'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Address
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.insuranceAddress}
                    onChange={(e) => handleFieldChange('insuranceAddress', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.insuranceAddress}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Phone
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.insurancePhone}
                    onChange={(e) => handleFieldChange('insurancePhone', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.insurancePhone}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Employer
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.employer}
                    onChange={(e) => handleFieldChange('employer', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.employer}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Group Number
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.groupNumber}
                    onChange={(e) => handleFieldChange('groupNumber', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.groupNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Effective Date
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.effectiveDate}
                    onChange={(e) => handleFieldChange('effectiveDate', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.effectiveDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Renewal Month
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.renewalMonth}
                    onChange={(e) => handleFieldChange('renewalMonth', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.renewalMonth}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Yearly Max
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.yearlyMax}
                    onChange={(e) => handleFieldChange('yearlyMax', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.yearlyMax}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Deductible Per Individual
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.deductiblePerIndividual}
                    onChange={(e) => handleFieldChange('deductiblePerIndividual', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.deductiblePerIndividual}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Deductible Per Family
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.deductiblePerFamily}
                    onChange={(e) => handleFieldChange('deductiblePerFamily', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.deductiblePerFamily}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Deductible Applies To
                </label>
                {isEditing ? (
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={editedFormData.deductibleAppliesTo.preventative}
                        onChange={(e) => handleFieldChange('deductibleAppliesTo', { ...editedFormData.deductibleAppliesTo, preventative: e.target.checked })}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Preventative</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={editedFormData.deductibleAppliesTo.basic}
                        onChange={(e) => handleFieldChange('deductibleAppliesTo', { ...editedFormData.deductibleAppliesTo, basic: e.target.checked })}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Basic</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={editedFormData.deductibleAppliesTo.major}
                        onChange={(e) => handleFieldChange('deductibleAppliesTo', { ...editedFormData.deductibleAppliesTo, major: e.target.checked })}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Major</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">
                    {[formData.deductibleAppliesTo.preventative && 'Preventative', formData.deductibleAppliesTo.basic && 'Basic', formData.deductibleAppliesTo.major && 'Major'].filter(Boolean).join(', ') || 'None'}
                  </p>
                )}
              </div>
            </div>
            )}
          </div>

          {/* Preventative Coverage Section */}
          <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <button
              onClick={() => toggleSection('preventative')}
              className="w-full px-4 py-3 flex items-center gap-2 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group border-b-2 border-slate-200 dark:border-slate-700"
            >
              <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">
                {collapsedSections.preventative ? 'expand_more' : 'expand_less'}
              </span>
              <span className="material-symbols-outlined ">shield_with_heart</span>
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                PREVENTATIVE COVERAGE
              </h4>
            </button>
            {!collapsedSections.preventative && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Covered at (%)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.preventativeCoveredAt}
                    onChange={(e) => handleFieldChange('preventativeCoveredAt', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.preventativeCoveredAt}%</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Waiting Period?
                </label>
                {isEditing ? (
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="preventativeWaiting"
                        checked={editedFormData.preventativeWaitingPeriod === true}
                        onChange={() => handleFieldChange('preventativeWaitingPeriod', true)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="preventativeWaiting"
                        checked={editedFormData.preventativeWaitingPeriod === false}
                        onChange={() => handleFieldChange('preventativeWaitingPeriod', false)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">No</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.preventativeWaitingPeriod ? 'Yes' : 'No'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Effective Date
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.preventativeEffectiveDate}
                    onChange={(e) => handleFieldChange('preventativeEffectiveDate', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.preventativeEffectiveDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Bitewing Frequency
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.bitewingFrequency}
                    onChange={(e) => handleFieldChange('bitewingFrequency', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.bitewingFrequency}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Prophylaxis/Exam Frequency
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.prophylaxisExamFrequency}
                    onChange={(e) => handleFieldChange('prophylaxisExamFrequency', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.prophylaxisExamFrequency}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Last FMS
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.lastFMS}
                    onChange={(e) => handleFieldChange('lastFMS', e.target.value)}
                    placeholder="MM/DD/YYYY"
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.lastFMS}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Eligible for FMS Now?
                </label>
                {isEditing ? (
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="fmsNow"
                        checked={editedFormData.eligibleForFMSNow === true}
                        onChange={() => handleFieldChange('eligibleForFMSNow', true)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="fmsNow"
                        checked={editedFormData.eligibleForFMSNow === false}
                        onChange={() => handleFieldChange('eligibleForFMSNow', false)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">No</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.eligibleForFMSNow ? 'Yes' : 'No'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Eligible for FMS Every (Years)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.eligibleForFMSEvery}
                    onChange={(e) => handleFieldChange('eligibleForFMSEvery', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.eligibleForFMSEvery}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Fluoride Varnish (D1203/D1204/D1206) Frequency
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.fluorideVarnishFrequency}
                    onChange={(e) => handleFieldChange('fluorideVarnishFrequency', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.fluorideVarnishFrequency}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Age Limit on Fluoride?
                </label>
                {isEditing ? (
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="fluorideAge"
                        checked={editedFormData.fluorideAgeLimitExists === true}
                        onChange={() => handleFieldChange('fluorideAgeLimitExists', true)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="fluorideAge"
                        checked={editedFormData.fluorideAgeLimitExists === false}
                        onChange={() => handleFieldChange('fluorideAgeLimitExists', false)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">No</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.fluorideAgeLimitExists ? 'Yes' : 'No'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  If yes, at what age?
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.fluorideAgeLimit}
                    onChange={(e) => handleFieldChange('fluorideAgeLimit', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.fluorideAgeLimit}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Sealant (D1351) Coverage?
                </label>
                {isEditing ? (
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="sealant"
                        checked={editedFormData.sealantCoverage === true}
                        onChange={() => handleFieldChange('sealantCoverage', true)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="sealant"
                        checked={editedFormData.sealantCoverage === false}
                        onChange={() => handleFieldChange('sealantCoverage', false)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">No</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.sealantCoverage ? 'Yes' : 'No'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Sealant Teeth Covered
                </label>
                {isEditing ? (
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={editedFormData.sealantTeethCovered.molars}
                        onChange={(e) => handleFieldChange('sealantTeethCovered', { ...editedFormData.sealantTeethCovered, molars: e.target.checked })}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Molars</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={editedFormData.sealantTeethCovered.premolars}
                        onChange={(e) => handleFieldChange('sealantTeethCovered', { ...editedFormData.sealantTeethCovered, premolars: e.target.checked })}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Premolars</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">
                    {[formData.sealantTeethCovered.molars && 'Molars', formData.sealantTeethCovered.premolars && 'Premolars'].filter(Boolean).join(', ') || 'None'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Age Limit on Sealants?
                </label>
                {isEditing ? (
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="sealantAge"
                        checked={editedFormData.sealantAgeLimitExists === true}
                        onChange={() => handleFieldChange('sealantAgeLimitExists', true)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="sealantAge"
                        checked={editedFormData.sealantAgeLimitExists === false}
                        onChange={() => handleFieldChange('sealantAgeLimitExists', false)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">No</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.sealantAgeLimitExists ? 'Yes' : 'No'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  If yes, at what age?
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.sealantAgeLimit}
                    onChange={(e) => handleFieldChange('sealantAgeLimit', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.sealantAgeLimit}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Replacement on Sealant
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.sealantReplacement}
                    onChange={(e) => handleFieldChange('sealantReplacement', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.sealantReplacement}</p>
                )}
              </div>
            </div>
            )}
          </div>

          {/* Basic Coverage Section */}
          <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <button
              onClick={() => toggleSection('basic')}
              className="w-full px-4 py-3 flex items-center gap-2 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group border-b-2 border-slate-200 dark:border-slate-700"
            >
              <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">
                {collapsedSections.basic ? 'expand_more' : 'expand_less'}
              </span>
              <span className="material-symbols-outlined ">medical_services</span>
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                BASIC COVERAGE
              </h4>
            </button>
            {!collapsedSections.basic && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Covered at (%)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.basicCoveredAt}
                    onChange={(e) => handleFieldChange('basicCoveredAt', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.basicCoveredAt}%</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Waiting Period?
                </label>
                {isEditing ? (
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="basicWaiting"
                        checked={editedFormData.basicWaitingPeriod === true}
                        onChange={() => handleFieldChange('basicWaitingPeriod', true)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="basicWaiting"
                        checked={editedFormData.basicWaitingPeriod === false}
                        onChange={() => handleFieldChange('basicWaitingPeriod', false)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">No</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.basicWaitingPeriod ? 'Yes' : 'No'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Effective Date
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.basicEffectiveDate}
                    onChange={(e) => handleFieldChange('basicEffectiveDate', e.target.value)}
                    placeholder="MM/DD/YYYY"
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.basicEffectiveDate}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Includes
                </label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.basicIncludes}
                    onChange={(e) => handleFieldChange('basicIncludes', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.basicIncludes}</p>
                )}
              </div>
            </div>
            )}
          </div>

          {/* Major Coverage Section */}
          <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <button
              onClick={() => toggleSection('major')}
              className="w-full px-4 py-3 flex items-center gap-2 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group border-b-2 border-slate-200 dark:border-slate-700"
            >
              <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">
                {collapsedSections.major ? 'expand_more' : 'expand_less'}
              </span>
              <span className="material-symbols-outlined ">verified</span>
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                MAJOR COVERAGE
              </h4>
            </button>
            {!collapsedSections.major && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Covered at (%)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.majorCoveredAt}
                    onChange={(e) => handleFieldChange('majorCoveredAt', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.majorCoveredAt}%</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Waiting Period?
                </label>
                {isEditing ? (
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="majorWaiting"
                        checked={editedFormData.majorWaitingPeriod === true}
                        onChange={() => handleFieldChange('majorWaitingPeriod', true)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="majorWaiting"
                        checked={editedFormData.majorWaitingPeriod === false}
                        onChange={() => handleFieldChange('majorWaitingPeriod', false)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">No</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.majorWaitingPeriod ? 'Yes' : 'No'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Effective Date
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.majorEffectiveDate}
                    onChange={(e) => handleFieldChange('majorEffectiveDate', e.target.value)}
                    placeholder="MM/DD/YYYY"
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.majorEffectiveDate}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Includes
                </label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.majorIncludes}
                    onChange={(e) => handleFieldChange('majorIncludes', e.target.value)}
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.majorIncludes}</p>
                )}
              </div>
            </div>
            )}
          </div>

          {/* Periodontal Coverage Section */}
          <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <button
              onClick={() => toggleSection('periodontal')}
              className="w-full px-4 py-3 flex items-center gap-2 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group border-b-2 border-slate-200 dark:border-slate-700"
            >
              <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">
                {collapsedSections.periodontal ? 'expand_more' : 'expand_less'}
              </span>
              <span className="material-symbols-outlined ">dentistry</span>
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                PERIODONTAL COVERAGE
              </h4>
            </button>
            {!collapsedSections.periodontal && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  History of SRP (D4341/D4342)?
                </label>
                {isEditing ? (
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="srpHistory"
                        checked={editedFormData.srpHistory === true}
                        onChange={() => handleFieldChange('srpHistory', true)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="srpHistory"
                        checked={editedFormData.srpHistory === false}
                        onChange={() => handleFieldChange('srpHistory', false)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">No</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.srpHistory ? 'Yes' : 'No'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  If yes, when?
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.srpHistoryDate}
                    onChange={(e) => handleFieldChange('srpHistoryDate', e.target.value)}
                    placeholder="MM/DD/YYYY"
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.srpHistoryDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  SRP Covered?
                </label>
                {isEditing ? (
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="srpCovered"
                        checked={editedFormData.srpCovered === true}
                        onChange={() => handleFieldChange('srpCovered', true)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="srpCovered"
                        checked={editedFormData.srpCovered === false}
                        onChange={() => handleFieldChange('srpCovered', false)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">No</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.srpCovered ? 'Yes' : 'No'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  SRP Frequency
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.srpFrequency}
                    onChange={(e) => handleFieldChange('srpFrequency', e.target.value)}
                    placeholder="Frequency"
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.srpFrequency}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  SRP All Quadrants Same Visit?
                </label>
                {isEditing ? (
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="srpQuadrants"
                        checked={editedFormData.srpAllQuadrantsSameVisit === true}
                        onChange={() => handleFieldChange('srpAllQuadrantsSameVisit', true)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="srpQuadrants"
                        checked={editedFormData.srpAllQuadrantsSameVisit === false}
                        onChange={() => handleFieldChange('srpAllQuadrantsSameVisit', false)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">No</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.srpAllQuadrantsSameVisit ? 'Yes' : 'No'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  If not, waiting period?
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.srpWaitingPeriod}
                    onChange={(e) => handleFieldChange('srpWaitingPeriod', e.target.value)}
                    placeholder="Waiting period"
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.srpWaitingPeriod}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Adult Prophylaxis & Isolated SRP Same Visit?
                </label>
                {isEditing ? (
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="prophylaxisSRP"
                        checked={editedFormData.adultProphylaxisWithSRP === true}
                        onChange={() => handleFieldChange('adultProphylaxisWithSRP', true)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="prophylaxisSRP"
                        checked={editedFormData.adultProphylaxisWithSRP === false}
                        onChange={() => handleFieldChange('adultProphylaxisWithSRP', false)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">No</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.adultProphylaxisWithSRP ? 'Yes' : 'No'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  If not, waiting period?
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.adultProphylaxisWaitingPeriod}
                    onChange={(e) => handleFieldChange('adultProphylaxisWaitingPeriod', e.target.value)}
                    placeholder="Waiting period"
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.adultProphylaxisWaitingPeriod}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Periodontal Maintenance (D4910) Covered?
                </label>
                {isEditing ? (
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="perioMaintenance"
                        checked={editedFormData.periodontalMaintenanceCovered === true}
                        onChange={() => handleFieldChange('periodontalMaintenanceCovered', true)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="perioMaintenance"
                        checked={editedFormData.periodontalMaintenanceCovered === false}
                        onChange={() => handleFieldChange('periodontalMaintenanceCovered', false)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">No</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.periodontalMaintenanceCovered ? 'Yes' : 'No'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Frequency
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.periodontalMaintenanceFrequency}
                    onChange={(e) => handleFieldChange('periodontalMaintenanceFrequency', e.target.value)}
                    placeholder="Frequency"
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.periodontalMaintenanceFrequency}</p>
                )}
              </div>
            </div>
            )}
          </div>

          {/* Implant Coverage Section */}
          <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <button
              onClick={() => toggleSection('implant')}
              className="w-full px-4 py-3 flex items-center gap-2 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group border-b-2 border-slate-200 dark:border-slate-700"
            >
              <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">
                {collapsedSections.implant ? 'expand_more' : 'expand_less'}
              </span>
              <span className="material-symbols-outlined ">folder_special</span>
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                IMPLANT COVERAGE
              </h4>
            </button>
            {!collapsedSections.implant && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Endosteal Implants (D6012) Covered?
                </label>
                {isEditing ? (
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="endosteal"
                        checked={editedFormData.endostealImplantsCovered === true}
                        onChange={() => handleFieldChange('endostealImplantsCovered', true)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="endosteal"
                        checked={editedFormData.endostealImplantsCovered === false}
                        onChange={() => handleFieldChange('endostealImplantsCovered', false)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">No</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.endostealImplantsCovered ? 'Yes' : 'No'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  If yes, covered at (%)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.endostealImplantsCoveredAt}
                    onChange={(e) => handleFieldChange('endostealImplantsCoveredAt', e.target.value)}
                    placeholder="%"
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.endostealImplantsCoveredAt}%</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Bone Replacement Grafts (D7953) Covered?
                </label>
                {isEditing ? (
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="boneGrafts"
                        checked={editedFormData.boneReplacementGraftsCovered === true}
                        onChange={() => handleFieldChange('boneReplacementGraftsCovered', true)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="boneGrafts"
                        checked={editedFormData.boneReplacementGraftsCovered === false}
                        onChange={() => handleFieldChange('boneReplacementGraftsCovered', false)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">No</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.boneReplacementGraftsCovered ? 'Yes' : 'No'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  If yes, covered at (%)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.boneReplacementGraftsCoveredAt}
                    onChange={(e) => handleFieldChange('boneReplacementGraftsCoveredAt', e.target.value)}
                    placeholder="%"
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.boneReplacementGraftsCoveredAt}%</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Guided-Tissue Regeneration (D4266/D4267) Covered?
                </label>
                {isEditing ? (
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="guidedTissue"
                        checked={editedFormData.guidedTissueRegenerationCovered === true}
                        onChange={() => handleFieldChange('guidedTissueRegenerationCovered', true)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="guidedTissue"
                        checked={editedFormData.guidedTissueRegenerationCovered === false}
                        onChange={() => handleFieldChange('guidedTissueRegenerationCovered', false)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">No</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.guidedTissueRegenerationCovered ? 'Yes' : 'No'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  If yes, covered at (%)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.guidedTissueRegenerationCoveredAt}
                    onChange={(e) => handleFieldChange('guidedTissueRegenerationCoveredAt', e.target.value)}
                    placeholder="%"
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.guidedTissueRegenerationCoveredAt}%</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Implant Abutments (D6056/D6057) Covered?
                </label>
                {isEditing ? (
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="abutments"
                        checked={editedFormData.implantAbutmentsCovered === true}
                        onChange={() => handleFieldChange('implantAbutmentsCovered', true)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="abutments"
                        checked={editedFormData.implantAbutmentsCovered === false}
                        onChange={() => handleFieldChange('implantAbutmentsCovered', false)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">No</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.implantAbutmentsCovered ? 'Yes' : 'No'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  If yes, covered at (%)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.implantAbutmentsCoveredAt}
                    onChange={(e) => handleFieldChange('implantAbutmentsCoveredAt', e.target.value)}
                    placeholder="%"
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.implantAbutmentsCoveredAt}%</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Implant Crowns (D6065/D6066/D6067) Covered?
                </label>
                {isEditing ? (
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="implantCrowns"
                        checked={editedFormData.implantCrownsCovered === true}
                        onChange={() => handleFieldChange('implantCrownsCovered', true)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="implantCrowns"
                        checked={editedFormData.implantCrownsCovered === false}
                        onChange={() => handleFieldChange('implantCrownsCovered', false)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">No</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.implantCrownsCovered ? 'Yes' : 'No'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  If yes, covered at (%)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.implantCrownsCoveredAt}
                    onChange={(e) => handleFieldChange('implantCrownsCoveredAt', e.target.value)}
                    placeholder="%"
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.implantCrownsCoveredAt}%</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Pre-determination Required Prior to Implant Surgery?
                </label>
                {isEditing ? (
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="preDetermination"
                        checked={editedFormData.implantPreDeterminationRequired === true}
                        onChange={() => handleFieldChange('implantPreDeterminationRequired', true)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="preDetermination"
                        checked={editedFormData.implantPreDeterminationRequired === false}
                        onChange={() => handleFieldChange('implantPreDeterminationRequired', false)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">No</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.implantPreDeterminationRequired ? 'Yes' : 'No'}</p>
                )}
              </div>
            </div>
            )}
          </div>

          {/* Orthodontic Coverage Section */}
          <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <button
              onClick={() => toggleSection('orthodontic')}
              className="w-full px-4 py-3 flex items-center gap-2 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group border-b-2 border-slate-200 dark:border-slate-700"
            >
              <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">
                {collapsedSections.orthodontic ? 'expand_more' : 'expand_less'}
              </span>
              <span className="material-symbols-outlined ">sentiment_satisfied</span>
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                ORTHODONTIC COVERAGE
              </h4>
            </button>
            {!collapsedSections.orthodontic && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Orthodontics Covered?
                </label>
                {isEditing ? (
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="orthodontics"
                        checked={editedFormData.orthodonticsCovered === true}
                        onChange={() => handleFieldChange('orthodonticsCovered', true)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="orthodontics"
                        checked={editedFormData.orthodonticsCovered === false}
                        onChange={() => handleFieldChange('orthodonticsCovered', false)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">No</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.orthodonticsCovered ? 'Yes' : 'No'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  If yes, covered at (%)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.orthodonticsCoveredAt}
                    onChange={(e) => handleFieldChange('orthodonticsCoveredAt', e.target.value)}
                    placeholder="%"
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.orthodonticsCoveredAt}%</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Age Limit on Orthodontic Coverage?
                </label>
                {isEditing ? (
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="orthodonticsAge"
                        checked={editedFormData.orthodonticsAgeLimitExists === true}
                        onChange={() => handleFieldChange('orthodonticsAgeLimitExists', true)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="orthodonticsAge"
                        checked={editedFormData.orthodonticsAgeLimitExists === false}
                        onChange={() => handleFieldChange('orthodonticsAgeLimitExists', false)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">No</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.orthodonticsAgeLimitExists ? 'Yes' : 'No'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  If yes, at what age?
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.orthodonticsAgeLimit}
                    onChange={(e) => handleFieldChange('orthodonticsAgeLimit', e.target.value)}
                    placeholder="Age"
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.orthodonticsAgeLimit}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Lifetime Maximum?
                </label>
                {isEditing ? (
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="orthodonticsLifetime"
                        checked={editedFormData.orthodonticsLifetimeMaxExists === true}
                        onChange={() => handleFieldChange('orthodonticsLifetimeMaxExists', true)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="orthodonticsLifetime"
                        checked={editedFormData.orthodonticsLifetimeMaxExists === false}
                        onChange={() => handleFieldChange('orthodonticsLifetimeMaxExists', false)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">No</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.orthodonticsLifetimeMaxExists ? 'Yes' : 'No'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  If yes, lifetime maximum ($)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.orthodonticsLifetimeMax}
                    onChange={(e) => handleFieldChange('orthodonticsLifetimeMax', e.target.value)}
                    placeholder="$"
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.orthodonticsLifetimeMax}</p>
                )}
              </div>
            </div>
            )}
          </div>

          {/* Miscellaneous Section */}
          <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <button
              onClick={() => toggleSection('miscellaneous')}
              className="w-full px-4 py-3 flex items-center gap-2 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group border-b-2 border-slate-200 dark:border-slate-700"
            >
              <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">
                {collapsedSections.miscellaneous ? 'expand_more' : 'expand_less'}
              </span>
              <span className="material-symbols-outlined ">more_horiz</span>
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                MISCELLANEOUS
              </h4>
            </button>
            {!collapsedSections.miscellaneous && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nightguards (D9940) Covered?
                </label>
                {isEditing ? (
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="nightguards"
                        checked={editedFormData.nightguardsCovered === true}
                        onChange={() => handleFieldChange('nightguardsCovered', true)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="nightguards"
                        checked={editedFormData.nightguardsCovered === false}
                        onChange={() => handleFieldChange('nightguardsCovered', false)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">No</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.nightguardsCovered ? 'Yes' : 'No'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  If yes, covered at (%)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.nightguardsCoveredAt}
                    onChange={(e) => handleFieldChange('nightguardsCoveredAt', e.target.value)}
                    placeholder="%"
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.nightguardsCoveredAt}%</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nitrous Oxide (D9230) Covered?
                </label>
                {isEditing ? (
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="nitrousOxide"
                        checked={editedFormData.nitrousOxideCovered === true}
                        onChange={() => handleFieldChange('nitrousOxideCovered', true)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="nitrousOxide"
                        checked={editedFormData.nitrousOxideCovered === false}
                        onChange={() => handleFieldChange('nitrousOxideCovered', false)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">No</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.nitrousOxideCovered ? 'Yes' : 'No'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  If yes, covered at (%)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.nitrousOxideCoveredAt}
                    onChange={(e) => handleFieldChange('nitrousOxideCoveredAt', e.target.value)}
                    placeholder="%"
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.nitrousOxideCoveredAt}%</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Replacement on Crowns and Bridges (Years)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.crownsAndBridgesReplacement}
                    onChange={(e) => handleFieldChange('crownsAndBridgesReplacement', e.target.value)}
                    placeholder="Years"
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.crownsAndBridgesReplacement} years</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Replacement on Complete and Partial Dentures (Years)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={editedFormData.denturesReplacement}
                    onChange={(e) => handleFieldChange('denturesReplacement', e.target.value)}
                    placeholder="Years"
                  />
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.denturesReplacement} years</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Prior Extractions Covered (Missing Tooth Clause)?
                </label>
                {isEditing ? (
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="missingTooth"
                        checked={editedFormData.missingToothClauseCovered === true}
                        onChange={() => handleFieldChange('missingToothClauseCovered', true)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="missingTooth"
                        checked={editedFormData.missingToothClauseCovered === false}
                        onChange={() => handleFieldChange('missingToothClauseCovered', false)}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">No</span>
                    </label>
                  </div>
                ) : (
                  <p className="w-full px-3 py-2 text-slate-900 dark:text-white">{formData.missingToothClauseCovered ? 'Yes' : 'No'}</p>
                )}
              </div>
            </div>
            )}
          </div>

          {/* Additional Notes Section */}
          <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <button
              onClick={() => toggleSection('notes')}
              className="w-full px-4 py-3 flex items-center gap-2 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group border-b-2 border-slate-200 dark:border-slate-700"
            >
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <span className="material-symbols-outlined ">note_add</span>
                ADDITIONAL NOTES
              </h4>
              <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">
                {collapsedSections.notes ? 'expand_more' : 'expand_less'}
              </span>
            </button>
            {!collapsedSections.notes && (
            <div className="p-4">
              {isEditing ? (
                <textarea
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  value={editedFormData.additionalNotes}
                  onChange={(e) => handleFieldChange('additionalNotes', e.target.value)}
                  placeholder="Add any additional notes or information..."
                />
              ) : (
                <p className="w-full px-3 py-2 text-slate-900 dark:text-white whitespace-pre-wrap">{formData.additionalNotes}</p>
              )}
            </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default VerificationForm;
