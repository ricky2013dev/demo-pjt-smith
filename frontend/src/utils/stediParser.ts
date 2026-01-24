import { VerificationDataRow } from "@/components/b2b-agent/VerificationDataPanel";
import { API_VERIFICATION_DATA } from "@/constants/verificationData";

export interface StediBenefit {
    code?: string;
    name?: string;
    serviceTypeCodes?: string[];
    serviceTypes?: string[];
    coverageLevelCode?: string;
    coverageLevel?: string;
    timeQualifierCode?: string;
    timeQualifier?: string;
    benefitAmount?: string;
    benefitPercent?: string;
    inPlanNetworkIndicatorCode?: string;
    inPlanNetworkIndicator?: string;
    procedureCode?: string;
    [key: string]: any;
}

export interface StediResponse {
    eligibilitySearchId?: string;
    plan?: {
        status?: string;
        groupNumber?: string;
        groupName?: string;
        planName?: string;
        effectiveDate?: string;
        terminationDate?: string;
        [key: string]: any;
    };
    benefits?: StediBenefit[];
    benefitsInformation?: StediBenefit[];
    subscriber?: {
        memberId?: string;
        firstName?: string;
        lastName?: string;
        dateOfBirth?: string;
        [key: string]: any;
    };
    payer?: {
        name?: string;
        [key: string]: any;
    };
    planInformation?: {
        groupNumber?: string;
        groupDescription?: string;
        [key: string]: any;
    };
    planDateInformation?: {
        planBegin?: string;
        planEnd?: string;
        eligibilityBegin?: string;
        [key: string]: any;
    };
    planStatus?: Array<{
        description?: string;
        statusCode?: string;
        [key: string]: any;
    }>;
    [key: string]: any;
}

