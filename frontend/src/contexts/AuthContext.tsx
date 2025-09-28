import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';

interface User {
  staff_id: number;
  name: string;
  employee_code: string;
  is_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (employeeCode: string, password: string, macAddress?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      apiService.setToken(storedToken);
    }
    
    setLoading(false);
  }, []);

  const login = async (employeeCode: string, password: string, macAddress?: string) => {
    try {
      const response = await apiService.login(employeeCode, password, macAddress);
      
      setToken(response.access_token);
      setUser({
        staff_id: response.staff_id,
        name: response.name,
        employee_code: response.employee_code,
        is_admin: response.employee_code === 'ADMIN' // Simple admin check
      });
      
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify({
        staff_id: response.staff_id,
        name: response.name,
        employee_code: response.employee_code,
        is_admin: response.employee_code === 'ADMIN'
      }));
      
      apiService.setToken(response.access_token);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    apiService.setToken(null);
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};