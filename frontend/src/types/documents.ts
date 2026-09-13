import { ChatMessage, DocumentField } from './chat';

export interface DocumentSummary {
  id: number;
  document_type: string;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentDetail extends DocumentSummary {
  fields: DocumentField[];
  messages: ChatMessage[];
}
