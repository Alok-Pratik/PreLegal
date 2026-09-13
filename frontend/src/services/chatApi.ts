import { ChatMessage, ChatTurnResult, DocumentField } from '@/types/chat';

async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return body.detail || fallback;
  } catch {
    return fallback;
  }
}

export async function fetchGreeting(): Promise<ChatTurnResult> {
  const res = await fetch('/api/chat/greeting', { credentials: 'include' });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, 'Failed to start the conversation'));
  }
  return res.json();
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  documentType: string,
  fields: DocumentField[]
): Promise<ChatTurnResult> {
  const res = await fetch('/api/chat/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ message, history, document_type: documentType, fields }),
  });

  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, 'Failed to send message'));
  }
  return res.json();
}
