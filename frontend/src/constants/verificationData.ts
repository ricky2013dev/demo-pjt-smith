import { VerificationDataRow } from "@/components/b2b-agent/VerificationDataPanel";

export const API_VERIFICATION_DATA: VerificationDataRow[] = [
    // Verified fields - Plan Information
    { saiCode: "VF000001", refInsCode: "D001", category: "Plan Information", fieldName: "Plan Name", preStepValue: "Blue Cross Dental Plus", missing: "N", aiCallValue: "Blue Cross Dental Plus", verifiedBy: "API" },
    { saiCode: "VF000002", refInsCode: "D002", category: "Plan Information", fieldName: "Group Number", preStepValue: "GRP987654", missing: "N", aiCallValue: "GRP987654", verifiedBy: "API" },
    { saiCode: "VF000003", refInsCode: "D003", category: "Plan Information", fieldName: "Effective Date", preStepValue: "01/01/2024", missing: "N", aiCallValue: "01/01/2024", verifiedBy: "API" },
    { saiCode: "VF000004", refInsCode: "D004", category: "Plan Information", fieldName: "Carrier Name", preStepValue: "Blue Cross Blue Shield", missing: "N", aiCallValue: "Blue Cross Blue Shield", verifiedBy: "API" },
    { saiCode: "VF000005", refInsCode: "D005", category: "Plan Information", fieldName: "Member ID", preStepValue: "SUB123456789", missing: "N", aiCallValue: "SUB123456789", verifiedBy: "API" },

    // Verified fields - Deductible
    { saiCode: "VF000051", refInsCode: "D051", category: "Deductible", fieldName: "Annual Deductible Amount", preStepValue: "0", missing: "N", aiCallValue: "$0 - No Deductible", verifiedBy: "API" },
    { saiCode: "VF000052", refInsCode: "D052", category: "Deductible", fieldName: "Deductible Applies To", preStepValue: "Basic & Major", missing: "N", aiCallValue: "Basic & Major", verifiedBy: "API" },
    { saiCode: "VF000053", refInsCode: "D053", category: "Deductible", fieldName: "Family Deductible", preStepValue: "$0", missing: "N", aiCallValue: "$0", verifiedBy: "API" },

    // Verified fields - Preventative Coverage
    { saiCode: "VF000010", refInsCode: "D010", category: "Preventative Coverage", fieldName: "Annual Cleaning Benefit", preStepValue: "2 Cleanings", missing: "N", aiCallValue: "2 Cleanings per Year", verifiedBy: "API" },
    { saiCode: "VF000011", refInsCode: "D011", category: "Preventative Coverage", fieldName: "Annual Exams", preStepValue: "2 Exams", missing: "N", aiCallValue: "2 Exams per Year", verifiedBy: "API" },
    { saiCode: "VF000012", refInsCode: "D012", category: "Preventative Coverage", fieldName: "X-ray Coverage", preStepValue: "1 FMS per 5 years", missing: "N", aiCallValue: "1 Full Mouth Series per 5 years", verifiedBy: "API" },

    // Verified fields - Basic Coverage
    { saiCode: "VF000020", refInsCode: "D020", category: "Basic Coverage", fieldName: "Fillings Coverage", preStepValue: "80%", missing: "N", aiCallValue: "80%", verifiedBy: "API" },
    { saiCode: "VF000021", refInsCode: "D021", category: "Basic Coverage", fieldName: "Extractions Coverage", preStepValue: "80%", missing: "N", aiCallValue: "80%", verifiedBy: "API" },
    { saiCode: "VF000022", refInsCode: "D022", category: "Basic Coverage", fieldName: "Scaling & Root Planing", preStepValue: "80%", missing: "N", aiCallValue: "80%", verifiedBy: "API" },

    // Verified fields - Major Coverage
    { saiCode: "VF000030", refInsCode: "D030", category: "Major Coverage", fieldName: "Crowns Coverage", preStepValue: "50%", missing: "N", aiCallValue: "50%", verifiedBy: "API" },
    { saiCode: "VF000031", refInsCode: "D031", category: "Major Coverage", fieldName: "Bridges Coverage", preStepValue: "50%", missing: "N", aiCallValue: "50%", verifiedBy: "API" },
    { saiCode: "VF000032", refInsCode: "D032", category: "Major Coverage", fieldName: "Dentures Coverage", preStepValue: "50%", missing: "N", aiCallValue: "50%", verifiedBy: "API" },
    { saiCode: "VF000033", refInsCode: "D033", category: "Major Coverage", fieldName: "Root Canals Coverage", preStepValue: "50%", missing: "N", aiCallValue: "50%", verifiedBy: "API" },
    { saiCode: "VF000034", refInsCode: "D034", category: "Major Coverage", fieldName: "Implants Coverage", preStepValue: "Not Covered", missing: "N", aiCallValue: "Not Covered - Considered Cosmetic", verifiedBy: "API" },

    // Verified fields - Annual Maximums
    { saiCode: "VF000060", refInsCode: "D060", category: "Annual Maximum", fieldName: "Annual Maximum Benefit", preStepValue: "$1200", missing: "N", aiCallValue: "$1,200 per Year", verifiedBy: "API" },
    { saiCode: "VF000061", refInsCode: "D061", category: "Annual Maximum", fieldName: "Ortho Maximum", preStepValue: "Not Included", missing: "N", aiCallValue: "Not Included", verifiedBy: "API" },

    // Missing fields - To verify during call
    { saiCode: "VF000028", refInsCode: "D028", category: "Preventative Coverage", fieldName: "Prophylaxis/Exam Frequency", preStepValue: "", missing: "Y", aiCallValue: "", verifiedBy: "-" },
    { saiCode: "VF000029", refInsCode: "D029", category: "Preventative Coverage", fieldName: "Last FMS Date", preStepValue: "", missing: "Y", aiCallValue: "", verifiedBy: "-" },
    { saiCode: "VF000040", refInsCode: "D040", category: "Preventative Coverage", fieldName: "Eligible for FMS Now", preStepValue: "", missing: "Y", aiCallValue: "", verifiedBy: "-" },
    { saiCode: "VF000041", refInsCode: "D041", category: "Preventative Coverage", fieldName: "FMS Frequency (Years)", preStepValue: "", missing: "Y", aiCallValue: "", verifiedBy: "-" },
    { saiCode: "VF000042", refInsCode: "D042", category: "Preventative Coverage", fieldName: "Fluoride Varnish Frequency", preStepValue: "", missing: "Y", aiCallValue: "", verifiedBy: "-" },
    { saiCode: "VF000045", refInsCode: "D045", category: "Major Coverage", fieldName: "Major Waiting Period", preStepValue: "", missing: "Y", aiCallValue: "", verifiedBy: "-" },
    { saiCode: "VF000046", refInsCode: "D046", category: "Major Coverage", fieldName: "Major Services Effective Date", preStepValue: "", missing: "Y", aiCallValue: "", verifiedBy: "-" },
    { saiCode: "VF000070", refInsCode: "D070", category: "Coverage Limits", fieldName: "Frequency Limitations", preStepValue: "", missing: "Y", aiCallValue: "", verifiedBy: "-" },
];
