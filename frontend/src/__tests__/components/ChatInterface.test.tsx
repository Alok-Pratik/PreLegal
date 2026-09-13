import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInterface } from '@/components/ChatInterface';
import * as chatApi from '@/services/chatApi';

jest.mock('@/services/chatApi');

const mockedChatApi = chatApi as jest.Mocked<typeof chatApi>;

describe('ChatInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedChatApi.fetchGreeting.mockResolvedValue({
      reply: 'Hi! What kind of document do you need?',
      document_type: '',
      fields: [],
      is_complete: false,
    });
  });

  it('shows the greeting on load', async () => {
    render(<ChatInterface onDocumentStateUpdated={jest.fn()} />);

    await waitFor(() => screen.getByText('Hi! What kind of document do you need?'));
  });

  it('sends a message and displays the reply, updating document state', async () => {
    const onDocumentStateUpdated = jest.fn();
    mockedChatApi.sendChatMessage.mockResolvedValue({
      reply: 'Got it, who is the other party?',
      document_type: 'Mutual Non-Disclosure Agreement',
      fields: [{ key: 'party1_name', label: 'Name', value: 'Alice', group: 'Party 1' }],
      is_complete: false,
    });

    render(<ChatInterface onDocumentStateUpdated={onDocumentStateUpdated} />);
    await waitFor(() => screen.getByText('Hi! What kind of document do you need?'));

    const input = screen.getByPlaceholderText('Type your message...');
    await userEvent.type(input, "I'm Alice, I need an NDA");
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => screen.getByText('Got it, who is the other party?'));
    expect(screen.getByText("I'm Alice, I need an NDA")).toBeInTheDocument();
    expect(onDocumentStateUpdated).toHaveBeenLastCalledWith({
      documentType: 'Mutual Non-Disclosure Agreement',
      fields: [{ key: 'party1_name', label: 'Name', value: 'Alice', group: 'Party 1' }],
      isComplete: false,
      documentId: null,
    });
  });

  it('resumes a saved document without calling the greeting endpoint', async () => {
    const onDocumentStateUpdated = jest.fn();
    const initialDocument = {
      id: 42,
      document_type: 'Mutual Non-Disclosure Agreement',
      is_complete: false,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      fields: [{ key: 'party1_name', label: 'Name', value: 'Alice', group: 'Party 1' }],
      messages: [
        { role: 'user' as const, content: "I'm Alice, I need an NDA" },
        { role: 'assistant' as const, content: 'Who is the other party?' },
      ],
    };

    render(
      <ChatInterface onDocumentStateUpdated={onDocumentStateUpdated} initialDocument={initialDocument} />
    );

    expect(screen.getByText('Who is the other party?')).toBeInTheDocument();
    expect(mockedChatApi.fetchGreeting).not.toHaveBeenCalled();
    expect(onDocumentStateUpdated).toHaveBeenLastCalledWith({
      documentType: 'Mutual Non-Disclosure Agreement',
      fields: initialDocument.fields,
      isComplete: false,
      documentId: 42,
    });
  });

  it('returns focus to the input after a reply arrives', async () => {
    mockedChatApi.sendChatMessage.mockResolvedValue({
      reply: 'Got it.',
      document_type: '',
      fields: [],
      is_complete: false,
    });

    render(<ChatInterface onDocumentStateUpdated={jest.fn()} />);
    const input = await screen.findByPlaceholderText('Type your message...');

    await userEvent.type(input, 'hello');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => screen.getByText('Got it.'));
    await waitFor(() => expect(input).toHaveFocus());
  });

  it('shows an error message if the conversation fails to start', async () => {
    mockedChatApi.fetchGreeting.mockRejectedValue(new Error('network error'));

    render(<ChatInterface onDocumentStateUpdated={jest.fn()} />);

    await waitFor(() => screen.getByRole('alert'));
  });
});
