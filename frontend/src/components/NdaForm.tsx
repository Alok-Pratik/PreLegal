"use client";

import { NdaFormData } from "@/types/nda";

interface FieldConfig {
  name: keyof NdaFormData;
  label: string;
  type?: "text" | "date" | "number" | "textarea";
  placeholder?: string;
}

const fields: FieldConfig[] = [
  { name: "partyAName", label: "Party A Name", placeholder: "Acme Inc." },
  {
    name: "partyAAddress",
    label: "Party A Address",
    placeholder: "123 Main St, Springfield, USA",
  },
  { name: "partyBName", label: "Party B Name", placeholder: "Globex Corp." },
  {
    name: "partyBAddress",
    label: "Party B Address",
    placeholder: "456 Market St, Metropolis, USA",
  },
  { name: "effectiveDate", label: "Effective Date", type: "date" },
  {
    name: "purpose",
    label: "Purpose / Description of Confidential Information",
    type: "textarea",
    placeholder: "Evaluating a potential business partnership...",
  },
  { name: "termYears", label: "Term (years)", type: "number" },
  {
    name: "governingLaw",
    label: "Governing Law / Jurisdiction",
    placeholder: "State of Delaware, USA",
  },
];

interface NdaFormProps {
  data: NdaFormData;
  onChange: (data: NdaFormData) => void;
}

export default function NdaForm({ data, onChange }: NdaFormProps) {
  function handleChange(name: keyof NdaFormData, value: string) {
    onChange({ ...data, [name]: value });
  }

  return (
    <form className="flex flex-col gap-4">
      {fields.map((field) => (
        <label key={field.name} className="flex flex-col gap-1 text-sm font-medium">
          {field.label}
          {field.type === "textarea" ? (
            <textarea
              className="min-h-24 rounded-md border border-black/15 bg-transparent p-2 text-sm font-normal outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40"
              value={data[field.name]}
              placeholder={field.placeholder}
              onChange={(e) => handleChange(field.name, e.target.value)}
            />
          ) : (
            <input
              type={field.type ?? "text"}
              min={field.type === "number" ? 1 : undefined}
              className="rounded-md border border-black/15 bg-transparent p-2 text-sm font-normal outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40"
              value={data[field.name]}
              placeholder={field.placeholder}
              onChange={(e) => handleChange(field.name, e.target.value)}
            />
          )}
        </label>
      ))}
    </form>
  );
}
