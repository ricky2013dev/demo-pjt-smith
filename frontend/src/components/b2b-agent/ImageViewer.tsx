import React, { useState } from 'react';

interface ImageViewerProps {
  imageUrl: string;
  showPreviewOnly?: boolean;
  onImageClick?: () => void;
  maxWidth?: string;
  alt?: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  imageUrl,
  showPreviewOnly = true,
  onImageClick,
  maxWidth = '100%',
  alt = 'Image'
}) => {
  const [error, setError] = useState<string | null>(null);

  if (!imageUrl || imageUrl.trim() === '') {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-yellow-50 dark:bg-yellow-900/20 rounded">
        <span className="material-symbols-outlined text-6xl text-yellow-600">warning</span>
        <p className="mt-4 text-sm text-yellow-700 dark:text-yellow-400">No image URL provided</p>
      </div>
    );
  }

  return (
    <div
      className={`image-viewer ${onImageClick ? 'cursor-pointer' : ''}`}
      onClick={onImageClick}
      style={{ maxWidth }}
    >
      <img
        src={imageUrl}
        alt={alt}
        onError={() => setError('Failed to load image')}
        className="w-full h-auto shadow-lg rounded"
      />
      {error && (
        <div className="flex flex-col items-center justify-center p-12 bg-red-50 dark:bg-red-900/20 rounded">
          <span className="material-symbols-outlined text-6xl text-red-500">error</span>
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">Failed to load image</p>
          <p className="mt-2 text-xs text-red-500 dark:text-red-400">Invalid image URL or format</p>
        </div>
      )}
    </div>
  );
};

interface ImageViewerWithModalProps {
  imageUrl: string;
  firstPageMaxWidth?: string;
  alt?: string;
}

export const ImageViewerWithModal: React.FC<ImageViewerWithModalProps> = ({
  imageUrl,
  firstPageMaxWidth = '50%',
  alt = 'Image'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Preview Display */}
      <div className="relative group">
        <ImageViewer
          imageUrl={imageUrl}
          showPreviewOnly={true}
          onImageClick={() => setIsModalOpen(true)}
          maxWidth={firstPageMaxWidth}
          alt={alt}
        />
        {/* Overlay hint */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
          <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-lg">
            <span className="text-sm font-medium text-slate-900 dark:text-white">Click to view full image</span>
          </div>
        </div>
      </div>

      {/* Full Image Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">
                  image
                </span>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Fax Document
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
            <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
              <ImageViewer
                imageUrl={imageUrl}
                showPreviewOnly={false}
                maxWidth="100%"
                alt={alt}
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
