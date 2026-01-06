import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Configure PDF.js worker with fallback
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

interface PDFViewerProps {
  pdfUrl: string;
  showFirstPageOnly?: boolean;
  onPageClick?: () => void;
  maxWidth?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  pdfUrl,
  showFirstPageOnly = true,
  onPageClick,
  maxWidth = '100%'
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    const errorMsg = error.message || 'Unknown error loading PDF';
    setError(errorMsg);
  };

  if (!pdfUrl || pdfUrl.trim() === '') {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-yellow-50 dark:bg-yellow-900/20 rounded">
        <span className="material-symbols-outlined text-6xl text-yellow-600">warning</span>
        <p className="mt-4 text-sm text-yellow-700 dark:text-yellow-400">No PDF URL provided</p>
      </div>
    );
  }

  return (
    <div
      className={`pdf-viewer ${onPageClick ? 'cursor-pointer' : ''}`}
      onClick={onPageClick}
      style={{ maxWidth }}
    >
      <Document
        file={pdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-800 rounded">
            <span className="material-symbols-outlined text-6xl text-blue-500 animate-pulse">description</span>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Loading PDF...</p>
          </div>
        }
        error={
          <div className="flex flex-col items-center justify-center p-12 bg-red-50 dark:bg-red-900/20 rounded">
            <span className="material-symbols-outlined text-6xl text-red-500">error</span>
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">Failed to load PDF</p>
            <p className="mt-2 text-xs text-red-500 dark:text-red-400">Invalid PDF structure or URL</p>
            {error && <p className="mt-2 text-xs text-red-500 dark:text-red-400">Details: {error}</p>}
          </div>
        }
      >
        {showFirstPageOnly ? (
          <Page
            pageNumber={1}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            width={600}
            className="shadow-lg"
          />
        ) : (
          numPages && Array.from(new Array(numPages), (_, index) => (
            <div key={`page_${index + 1}`} className="mb-4">
              <Page
                pageNumber={index + 1}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                width={800}
                className="shadow-lg"
              />
            </div>
          ))
        )}
      </Document>
    </div>
  );
};

interface PDFViewerWithModalProps {
  pdfUrl: string;
  firstPageMaxWidth?: string;
}

export const PDFViewerWithModal: React.FC<PDFViewerWithModalProps> = ({
  pdfUrl,
  firstPageMaxWidth = '50%'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* First Page Display */}
      <div className="relative group">
        <PDFViewer
          pdfUrl={pdfUrl}
          showFirstPageOnly={true}
          onPageClick={() => setIsModalOpen(true)}
          maxWidth={firstPageMaxWidth}
        />
        {/* Overlay hint */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
          <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-lg">
            <span className="text-sm font-medium text-slate-900 dark:text-white">Click to view all pages</span>
          </div>
        </div>
      </div>

      {/* Full PDF Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">
                  picture_as_pdf
                </span>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Fax Document - All Pages
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <PDFViewer
                pdfUrl={pdfUrl}
                showFirstPageOnly={false}
                maxWidth="100%"
              />
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-800 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white text-xs font-medium rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
