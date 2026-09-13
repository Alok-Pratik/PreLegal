import { DocumentField } from '@/types/chat';
import { groupFields } from '@/utils/documentFields';

interface DocumentPreviewProps {
  documentType: string;
  fields: DocumentField[];
}

const DISCLAIMER =
  'This document is a draft generated with AI assistance. It is not legal advice and should be reviewed by a qualified attorney before use.';

function Field({ field }: { field: DocumentField }) {
  return (
    <div>
      <dt className="text-xs font-medium text-brand-gray uppercase tracking-wide">{field.label}</dt>
      <dd className={`mt-0.5 ${field.value ? 'text-slate-800' : 'text-slate-400 italic'}`}>
        {field.value || 'Not yet provided'}
      </dd>
    </div>
  );
}

export function DocumentPreview({ documentType, fields }: DocumentPreviewProps) {
  if (!documentType) {
    return (
      <p className="text-slate-400 italic">
        Once you tell the assistant what document you need, a preview will appear here.
      </p>
    );
  }

  const groups = groupFields(fields);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-brand-navy">{documentType}</h2>

      {groups.map(([group, groupFields]) => (
        <div key={group || '__top_level__'}>
          {group && <h3 className="font-semibold text-brand-navy mb-2">{group}</h3>}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {groupFields.map((field) => (
              <Field key={field.key} field={field} />
            ))}
          </dl>
        </div>
      ))}

      <p className="pt-4 border-t border-slate-200 text-xs text-brand-gray">{DISCLAIMER}</p>
    </div>
  );
}
