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
}
