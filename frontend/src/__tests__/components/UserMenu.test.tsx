import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserMenu } from '@/components/UserMenu';
import { AuthProvider } from '@/contexts/AuthContext';

const user = { id: 1, email: 'alice@example.com' };

describe('UserMenu', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
  });

  it('shows the user email and a sign out action, with no document menu item', async () => {
    render(
      <AuthProvider>
        <UserMenu user={user} />
      </AuthProvider>
    );

    await waitFor(() => screen.getByText('alice@example.com'));
    await userEvent.click(screen.getByText('alice@example.com'));

    expect(screen.getByText('Sign Out')).toBeInTheDocument();
    expect(screen.queryByText('My Documents')).not.toBeInTheDocument();
  });

  it('logs out when Sign Out is clicked', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false }) // initial /me
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }); // logout

    render(
      <AuthProvider>
        <UserMenu user={user} />
      </AuthProvider>
    );

    await waitFor(() => screen.getByText('alice@example.com'));
    await userEvent.click(screen.getByText('alice@example.com'));
    await userEvent.click(screen.getByText('Sign Out'));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/logout',
        expect.objectContaining({ method: 'POST' })
      )
    );
  });
});