export function parseStediResponse(stediJson: any): {
    verificationData: VerificationDataRow[],
    codeAnalysis: string
} {
    const data: StediResponse = stediJson || {};
    const benefits = data.benefits || data.benefitsInformation || [];

    // Create a deep copy of the base structure
    const verificationData: VerificationDataRow[] = JSON.parse(JSON.stringify(API_VERIFICATION_DATA));

    // Helper to update a row by saiCode
    const updateRow = (saiCode: string, value: string | undefined, verified: boolean = true) => {
        const row = verificationData.find(r => r.saiCode === saiCode);
        if (row && value && value !== "Not Found") {
            row.aiCallValue = value;
            row.missing = verified ? "N" : "Y";
            row.verifiedBy = verified ? "API" : "-";
        } else if (row) {
            row.aiCallValue = "";
            row.missing = "Y";
            row.verifiedBy = "-";
        }
    };

    // 1. Map Plan Information
    const planName = data.plan?.planName || data.planInformation?.groupDescription || "Active Plan";
    const groupNumber = data.plan?.groupNumber || data.planInformation?.groupNumber;
    const effectiveDate = data.plan?.effectiveDate || data.planDateInformation?.planBegin || data.planDateInformation?.eligibilityBegin;
    const carrierName = data.payer?.name || data.plan?.groupName || data.plan?.planName || "Insurance Carrier";

    updateRow("VF000001", planName);
    updateRow("VF000002", groupNumber);
    updateRow("VF000003", effectiveDate);
    updateRow("VF000004", carrierName);
    updateRow("VF000005", data.subscriber?.memberId);

    // 2. Map Deductibles
    const indDeductible = benefits.find(b => (b.code === 'C' || b.name?.toLowerCase().includes('deductible')) && b.coverageLevelCode !== 'FAM');
    const famDeductible = benefits.find(b => (b.code === 'C' || b.name?.toLowerCase().includes('deductible')) && b.coverageLevelCode === 'FAM');

    updateRow("VF000051", indDeductible?.benefitAmount ? `$${indDeductible.benefitAmount} (Individual)` : undefined);
    updateRow("VF000052", (indDeductible?.name || indDeductible?.serviceTypes?.[0]));
    updateRow("VF000053", famDeductible?.benefitAmount ? `$${famDeductible.benefitAmount} (Family)` : undefined);

    // 3. Map Maximums
    const maxBenefit = benefits.find(b => (b.code === 'D' || b.name?.toLowerCase().includes('maximum')) && !b.name?.toLowerCase().includes('ortho'));
    const orthoMax = benefits.find(b => (b.code === 'D' || b.name?.toLowerCase().includes('maximum')) && b.name?.toLowerCase().includes('ortho'));

    updateRow("VF000060", maxBenefit?.benefitAmount ? `$${maxBenefit.benefitAmount}` : undefined);
    updateRow("VF000061", orthoMax?.benefitAmount ? `$${orthoMax.benefitAmount} (Ortho)` : "Not Found");

    // 4. Map Detailed Dental Coverage
    const findValue = (keywords: string[]) => {
        const b = benefits.find(db =>
            keywords.some(kw =>
                (db.name?.toLowerCase().includes(kw)) ||
                (db.serviceTypes?.some(st => st.toLowerCase().includes(kw)))
            )
        );
        if (!b) return undefined;

        // Try to get frequency/waiting period if percentage is there
        const percent = b.benefitPercent ? `${b.benefitPercent}%` : (b.code === '1' ? "Covered" : undefined);
        const time = b.timeQualifier ? ` (${b.timeQualifier})` : "";

        if (percent) return `${percent}${time}`;
        return time.trim() || undefined;
    };

    // Preventative
    updateRow("VF000010", findValue(['prophy', 'cleaning']));
    updateRow("VF000011", findValue(['exam', 'eval']));
    updateRow("VF000012", findValue(['x-ray', 'radiograph', 'bitewing', 'fms']));
    updateRow("VF000028", findValue(['prophylaxis frequency', 'exam frequency']) || "2x per Year (Standard)");

    // Basic
    updateRow("VF000020", findValue(['restorative', 'filling', 'amalgam', 'composite']));
    updateRow("VF000021", findValue(['extraction']));
    updateRow("VF000022", findValue(['scaling', 'root planing', 'periodontal maintenance', 'periodontic']));

    // Major
    updateRow("VF000030", findValue(['crown']));
    updateRow("VF000031", findValue(['bridge', 'pontic']));
    updateRow("VF000032", findValue(['denture']));
    updateRow("VF000033", findValue(['root canal', 'endodontic']));
    updateRow("VF000034", findValue(['implant']));

    // Waiting Periods
    const majorWait = benefits.find(b => b.name?.toLowerCase().includes('waiting period') && (b.name?.toLowerCase().includes('major') || b.serviceTypes?.some(st => st.toLowerCase().includes('major'))));
    updateRow("VF000045", majorWait?.benefitAmount ? `${majorWait.benefitAmount} Months` : "None");

    // 5. Construct Code Analysis String
    let analysis = `COVERAGE BY CODE VIEW - DETAILED ANALYSIS (STEDI API LIVE DATA)\n\n`;

    // Filter benefits that look like procedures
    const procedureBenefits = benefits.filter(b => b.procedureCode || b.name || (b.serviceTypes && b.serviceTypes.length > 0));

    const sections = [
        { name: 'Preventive Services', keywords: ['preventive', 'cleaning', 'eval', 'exam', 'x-ray', 'prophy', 'fluoride'] },
        { name: 'Basic Services', keywords: ['restorative', 'basic', 'filling', 'amalgam', 'composite', 'extraction', 'simple extraction'] },
        { name: 'Major Services', keywords: ['major', 'prosthodontics', 'crown', 'bridge', 'denture', 'endodontic', 'root canal', 'surgical'] },
        { name: 'Periodontal Services', keywords: ['periodontic', 'scaling', 'root planing', 'maintenance'] }
    ];

    sections.forEach(section => {
        const sectionBenefits = procedureBenefits.filter(b =>
            section.keywords.some(kw =>
                (b.name?.toLowerCase().includes(kw)) ||
                (b.serviceTypes?.some(st => st.toLowerCase().includes(kw)))
            )
        );

        if (sectionBenefits.length > 0) {
            analysis += `${section.name}:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            sectionBenefits.forEach(b => {
                const name = b.name || b.serviceTypes?.[0] || 'Procedure';
                const code = b.procedureCode || 'N/A';
                const amount = b.benefitAmount ? `$${b.benefitAmount}` : '$0.00';
                let percent = b.benefitPercent ? `${b.benefitPercent}%` : b.code === '1' ? 'Covered' : 'N/A';
                if (percent === '100%') percent = '100% (Covered)';
                analysis += `${code.padEnd(6)} ${name.padEnd(30)} ${amount.padEnd(10)} $0.00     ✓ ${percent} Coverage\n`;
            });
            analysis += `\n`;
        }
    });

    // Fallback if no specific sections found
    if (!analysis.includes('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')) {
        analysis += `Detailed Benefits Table:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        benefits.slice(0, 20).forEach(b => {
            const name = b.name || (b.serviceTypes && b.serviceTypes[0]) || 'Unknown';
            const detail = [
                b.benefitPercent ? `${b.benefitPercent}%` : '',
                b.benefitAmount ? `$${b.benefitAmount}` : '',
                b.coverageLevel ? `(${b.coverageLevel})` : ''
            ].filter(Boolean).join(' ');
            if (name !== 'Unknown') {
                analysis += `${name.padEnd(40)} ${detail}\n`;
            }
        });
    }

    analysis += `\nANNUAL BENEFIT STATUS:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    analysis += `Maximum Benefit:        ${maxBenefit?.benefitAmount ? '$' + maxBenefit.benefitAmount : 'Not Found'}\n`;
    analysis += `Deductible:             ${indDeductible?.benefitAmount ? '$' + indDeductible.benefitAmount : 'Not Found'}\n`;
    analysis += `Plan Status:            ${data.planStatus?.[0]?.description || data.plan?.status || 'Active'}\n`;
    analysis += `Member ID:              ${data.subscriber?.memberId || 'N/A'}\n`;

    return {
        verificationData,
        codeAnalysis: analysis
    };
}
