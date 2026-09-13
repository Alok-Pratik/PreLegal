import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginScreen } from '@/components/LoginScreen';
import { AuthProvider } from '@/contexts/AuthContext';

describe('LoginScreen', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
  });

  it('renders an email field and no password field', async () => {
    render(
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    );

    await waitFor(() => screen.getByPlaceholderText('you@example.com'));
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
  });

  it('submits the email and calls the login endpoint', async () => {
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

    const input = await screen.findByPlaceholderText('you@example.com');
    await userEvent.type(input, 'alice@example.com');
    await userEvent.click(screen.getByRole('button', { name: /enter platform/i }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({ method: 'POST' })
      )
    );
  });
});
