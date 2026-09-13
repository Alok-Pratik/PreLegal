import { ChatMessage, ChatTurnResult, DocumentField } from '@/types/chat';
import { getJson, postJson } from './apiClient';

export async function fetchGreeting(): Promise<ChatTurnResult> {
  return getJson('/api/chat/greeting', 'Failed to start the conversation');
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  documentType: string,
  fields: DocumentField[],
  documentId: number | null
): Promise<ChatTurnResult> {
  return postJson(
    '/api/chat/message',
    { message, history, document_type: documentType, fields, document_id: documentId },
    'Failed to send message'
  );
}
