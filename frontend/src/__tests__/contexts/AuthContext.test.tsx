import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function Probe() {
  const { user, loading, signup, signin, logout } = useAuth();

  if (loading) return <div>loading</div>;

  return (
    <div>
      <div data-testid="user">{user ? user.email : 'anonymous'}</div>
      <button onClick={() => signin('alice@example.com', 'correct-horse')}>signin</button>
      <button onClick={() => signup('alice@example.com', 'correct-horse')}>signup</button>
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

  it('signs in and stores the returned user, sending the password', async () => {
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

    await userEvent.click(screen.getByText('signin'));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('alice@example.com'));

    const signinCall = (global.fetch as jest.Mock).mock.calls[1];
    expect(signinCall[0]).toBe('/api/auth/signin');
    const body = JSON.parse(signinCall[1].body);
    expect(body).toEqual({ email: 'alice@example.com', password: 'correct-horse' });
  });

  it('signs up and stores the returned user', async () => {
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

    await userEvent.click(screen.getByText('signup'));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('alice@example.com'));

    const signupCall = (global.fetch as jest.Mock).mock.calls[1];
    expect(signupCall[0]).toBe('/api/auth/signup');
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
