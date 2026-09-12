import { NdaFormData } from "@/types/nda";
import { buildNdaClauses } from "@/lib/nda-content";

export default function NdaPreview({ data }: { data: NdaFormData }) {
  const clauses = buildNdaClauses(data);

  return (
    <div className="rounded-lg border border-black/10 bg-white p-8 text-sm leading-relaxed text-neutral-800 shadow-sm dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100">
      <h2 className="mb-6 text-center text-lg font-semibold uppercase tracking-wide">
        Mutual Non-Disclosure Agreement
      </h2>
      {clauses.map((clause) => (
        <div key={clause.heading} className="mb-4">
          <h3 className="mb-1 font-semibold">{clause.heading}</h3>
          <p className="whitespace-pre-wrap">{clause.body}</p>
        </div>
      ))}
      <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div>
          <div className="mb-8 border-b border-neutral-400" />
          <p>{data.partyAName.trim() || "[Party A Name]"}</p>
          <p className="text-neutral-500">Party A</p>
        </div>
        <div>
          <div className="mb-8 border-b border-neutral-400" />
          <p>{data.partyBName.trim() || "[Party B Name]"}</p>
          <p className="text-neutral-500">Party B</p>
        </div>
      </div>
    </div>
  );
}
