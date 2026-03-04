import React, { useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
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
      await authAPI.logout();
    } catch (error) {
      // Silent fail on logout
    } finally {
      setUser(null);
      setLoading(false);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(mapUserToCurrentUser(userData));
    } catch (error: any) {
      setUser(null);
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
