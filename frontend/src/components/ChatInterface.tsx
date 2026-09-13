'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { ChatMessage, DocumentField } from '@/types/chat';
import { DocumentDetail } from '@/types/documents';
import { fetchGreeting, sendChatMessage } from '@/services/chatApi';
import { ErrorMessage } from './ErrorMessage';
import { Spinner } from './Spinner';

export interface DocumentState {
  documentType: string;
  fields: DocumentField[];
  isComplete: boolean;
  documentId: number | null;
}

interface ChatInterfaceProps {
  onDocumentStateUpdated: (state: DocumentState) => void;
  /** When resuming a previously saved document, its full state (skips the greeting call). */
  initialDocument?: DocumentDetail;
}

export function ChatInterface({ onDocumentStateUpdated, initialDocument }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialDocument?.messages ?? []);
  const [documentType, setDocumentType] = useState(initialDocument?.document_type ?? '');
  const [fields, setFields] = useState<DocumentField[]>(initialDocument?.fields ?? []);
  const [documentId, setDocumentId] = useState<number | null>(initialDocument?.id ?? null);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingGreeting, setIsLoadingGreeting] = useState(!initialDocument);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialDocument) {
      onDocumentStateUpdated({
        documentType: initialDocument.document_type,
        fields: initialDocument.fields,
        isComplete: initialDocument.is_complete,
        documentId: initialDocument.id,
      });
      return;
    }

    fetchGreeting()
      .then((result) => {
        setMessages([{ role: 'assistant', content: result.reply }]);
        setDocumentType(result.document_type);
        setFields(result.fields);
        onDocumentStateUpdated({
          documentType: result.document_type,
          fields: result.fields,
          isComplete: result.is_complete,
          documentId: null,
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not start the conversation.'))
      .finally(() => setIsLoadingGreeting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Refocus the input once it's re-enabled after a send completes. Calling
  // focus() synchronously in the same tick as setIsSending(false) doesn't
  // work: the input is still `disabled` in the DOM until React re-renders,
  // and browsers refuse to focus a disabled element.
  useEffect(() => {
    if (!isSending) {
      inputRef.current?.focus();
    }
  }, [isSending]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const nextHistory = [...messages, { role: 'user' as const, content: trimmed }];
    setMessages(nextHistory);
    setInput('');
    setIsSending(true);
    setError(null);

    try {
      const result = await sendChatMessage(trimmed, messages, documentType, fields, documentId);
      setMessages([...nextHistory, { role: 'assistant', content: result.reply }]);
      setDocumentType(result.document_type);
      setFields(result.fields);
      setDocumentId(result.document_id ?? null);
      onDocumentStateUpdated({
        documentType: result.document_type,
        fields: result.fields,
        isComplete: result.is_complete,
        documentId: result.document_id ?? null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong sending that message.');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoadingGreeting) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Spinner label="Starting conversation..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 whitespace-pre-wrap ${
                msg.role === 'user' ? 'bg-brand-purple text-white' : 'bg-slate-100 text-slate-800'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="rounded-lg px-4 py-2 bg-slate-100 text-slate-400">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && <ErrorMessage message={error} className="mb-2" />}

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-200 pt-4">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isSending}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent disabled:bg-slate-50"
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="px-4 py-2 bg-brand-purple text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}
