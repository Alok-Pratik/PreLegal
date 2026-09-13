import { MutualNdaFields } from './nda';

export type Role = 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface ChatTurnResult {
  reply: string;
  fields: MutualNdaFields;
}
