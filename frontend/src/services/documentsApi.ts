import { DocumentDetail, DocumentSummary } from '@/types/documents';
import { getJson } from './apiClient';

export async function fetchDocuments(): Promise<DocumentSummary[]> {
  return getJson('/api/documents', 'Failed to load documents');
}

export async function fetchDocument(id: number): Promise<DocumentDetail> {
  return getJson(`/api/documents/${id}`, 'Failed to load document');
}
