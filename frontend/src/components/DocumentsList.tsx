'use client';

import { useEffect, useState } from 'react';
import { fetchDocuments } from '@/services/documentsApi';
import { DocumentSummary } from '@/types/documents';

interface DocumentsListProps {
  onSelectDocument: (id: number) => void;
  onCreateNew: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function DocumentsList({ onSelectDocument, onCreateNew }: DocumentsListProps) {
  const [documents, setDocuments] = useState<DocumentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments()
      .then(setDocuments)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load documents'));
  }, []);

  if (error) {
    return (
      <p className="text-sm text-red-600" role="alert">
        {error}
      </p>
    );
  }

  if (documents === null) {
    return <p className="text-slate-400 italic">Loading your documents...</p>;
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 mb-4">You haven&apos;t created any documents yet.</p>
        <button
          type="button"
          onClick={onCreateNew}
          className="px-4 py-2 bg-brand-purple text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Create your first document
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc) => (
        <button
          key={doc.id}
          type="button"
          onClick={() => onSelectDocument(doc.id)}
          className="text-left bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-brand-blue hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-brand-navy">{doc.document_type}</h3>
            <span
              className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                doc.is_complete ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {doc.is_complete ? 'Complete' : 'In progress'}
            </span>
          </div>
          <p className="text-xs text-brand-gray mt-2">Updated {formatDate(doc.updated_at)}</p>
        </button>
      ))}
    </div>
  );
}
