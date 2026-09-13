import { render, screen } from '@testing-library/react';
import { NDAPreview } from '@/components/NDAPreview';
import { defaultFields, MutualNdaFields } from '@/types/nda';

describe('NDAPreview', () => {
  it('renders the document title and cover page section', () => {
    render(<NDAPreview fields={defaultFields} />);

    expect(screen.getByText('Mutual Non-Disclosure Agreement')).toBeInTheDocument();
    expect(screen.getByText('Cover Page')).toBeInTheDocument();
    expect(screen.getByText('Purpose')).toBeInTheDocument();
    expect(screen.getByText('Party 1')).toBeInTheDocument();
    expect(screen.getByText('Party 2')).toBeInTheDocument();
  });

  it('shows placeholders for empty fields', () => {
    render(<NDAPreview fields={defaultFields} />);

    expect(screen.getAllByText('Not yet provided').length).toBeGreaterThan(0);
  });

  it('displays provided field values', () => {
    const fields: MutualNdaFields = {
      ...defaultFields,
      purpose: 'Testing the product integration',
      party1: { ...defaultFields.party1, name: 'Alice' },
    };

    render(<NDAPreview fields={fields} />);

    expect(screen.getByText('Testing the product integration')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
