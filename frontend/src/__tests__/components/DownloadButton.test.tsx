import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DownloadButton } from '@/components/DownloadButton';
import { DocumentField } from '@/types/chat';

jest.mock('@react-pdf/renderer', () => ({
  pdf: jest.fn(() => ({ toBlob: jest.fn().mockResolvedValue(new Blob(['pdf'])) })),
  Document: ({ children }: { children: React.ReactNode }) => children,
  Page: ({ children }: { children: React.ReactNode }) => children,
  Text: ({ children }: { children: React.ReactNode }) => children,
  View: ({ children }: { children: React.ReactNode }) => children,
  StyleSheet: { create: (styles: unknown) => styles },
}));

const fields: DocumentField[] = [
  { key: 'purpose', label: 'Purpose', value: 'Evaluating a partnership', group: '' },
];

describe('DownloadButton', () => {
  it('generates and downloads a PDF named after the document type', async () => {
    render(<DownloadButton documentType="Cloud Service Agreement" fields={fields} />);

    await userEvent.click(screen.getByRole('button', { name: /download pdf/i }));

    await waitFor(() => expect(global.URL.createObjectURL).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument();
  });
});
