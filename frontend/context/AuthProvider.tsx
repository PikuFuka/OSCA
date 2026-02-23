import React, { useState, useEffect, useCallback } from 'react';
import { authAPI, getToken, removeToken } from '../services/api';
import { CurrentUser, UserRole } from '../types';
import { AuthContext } from './AuthContext';

const mapUserToCurrentUser = (user: any): CurrentUser => {
  return {
    id: (user.osca_id || user.id).toString(),
    name: user.name,
    role: user.role as UserRole,
    barangay: user.barangay_assignment || user.barangay || '',
    email: user.email || `${user.osca_id || user.id}@osca.ph`,
    idPhoto: user.idPhoto || null
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      if (getToken()) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      removeToken();
      setLoading(false);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const userData = await authAPI.getCurrentUser();
      setUser(mapUserToCurrentUser(userData));
    } catch (error: any) {
      console.error('Auth verification failed:', error);
      if (error.status === 401) {
        removeToken();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (identifier: string, pass: string) => {
    setLoading(true);
    try {
      const response = await authAPI.login(identifier, pass);
      if (response.user) {
        setUser(mapUserToCurrentUser(response.user));
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Check auth on mount
  useEffect(() => {
    checkAuth();
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
