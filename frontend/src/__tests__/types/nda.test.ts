import { defaultFields, isNdaComplete, MutualNdaFields } from '@/types/nda';

const completeParty = {
  name: 'Alice',
  title: 'CEO',
  company: 'Acme',
  notice_address: 'alice@acme.com',
  date: '',
};

const completeFields: MutualNdaFields = {
  purpose: 'Evaluating a business relationship',
  effective_date: 'Today',
  mnda_term: '1 year',
  confidentiality_term: '1 year',
  governing_law: 'Delaware',
  jurisdiction: 'New Castle, DE',
  party1: completeParty,
  party2: { ...completeParty, name: 'Bob', company: 'Beta Corp' },
};

describe('isNdaComplete', () => {
  it('is false for the default empty fields', () => {
    expect(isNdaComplete(defaultFields)).toBe(false);
  });

  it('is true when every required field is filled in', () => {
    expect(isNdaComplete(completeFields)).toBe(true);
  });

  it('is false when a top-level field is missing', () => {
    expect(isNdaComplete({ ...completeFields, governing_law: '' })).toBe(false);
  });

  it('is false when a party field is missing', () => {
    expect(
      isNdaComplete({ ...completeFields, party2: { ...completeFields.party2, notice_address: '' } })
    ).toBe(false);
  });

  it('does not require a signature date', () => {
    expect(isNdaComplete({ ...completeFields, party1: { ...completeFields.party1, date: '' } })).toBe(
      true
    );
  });
});
