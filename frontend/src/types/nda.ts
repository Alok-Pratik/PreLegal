export interface Party {
  name: string;
  title: string;
  company: string;
  notice_address: string;
  date: string;
}

export interface MutualNdaFields {
  purpose: string;
  effective_date: string;
  mnda_term: string;
  confidentiality_term: string;
  governing_law: string;
  jurisdiction: string;
  party1: Party;
  party2: Party;
}

export const defaultParty: Party = {
  name: '',
  title: '',
  company: '',
  notice_address: '',
  date: '',
};

export const defaultFields: MutualNdaFields = {
  purpose: '',
  effective_date: '',
  mnda_term: '',
  confidentiality_term: '',
  governing_law: '',
  jurisdiction: '',
  party1: { ...defaultParty },
  party2: { ...defaultParty },
};

const REQUIRED_PARTY_FIELDS: (keyof Party)[] = ['name', 'title', 'company', 'notice_address'];

export function isNdaComplete(fields: MutualNdaFields): boolean {
  const topLevelComplete = Boolean(
    fields.purpose &&
      fields.effective_date &&
      fields.mnda_term &&
      fields.confidentiality_term &&
      fields.governing_law &&
      fields.jurisdiction
  );

  const partyComplete = (party: Party) => REQUIRED_PARTY_FIELDS.every((key) => Boolean(party[key]));

  return topLevelComplete && partyComplete(fields.party1) && partyComplete(fields.party2);
}
