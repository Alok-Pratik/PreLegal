'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginScreen } from '@/components/LoginScreen';
import { AppHeader, AppView } from '@/components/AppHeader';
import { ChatInterface, DocumentState } from '@/components/ChatInterface';
import { DocumentPreview } from '@/components/DocumentPreview';
import { DownloadButton } from '@/components/DownloadButton';
import { DocumentsList } from '@/components/DocumentsList';
import { fetchDocument } from '@/services/documentsApi';
import { DocumentDetail } from '@/types/documents';

const EMPTY_STATE: DocumentState = { documentType: '', fields: [], isComplete: false, documentId: null };

export default function Home() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<AppView>('documents');
  const [documentState, setDocumentState] = useState<DocumentState>(EMPTY_STATE);
  const [selectedDocument, setSelectedDocument] = useState<DocumentDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { documentType, fields, isComplete } = documentState;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const startNewDocument = () => {
    setSelectedDocument(null);
    setDocumentState(EMPTY_STATE);
    setLoadError(null);
    setView('chat');
  };

  const openDocument = async (id: number) => {
    setLoadError(null);
    try {
      const document = await fetchDocument(id);
      setSelectedDocument(document);
      setDocumentState({
        documentType: document.document_type,
        fields: document.fields,
        isComplete: document.is_complete,
        documentId: document.id,
      });
      setView('chat');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to open that document');
    }
  };

  const navigate = (nextView: AppView) => {
    if (nextView === 'chat') {
      startNewDocument();
    } else {
      setView(nextView);
    }
  };

  const headerProps =
    view === 'documents'
      ? {
          title: 'My Documents',
          subtitle: 'Every legal document you have created',
          actions: (
            <button
              type="button"
              onClick={startNewDocument}
              className="px-4 py-2 bg-brand-purple text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              + New Document
            </button>
          ),
        }
      : {
          title: documentType || 'Legal Document Creator',
          subtitle: 'Create a legal document with AI assistance',
          actions: isComplete && <DownloadButton documentType={documentType} fields={fields} />,
        };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AppHeader user={user} view={view} onNavigate={navigate} {...headerProps} />

      <main className="max-w-[1800px] mx-auto p-6">
        {loadError && (
          <p className="text-sm text-red-600 mb-4" role="alert">
            {loadError}
          </p>
        )}

        {view === 'documents' ? (
          <DocumentsList onSelectDocument={openDocument} onCreateNew={startNewDocument} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800">AI Assistant</h2>
                <p className="text-sm text-brand-gray">Tell me what document you need</p>
              </div>
              <div className="p-6 h-[calc(100vh-260px)]">
                <ChatInterface
                  key={selectedDocument?.id ?? 'new'}
                  initialDocument={selectedDocument ?? undefined}
                  onDocumentStateUpdated={setDocumentState}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Document Preview</h2>
                  <p className="text-sm text-brand-gray">Live preview updates as you chat</p>
                </div>
                {isComplete && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Ready to download
                  </span>
                )}
              </div>
              <div className="p-6 max-h-[calc(100vh-260px)] overflow-y-auto">
                <DocumentPreview documentType={documentType} fields={fields} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
