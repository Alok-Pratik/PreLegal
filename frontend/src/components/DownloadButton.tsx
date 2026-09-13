'use client';

import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { NDAPdf } from './NDAPdf';
import { MutualNdaFields } from '@/types/nda';

interface DownloadButtonProps {
  fields: MutualNdaFields;
}

export function DownloadButton({ fields }: DownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsGenerating(true);
    setError(null);

    let url: string | null = null;

    try {
      const blob = await pdf(<NDAPdf fields={fields} />).toBlob();
      url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'mutual-nda.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      if (url) {
        URL.revokeObjectURL(url);
      }
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={isGenerating}
        aria-busy={isGenerating}
        className="px-4 py-2 bg-[#209dd7] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? 'Generating PDF...' : 'Download PDF'}
      </button>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
