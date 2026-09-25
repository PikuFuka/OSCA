import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './AuthContext';
import { authAPI } from '../services/api';

vi.mock('../services/api', () => ({
  authAPI: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

const rawUser = {
  osca_id: 'OSCA-1',
  name: 'Admin User',
  role: 'admin',
  barangay_assignment: 'Anos',
  email: 'admin@osca.ph',
  force_password_change: false,
};

const Harness = () => {
  const { user, loading, login, logout } = useAuth();
  if (loading) return <span>loading</span>;
  return (
    <div>
      <span>{user ? `user:${user.name}` : 'no-user'}</span>
      <button type="button" onClick={() => login('admin', 'secret')}>
        sign-in
      </button>
      <button type="button" onClick={() => logout()}>
        sign-out
      </button>
    </div>
  );
};

const renderHarness = () =>
  render(
    <AuthProvider>
      <Harness />
    </AuthProvider>
  );

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('sets user after mount when getCurrentUser resolves', async () => {
    vi.mocked(authAPI.getCurrentUser).mockResolvedValue(rawUser);

    renderHarness();

    await waitFor(() => {
      expect(screen.getByText('user:Admin User')).toBeInTheDocument();
    });
  });

  it('login success sets user', async () => {
    vi.mocked(authAPI.getCurrentUser).mockRejectedValue(new Error('unauth'));
    vi.mocked(authAPI.login).mockResolvedValue({ token: 'tok123', user: rawUser });

    renderHarness();
    await waitFor(() => {
      expect(screen.getByText('no-user')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('sign-in'));

    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith('admin', 'secret');
    });
    await waitFor(() => {
      expect(screen.getByText('user:Admin User')).toBeInTheDocument();
    });
  });

  it('logout clears user', async () => {
    vi.mocked(authAPI.getCurrentUser).mockResolvedValue(rawUser);
    vi.mocked(authAPI.logout).mockResolvedValue(undefined);

    renderHarness();
    await waitFor(() => {
      expect(screen.getByText('user:Admin User')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('sign-out'));

    await waitFor(() => {
      expect(authAPI.logout).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText('no-user')).toBeInTheDocument();
    });
  });

  it('clears user on auth-unauthorized event (401 path)', async () => {
    vi.mocked(authAPI.getCurrentUser).mockResolvedValue(rawUser);

    renderHarness();
    await waitFor(() => {
      expect(screen.getByText('user:Admin User')).toBeInTheDocument();
    });

    window.dispatchEvent(new Event('auth-unauthorized'));

    await waitFor(() => {
      expect(screen.getByText('no-user')).toBeInTheDocument();
    });
  });
});
