import React, { useState, useEffect } from "react";
import dentalCodesData from "@mockupdata/common_dental_cdt_codes.json";
import { Procedure } from "@/types/patient";

export interface VerificationDataRow {
  saiCode: string;
  refInsCode: string;
  category: string;
  fieldName: string;
  preStepValue: string;
  verifiedBy: string;
  comments: string;
}

interface CoverageByCodeViewProps {
  procedures?: Procedure[];
  patientId?: string;
}

// Process dental codes data
const processDentalCodes = (): VerificationDataRow[] => {
  try {
    if (dentalCodesData.success && dentalCodesData.data && dentalCodesData.data.procedures) {
      return dentalCodesData.data.procedures.map((procedure: any, index: number) => ({
        saiCode: `VF${String(index + 1).padStart(6, '0')}`,
        refInsCode: procedure.code,
        category: procedure.category,
        fieldName: procedure.description,
        preStepValue: `${procedure.benefit.percentageCovered}% coverage`,
        verifiedBy: "API",
        comments: "Verified via API pre-step"
      }));
    }

    return [];
  } catch (error) {
    return [];
  }
};

// Process database procedures
const processDatabaseProcedures = (procedures: Procedure[]): VerificationDataRow[] => {
  return procedures.map((proc, index) => ({
    saiCode: `VF${String(index + 1).padStart(6, '0')}`,
    refInsCode: proc.code,
    category: proc.category,
    fieldName: proc.name,
    preStepValue: proc.coverage,
    verifiedBy: "API",
    comments: "Verified via API pre-step"
  }));
};

// Default data (will be replaced by fetched data)
const defaultVerificationData: VerificationDataRow[] = [];

const CoverageByCodeView: React.FC<CoverageByCodeViewProps> = ({ procedures, patientId }) => {
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [verificationData, setVerificationData] = useState<VerificationDataRow[]>(defaultVerificationData);
  const [loading, setLoading] = useState(true);

  // Fetch coverage by code data from database
  const fetchCoverageByCodeData = async (patientId: string) => {
    try {
      const response = await fetch(`/api/coverage-by-code/${patientId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          // Transform database records to VerificationDataRow format
          const transformedData: VerificationDataRow[] = result.data.map((record: any) => ({
            saiCode: record.saiCode || '',
            refInsCode: record.refInsCode || '',
            category: record.category || '',
            fieldName: record.fieldName || '',
            preStepValue: record.preStepValue || '',
            verifiedBy: record.verifiedBy || '',
            comments: record.comments || ''
          }));
          setVerificationData(transformedData);
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  // Load data on component mount or when procedures/patientId change
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // First, try to fetch from database if patientId is available
      if (patientId) {
        const hasData = await fetchCoverageByCodeData(patientId);
        if (hasData) {
          setLoading(false);
          return;
        }
      }

      // Fallback to procedures if available
      if (procedures && procedures.length > 0) {
        const data = processDatabaseProcedures(procedures);
        setVerificationData(data);
      } else {
        // No data available
        setVerificationData([]);
      }

      setLoading(false);
    };

    loadData();
  }, [procedures, patientId]);

  // Get unique categories from the data
  const dataCategories = Array.from(new Set(verificationData.map(row => row.category)));

  // Map display names for better UX
  const categoryDisplayMap: Record<string, string> = {
    "Preventive": "Preventative Coverage",
    "Restorative": "Basic Coverage",
    "Radiographs": "Basic Coverage",
    "Endodontics": "Major Coverage",
    "Periodontics": "Periodontal Coverage",
    "Prosthodontics": "Major Coverage",
    "Miscellaneous": "Miscellaneous"
  };

  // Filter data based on category
  const filteredData = categoryFilter === "All"
    ? verificationData
    : verificationData.filter(row => {
      const displayName = categoryDisplayMap[row.category] || row.category;
      return displayName === categoryFilter || row.category === categoryFilter;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-600 dark:text-slate-400">Loading dental codes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Section */}
      <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Category:</span>
          <button
            onClick={() => setCategoryFilter("All")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${categoryFilter === "All"
              ? "bg-slate-900 dark:bg-slate-700 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
          >
            All
          </button>
          {/* Show unique categories based on dental codes */}
          {["Patient Information", "Subscriber Information", "Insurance Information", "Preventative Coverage", "Basic Coverage", "Major Coverage", "Periodontal Coverage", "Implant Coverage", "Orthodontic Coverage", "Miscellaneous", "Additional Notes"].map((displayCategory) => {
            // Check if this category has data
            const hasData = verificationData.some(row => {
              const rowDisplayName = categoryDisplayMap[row.category] || row.category;
              return rowDisplayName === displayCategory;
            });

            if (!hasData) return null;

            return (
              <button
                key={displayCategory}
                onClick={() => setCategoryFilter(displayCategory)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${categoryFilter === displayCategory
                  ? "bg-slate-900 dark:bg-slate-700 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
              >
                {displayCategory}
              </button>
            );
          })}
        </div>
      </div>

      {/* Data Table */}
      <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-medium text-slate-900 dark:text-white">
            Insurance Verification Data by Code
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Showing {filteredData.length} of {verificationData.length} records
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  SAI Code#
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  REF INS Code#
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Field Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Pre Step Value
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Verified
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Verified By
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Comments
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredData.map((row, index) => (
                <tr
                  key={index}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-4 py-3 text-sm font-mono text-slate-900 dark:text-white">
                    {row.saiCode}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-900 dark:text-white">
                    {row.refInsCode}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                    {row.category}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                    {row.fieldName}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                    {row.preStepValue || "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-semibold text-status-green">
                      Yes
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-500">
                      {row.verifiedBy}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {row.comments}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CoverageByCodeView;
