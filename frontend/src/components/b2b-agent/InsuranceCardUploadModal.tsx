import React, { useState } from "react";

interface InsuranceCardUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataScanned: (data: ScannedData) => void;
  patientId: string;
}

export interface ScannedData {
  firstName: string;
  middleName: string;
  lastName: string;
  insuranceProvider: string;
  policyNumber: string;
  groupNumber: string;
  subscriberId: string;
}

const InsuranceCardUploadModal: React.FC<InsuranceCardUploadModalProps> = ({
  isOpen,
  onClose,
  onDataScanned,
  patientId,
}) => {
  const [_uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanComplete, setScanComplete] = useState(false);

  // Sample insurance card image URL for testing
  const sampleInsuranceCardUrl = "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80";

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!_uploadedFile) return;

    setIsScanning(true);
    setScanProgress(0);
    setScanComplete(false);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('insuranceCardImage', _uploadedFile);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setScanProgress((prev) => Math.min(prev + 10, 90));
      }, 300);

      // Call backend OCR API
      const response = await fetch(`/api/patients/${patientId}/insurance-card-ocr`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      clearInterval(progressInterval);
      setScanProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'OCR processing failed');
      }

      const { extractedData, confidence } = await response.json();

      // Check for placeholder data or low confidence
      const hasPlaceholders =
        extractedData.firstName === 'Unknown' ||
        extractedData.lastName === 'Patient' ||
        extractedData.provider === 'Unknown Provider' ||
        extractedData.policyNumber === 'UNKNOWN';

      const isLowConfidence = confidence.overall < 70;

      // Show warning if low confidence or placeholders detected
      if (isLowConfidence || hasPlaceholders) {
        const warningMessage = hasPlaceholders
          ? 'Some information could not be extracted from the card. Please review and update the data manually.'
          : 'OCR confidence is low. Please verify the extracted information is correct.';

        if (!confirm(`${warningMessage}\n\nConfidence: ${confidence.overall}%\n\nDo you want to continue with the extracted data?`)) {
          setIsScanning(false);
          setScanProgress(0);
          return;
        }
      }

      // Pass extracted data to parent component
      onDataScanned({
        firstName: extractedData.firstName || '',
        middleName: extractedData.middleName || '',
        lastName: extractedData.lastName || '',
        insuranceProvider: extractedData.provider || '',
        policyNumber: extractedData.policyNumber || '',
        groupNumber: extractedData.groupNumber || '',
        subscriberId: extractedData.subscriberId || ''
      });

      setScanComplete(true);

      // Auto-close after showing success
      setTimeout(() => {
        onClose();
        setUploadedFile(null);
        setPreviewUrl(null);
        setScanProgress(0);
        setScanComplete(false);
      }, 1000);

    } catch (error) {
      alert('Failed to scan insurance card. Please try again or enter data manually.');
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  const handleUseSampleCard = () => {
    setPreviewUrl(sampleInsuranceCardUrl);
    setUploadedFile(new File([], "sample-insurance-card.jpg"));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined">upload_file</span>
            Upload Insurance Card And Scan
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {!isScanning && !scanComplete && (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">
                    info
                  </span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
                      How it works
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Upload a photo of the patient's insurance card. Our AI will
                      automatically scan and extract information, then fill in all
                      necessary patient details including name, date of birth, insurance
                      information, and contact details.
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center">
                {previewUrl ? (
                  <div className="space-y-4">
                    <img
                      src={previewUrl}
                      alt="Insurance Card Preview"
                      className="max-w-full max-h-64 mx-auto rounded-lg shadow-lg"
                    />
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => {
                          setUploadedFile(null);
                          setPreviewUrl(null);
                        }}
                        className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
                      >
                        Remove
                      </button>
                      <button
                        onClick={handleScan}
                        className="px-6 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 text-sm font-medium"
                      >
                        <span className="material-symbols-outlined text-base">
                          document_scanner
                        </span>
                        Start Scanning
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <span className="material-symbols-outlined text-6xl text-slate-400 dark:text-slate-600">
                        add_photo_alternate
                      </span>
                    </div>
                    <div>
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-base">
                          upload
                        </span>
                        Choose File
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      or drag and drop an image here
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Supported formats: JPG, PNG, PDF
                    </p>

                    {/* Sample Card Button */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                      <button
                        onClick={handleUseSampleCard}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mx-auto"
                      >
                        <span className="material-symbols-outlined text-base">
                          credit_card
                        </span>
                        Use Sample Insurance Card for Testing
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {isScanning && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              {/* Preview Image */}
              {previewUrl && (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Scanning Insurance Card"
                    className="max-w-md max-h-48 rounded-lg shadow-lg opacity-90"
                  />
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-lg animate-pulse"></div>
                </div>
              )}

              {/* Scanning Animation */}
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 dark:border-slate-700"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent absolute top-0 left-0"></div>
              </div>

              {/* Scanning Message */}
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  Scanning Insurance Card...
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  AI is extracting patient information
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-md">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
                  <span>Progress</span>
                  <span>{scanProgress}%</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Scanning Steps */}
              <div className="w-full max-w-md space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400">
                    check_circle
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    Image processed
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 animate-pulse">
                    motion_photos_on
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    Extracting text data...
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm opacity-50">
                  <span className="material-symbols-outlined text-slate-400">
                    radio_button_unchecked
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    Validating information
                  </span>
                </div>
              </div>
            </div>
          )}

          {scanComplete && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              {/* Success Icon */}
              <div className="relative">
                <div className="rounded-full h-20 w-20 bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-5xl text-green-600 dark:text-green-400">
                    check_circle
                  </span>
                </div>
              </div>

              {/* Success Message */}
              <div className="text-center space-y-2">
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  Scan Complete!
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Patient information has been extracted and will be auto-filled
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isScanning && !scanComplete && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsuranceCardUploadModal;
