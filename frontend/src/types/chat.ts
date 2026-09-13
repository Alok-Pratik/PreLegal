export type Role = 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface DocumentField {
  key: string;
  label: string;
  value: string;
  group: string;
}

export interface ChatTurnResult {
  reply: string;
  document_type: string;
  fields: DocumentField[];
  is_complete: boolean;
  // Set once the turn has been persisted to a document row (see
  // POST /api/chat/message); absent from the greeting response.
  document_id?: number | null;
}
