import { postJson } from '@/services/apiClient';

describe('apiClient error extraction', () => {
  it('surfaces a readable message from a FastAPI-style array of validation errors', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        detail: [
          { loc: ['body', 'password'], msg: 'String should have at least 8 characters', type: 'string_too_short' },
        ],
      }),
    });

    await expect(postJson('/api/auth/signup', {}, 'Sign up failed')).rejects.toThrow(
      'String should have at least 8 characters'
    );
  });

  it('surfaces a plain string detail as-is', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ detail: 'Invalid email or password' }),
    });

    await expect(postJson('/api/auth/signin', {}, 'Sign in failed')).rejects.toThrow('Invalid email or password');
  });

  it('falls back to the provided message when the body has no usable detail', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });

    await expect(postJson('/api/auth/signin', {}, 'Sign in failed')).rejects.toThrow('Sign in failed');
  });
});
