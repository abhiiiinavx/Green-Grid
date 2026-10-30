import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { apiRequest } from '../lib/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsDemo: () => Promise<void>;
  loginAsAdmin: () => Promise<void>;
  register: (name: string, email: string, password: string, location?: string, userType?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('greengrid_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('greengrid_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const activeToken = localStorage.getItem('greengrid_token');
      if (!activeToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const data = await apiRequest<User>('/auth/me');
      setUser(data);
      localStorage.setItem('greengrid_user', JSON.stringify(data));
    } catch (err) {
      console.warn('Could not refresh session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiRequest<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem('greengrid_token', data.accessToken);
    localStorage.setItem('greengrid_refresh_token', data.refreshToken);
    localStorage.setItem('greengrid_user', JSON.stringify(data.user));
    setToken(data.accessToken);
    setUser(data.user);
  };

  const loginAsDemo = async () => {
    await login('demo@greengrid.io', 'Password123!');
  };

  const loginAsAdmin = async () => {
    await login('admin@greengrid.io', 'AdminPass123!');
  };

  const register = async (name: string, email: string, password: string, location?: string, userType?: string) => {
    const data = await apiRequest<{ user: User; accessToken: string; refreshToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, location, userType }),
    });

    localStorage.setItem('greengrid_token', data.accessToken);
    localStorage.setItem('greengrid_refresh_token', data.refreshToken);
    localStorage.setItem('greengrid_user', JSON.stringify(data.user));
    setToken(data.accessToken);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('greengrid_refresh_token');
      if (refreshToken) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('greengrid_token');
      localStorage.removeItem('greengrid_refresh_token');
      localStorage.removeItem('greengrid_user');
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (updatedUser: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updatedUser };
      localStorage.setItem('greengrid_user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        loginAsDemo,
        loginAsAdmin,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
