import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInterface } from '@/components/ChatInterface';
import { defaultFields } from '@/types/nda';
import * as chatApi from '@/services/chatApi';

jest.mock('@/services/chatApi');

const mockedChatApi = chatApi as jest.Mocked<typeof chatApi>;

describe('ChatInterface', () => {
  beforeEach(() => {
    mockedChatApi.fetchGreeting.mockResolvedValue({
      reply: 'Hi! Who are the two parties?',
      fields: defaultFields,
    });
  });

  it('shows the greeting on load', async () => {
    render(<ChatInterface onFieldsUpdated={jest.fn()} />);

    await waitFor(() => screen.getByText('Hi! Who are the two parties?'));
  });

  it('sends a message and displays the reply, updating fields', async () => {
    const onFieldsUpdated = jest.fn();
    mockedChatApi.sendChatMessage.mockResolvedValue({
      reply: 'Got it, what is the effective date?',
      fields: { ...defaultFields, party1: { ...defaultFields.party1, name: 'Alice' } },
    });

    render(<ChatInterface onFieldsUpdated={onFieldsUpdated} />);
    await waitFor(() => screen.getByText('Hi! Who are the two parties?'));

    const input = screen.getByPlaceholderText('Type your message...');
    await userEvent.type(input, "I'm Alice");
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => screen.getByText('Got it, what is the effective date?'));
    expect(screen.getByText("I'm Alice")).toBeInTheDocument();
    expect(onFieldsUpdated).toHaveBeenLastCalledWith(
      expect.objectContaining({ party1: expect.objectContaining({ name: 'Alice' }) })
    );
  });

  it('shows an error message if the conversation fails to start', async () => {
    mockedChatApi.fetchGreeting.mockRejectedValue(new Error('network error'));

    render(<ChatInterface onFieldsUpdated={jest.fn()} />);

    await waitFor(() => screen.getByRole('alert'));
  });
});
