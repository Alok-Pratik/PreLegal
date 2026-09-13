import { ChatMessage, ChatTurnResult } from '@/types/chat';
import { MutualNdaFields } from '@/types/nda';

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
  fields: MutualNdaFields
): Promise<ChatTurnResult> {
  const res = await fetch('/api/chat/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ message, history, fields }),
  });

  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, 'Failed to send message'));
  }
  return res.json();
}
