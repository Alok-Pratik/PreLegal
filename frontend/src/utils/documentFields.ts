import { DocumentField } from '@/types/chat';

/** Groups fields by their `group` label, ungrouped ("") fields first, each
 * named group in the order it first appears. */
export function groupFields(fields: DocumentField[]): [string, DocumentField[]][] {
  const groups = new Map<string, DocumentField[]>();
  for (const field of fields) {
    const key = field.group || '';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(field);
  }
  const ordered = [...groups.entries()];
  ordered.sort((a, b) => (a[0] === '' ? -1 : b[0] === '' ? 1 : 0));
  return ordered;
}
