import { NdaFormData } from "@/types/nda";

function formatDate(value: string): string {
  if (!value) return "[Effective Date]";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function fallback(value: string, placeholder: string): string {
  return value.trim() ? value.trim() : placeholder;
}

export interface NdaClause {
  heading: string;
  body: string;
}

export function buildNdaClauses(data: NdaFormData): NdaClause[] {
  const partyA = fallback(data.partyAName, "[Party A Name]");
  const partyB = fallback(data.partyBName, "[Party B Name]");
  const partyAAddress = fallback(data.partyAAddress, "[Party A Address]");
  const partyBAddress = fallback(data.partyBAddress, "[Party B Address]");
  const purpose = fallback(
    data.purpose,
    "[description of the purpose for which confidential information will be exchanged]"
  );
  const termYears = fallback(data.termYears, "[term length]");
  const governingLaw = fallback(data.governingLaw, "[Governing Law / Jurisdiction]");
  const effectiveDate = formatDate(data.effectiveDate);

  return [
    {
      heading: "1. Parties",
      body: `This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of ${effectiveDate} ("Effective Date"), by and between ${partyA}, located at ${partyAAddress} ("Party A"), and ${partyB}, located at ${partyBAddress} ("Party B"), collectively referred to as the "Parties."`,
    },
    {
      heading: "2. Purpose",
      body: `The Parties wish to disclose certain confidential and proprietary information to each other for the following purpose: ${purpose}. This Agreement sets forth the terms under which such information will be protected.`,
    },
    {
      heading: "3. Definition of Confidential Information",
      body: `"Confidential Information" means any non-public, proprietary information disclosed by either Party, whether orally, in writing, or in any other form, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure.`,
    },
    {
      heading: "4. Obligations of the Parties",
      body: `Each Party agrees to: (a) hold the other Party's Confidential Information in strict confidence; (b) not disclose such Confidential Information to any third party without prior written consent; and (c) use the Confidential Information solely for the purpose described above.`,
    },
    {
      heading: "5. Term",
      body: `This Agreement shall remain in effect for a period of ${termYears} year(s) from the Effective Date, unless earlier terminated by mutual written consent of the Parties. The obligations of confidentiality shall survive termination of this Agreement.`,
    },
    {
      heading: "6. Governing Law",
      body: `This Agreement shall be governed by and construed in accordance with the laws of ${governingLaw}, without regard to its conflict of laws principles.`,
    },
    {
      heading: "7. Signatures",
      body: `IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date first written above.`,
    },
  ];
}
