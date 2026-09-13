'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginScreen } from '@/components/LoginScreen';
import { UserMenu } from '@/components/UserMenu';
import { ChatInterface } from '@/components/ChatInterface';
import { NDAPreview } from '@/components/NDAPreview';
import { DownloadButton } from '@/components/DownloadButton';
import { MutualNdaFields, defaultFields, isNdaComplete } from '@/types/nda';

export default function Home() {
  const { user, loading } = useAuth();
  const [fields, setFields] = useState<MutualNdaFields>(defaultFields);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#753991]"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const isComplete = isNdaComplete(fields);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#032147]">Mutual NDA Creator</h1>
            <p className="text-sm text-[#888888]">Create a Mutual NDA with AI assistance</p>
          </div>
          <div className="flex items-center gap-3">
            {isComplete && <DownloadButton fields={fields} />}
            <UserMenu user={user} />
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">AI Assistant</h2>
              <p className="text-sm text-[#888888]">Tell me about the NDA you need</p>
            </div>
            <div className="p-6 h-[calc(100vh-220px)]">
              <ChatInterface onFieldsUpdated={setFields} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Document Preview</h2>
                <p className="text-sm text-[#888888]">Live preview updates as you chat</p>
              </div>
              {isComplete && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Ready to download
                </span>
              )}
            </div>
            <div className="p-6 max-h-[calc(100vh-220px)] overflow-y-auto">
              <NDAPreview fields={fields} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
