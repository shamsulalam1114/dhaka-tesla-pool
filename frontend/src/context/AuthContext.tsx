'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'PASSENGER' | 'DRIVER';
  phone: string;
  walletBalance: number;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (token: string, role: string) => void;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');
    
    if (storedToken && storedRole) {
      setToken(storedToken);
      fetchUser(storedRole);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (role: string) => {
    try {
      const endpoint = role === 'DRIVER' ? '/drivers/me' : '/users/me';
      const response = await api.get(endpoint);
      setUser(role === 'DRIVER' ? response.data.user : response.data);
    } catch (error) {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = (newToken: string, role: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', role);
    setToken(newToken);
    fetchUser(role);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
