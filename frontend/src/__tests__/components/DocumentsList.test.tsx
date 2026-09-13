import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentsList } from '@/components/DocumentsList';
import * as documentsApi from '@/services/documentsApi';

jest.mock('@/services/documentsApi');

const mockedDocumentsApi = documentsApi as jest.Mocked<typeof documentsApi>;

describe('DocumentsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows an empty state with a create-new call to action when there are no documents', async () => {
    mockedDocumentsApi.fetchDocuments.mockResolvedValue([]);
    const onCreateNew = jest.fn();

    render(<DocumentsList onSelectDocument={jest.fn()} onCreateNew={onCreateNew} />);

    await waitFor(() => screen.getByText(/haven't created any documents/i));
    await userEvent.click(screen.getByRole('button', { name: /create your first document/i }));
    expect(onCreateNew).toHaveBeenCalled();
  });

  it('renders a card per document with its status, and selects it on click', async () => {
    mockedDocumentsApi.fetchDocuments.mockResolvedValue([
      {
        id: 7,
        document_type: 'Mutual Non-Disclosure Agreement',
        is_complete: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
      },
      {
        id: 8,
        document_type: 'Pilot Agreement',
        is_complete: false,
        created_at: '2026-01-03T00:00:00Z',
        updated_at: '2026-01-03T00:00:00Z',
      },
    ]);
    const onSelectDocument = jest.fn();

    render(<DocumentsList onSelectDocument={onSelectDocument} onCreateNew={jest.fn()} />);

    await waitFor(() => screen.getByText('Mutual Non-Disclosure Agreement'));
    expect(screen.getByText('Complete')).toBeInTheDocument();
    expect(screen.getByText('In progress')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Mutual Non-Disclosure Agreement'));
    expect(onSelectDocument).toHaveBeenCalledWith(7);
  });

  it('shows an error message if the list fails to load', async () => {
    mockedDocumentsApi.fetchDocuments.mockRejectedValue(new Error('network error'));

    render(<DocumentsList onSelectDocument={jest.fn()} onCreateNew={jest.fn()} />);

    await waitFor(() => screen.getByRole('alert'));
  });
});
