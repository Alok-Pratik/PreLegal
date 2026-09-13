import { DocumentField } from '@/types/chat';
import { groupFields } from '@/utils/documentFields';

interface DocumentPreviewProps {
  documentType: string;
  fields: DocumentField[];
}

function Field({ field }: { field: DocumentField }) {
  return (
    <div>
      <dt className="text-xs font-medium text-[#888888] uppercase tracking-wide">{field.label}</dt>
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
      <h2 className="text-xl font-bold text-[#032147]">{documentType}</h2>

      {groups.map(([group, groupFields]) => (
        <div key={group || '__top_level__'}>
          {group && <h3 className="font-semibold text-[#032147] mb-2">{group}</h3>}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {groupFields.map((field) => (
              <Field key={field.key} field={field} />
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
