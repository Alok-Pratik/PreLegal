import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function Probe() {
  const { user, loading, login, logout } = useAuth();

  if (loading) return <div>loading</div>;

  return (
    <div>
      <div data-testid="user">{user ? user.email : 'anonymous'}</div>
      <button onClick={() => login('alice@example.com')}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('starts as anonymous when /api/auth/me is unauthenticated', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('anonymous'));
  });

  it('logs in and stores the returned user, with no password sent', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false }) // initial /me
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 1, email: 'alice@example.com' }, message: 'ok' }),
      });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('anonymous'));

    await userEvent.click(screen.getByText('login'));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('alice@example.com'));

    const loginCall = (global.fetch as jest.Mock).mock.calls[1];
    expect(loginCall[0]).toBe('/api/auth/login');
    const body = JSON.parse(loginCall[1].body);
    expect(body).toEqual({ email: 'alice@example.com' });
  });

  it('clears the user on logout', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, email: 'alice@example.com' }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('alice@example.com'));

    await userEvent.click(screen.getByText('logout'));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('anonymous'));
  });
});
