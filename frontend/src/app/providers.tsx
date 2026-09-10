import React, { createContext, useContext, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthUser } from '../features/auth/types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  logout: () => void;
  updateUser: (user: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedAccess = localStorage.getItem('access_token');
    const savedRefresh = localStorage.getItem('refresh_token');
    const savedUser = localStorage.getItem('auth_user');

    if (savedAccess && savedUser) {
      try {
        setAccessToken(savedAccess);
        setRefreshToken(savedRefresh);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse cached user', e);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newAccessToken: string, newRefreshToken: string, newUser: AuthUser) => {
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setUser(newUser);
    localStorage.setItem('access_token', newAccessToken);
    localStorage.setItem('refresh_token', newRefreshToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
  };

  const updateUser = (fields: Partial<AuthUser>) => {
    if (!user) return;
    const updated = { ...user, ...fields };
    setUser(updated);
    localStorage.setItem('auth_user', JSON.stringify(updated));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider
        value={{
          user,
          accessToken,
          refreshToken,
          isAuthenticated: !!accessToken && !!user,
          isLoading,
          login,
          logout,
          updateUser,
        }}
      >
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};
