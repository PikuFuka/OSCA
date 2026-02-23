import { createContext, useContext } from 'react';
import { CurrentUser } from '../types';

export interface AuthContextType {
  user: CurrentUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
