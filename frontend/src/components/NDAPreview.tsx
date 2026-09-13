import { MutualNdaFields, Party } from '@/types/nda';

interface NDAPreviewProps {
  fields: MutualNdaFields;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-[#888888] uppercase tracking-wide">{label}</dt>
      <dd className={`mt-0.5 ${value ? 'text-slate-800' : 'text-slate-400 italic'}`}>
        {value || 'Not yet provided'}
      </dd>
    </div>
  );
}

function PartyDetails({ label, party }: { label: string; party: Party }) {
  return (
    <div>
      <h4 className="font-semibold text-[#032147] mb-2">{label}</h4>
      <dl className="grid grid-cols-2 gap-3">
        <Field label="Name" value={party.name} />
        <Field label="Title" value={party.title} />
        <Field label="Company" value={party.company} />
        <Field label="Notice Address" value={party.notice_address} />
      </dl>
    </div>
  );
}

export function NDAPreview({ fields }: NDAPreviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#032147]">Mutual Non-Disclosure Agreement</h2>
        <p className="text-sm text-[#888888]">Common Paper Mutual NDA Standard Terms Version 1.0</p>
      </div>

      <div>
        <h3 className="font-semibold text-[#032147] mb-2">Cover Page</h3>
        <dl className="grid grid-cols-2 gap-3">
          <Field label="Purpose" value={fields.purpose} />
          <Field label="Effective Date" value={fields.effective_date} />
          <Field label="MNDA Term" value={fields.mnda_term} />
          <Field label="Term of Confidentiality" value={fields.confidentiality_term} />
          <Field label="Governing Law" value={fields.governing_law} />
          <Field label="Jurisdiction" value={fields.jurisdiction} />
        </dl>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <PartyDetails label="Party 1" party={fields.party1} />
        <PartyDetails label="Party 2" party={fields.party2} />
      </div>
    </div>
  );
}
