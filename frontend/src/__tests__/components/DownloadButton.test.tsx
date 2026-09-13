import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DownloadButton } from '@/components/DownloadButton';
import { defaultFields } from '@/types/nda';

jest.mock('@react-pdf/renderer', () => ({
  pdf: jest.fn(() => ({ toBlob: jest.fn().mockResolvedValue(new Blob(['pdf'])) })),
  Document: ({ children }: { children: React.ReactNode }) => children,
  Page: ({ children }: { children: React.ReactNode }) => children,
  Text: ({ children }: { children: React.ReactNode }) => children,
  View: ({ children }: { children: React.ReactNode }) => children,
  StyleSheet: { create: (styles: unknown) => styles },
}));

describe('DownloadButton', () => {
  it('generates and downloads a PDF when clicked', async () => {
    render(<DownloadButton fields={defaultFields} />);

    await userEvent.click(screen.getByRole('button', { name: /download pdf/i }));

    await waitFor(() => expect(global.URL.createObjectURL).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument();
  });
});
