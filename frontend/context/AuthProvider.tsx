import React, { useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { getAuthToken } from '../core/api/client';
import { CurrentUser, UserRole } from '../types';
import { AuthContext } from './AuthContext';

const mapUserToCurrentUser = (user: any): CurrentUser => {
  return {
    id: (user.osca_id || user.id).toString(),
    name: user.name,
    role: user.role as UserRole,
    barangay: user.barangay_assignment || user.barangay || '',
    email: user.email || `${user.osca_id || user.id}@osca.ph`,
    idPhoto: user.idPhoto || null,
    forcePasswordChange: user.force_password_change || false
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authAPI.logout();
    } catch (error) {
      // Silent fail on logout
    } finally {
      setUser(null);
      setLoading(false);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    // Without a stored token /api/me is guaranteed to answer 401; skip the
    // request entirely so first visits do not log a spurious console error.
    if (!getAuthToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(mapUserToCurrentUser(userData));
    } catch (error: any) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (identifier: string, pass: string, rememberMe = false) => {
    // Keep the login screen mounted while the request is in flight so its
    // own button/error states can animate. Only the initial session check
    // and logout should show the global loading screen.
    const response = await authAPI.login(identifier, pass, rememberMe);
    if (response.user) {
      setUser(mapUserToCurrentUser(response.user));
    }
  };

  // Check auth on mount
  useEffect(() => {
    checkAuth();
    
    // Global listener for 401 Unauthorized errors
    const handleUnauthorized = () => {
      setUser(null);
    };
    
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, [checkAuth]);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        isAuthenticated: !!user, 
        login, 
        logout, 
        checkAuth 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
