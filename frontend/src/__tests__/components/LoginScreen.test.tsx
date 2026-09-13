import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginScreen } from '@/components/LoginScreen';
import { AuthProvider } from '@/contexts/AuthContext';

describe('LoginScreen', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
  });

  it('renders email and password fields for sign in by default', async () => {
    render(
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    );

    await waitFor(() => screen.getByPlaceholderText('you@example.com'));
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
  });

  it('submits email and password and calls the sign-in endpoint', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false }) // initial /me
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 1, email: 'alice@example.com' }, message: 'ok' }),
      });

    render(
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    );

    const emailInput = await screen.findByPlaceholderText('you@example.com');
    await userEvent.type(emailInput, 'alice@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'correct-horse');
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/signin', expect.objectContaining({ method: 'POST' }))
    );
    const call = (global.fetch as jest.Mock).mock.calls[1];
    expect(JSON.parse(call[1].body)).toEqual({ email: 'alice@example.com', password: 'correct-horse' });
  });

  it('switches to sign-up mode and requires matching passwords', async () => {
    render(
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    );

    await userEvent.click(await screen.findByText(/don't have an account/i));

    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'bob@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'correct-horse');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'different-password');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/do not match/i);
  });

  it('submits a matching sign-up to the sign-up endpoint', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false }) // initial /me
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 2, email: 'bob@example.com' }, message: 'ok' }),
      });

    render(
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    );

    await userEvent.click(await screen.findByText(/don't have an account/i));
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'bob@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'correct-horse');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'correct-horse');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/signup', expect.objectContaining({ method: 'POST' }))
    );
  });
});
