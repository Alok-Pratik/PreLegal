import { render, screen } from '@testing-library/react';
import { DocumentPreview } from '@/components/DocumentPreview';
import { DocumentField } from '@/types/chat';

describe('DocumentPreview', () => {
  it('shows a placeholder message before a document type is known', () => {
    render(<DocumentPreview documentType="" fields={[]} />);

    expect(screen.getByText(/once you tell the assistant/i)).toBeInTheDocument();
  });

  it('renders the document title and grouped/ungrouped fields', () => {
    const fields: DocumentField[] = [
      { key: 'purpose', label: 'Purpose', value: 'Evaluating a partnership', group: '' },
      { key: 'party1_name', label: 'Name', value: 'Alice', group: 'Party 1' },
      { key: 'party2_name', label: 'Name', value: '', group: 'Party 2' },
    ];

    render(<DocumentPreview documentType="Mutual Non-Disclosure Agreement" fields={fields} />);

    expect(screen.getByText('Mutual Non-Disclosure Agreement')).toBeInTheDocument();
    expect(screen.getByText('Purpose')).toBeInTheDocument();
    expect(screen.getByText('Evaluating a partnership')).toBeInTheDocument();
    expect(screen.getByText('Party 1')).toBeInTheDocument();
    expect(screen.getByText('Party 2')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Not yet provided')).toBeInTheDocument();
  });
});
