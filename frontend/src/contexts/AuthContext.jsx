import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
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

  const login = async (employeeCode, password, macAddress) => {
    try {
      const response = await apiService.login(employeeCode, password, macAddress);
      
      setToken(response.access_token);
      setUser({
        staff_id: response.staff_id,
        name: response.name,
        employee_code: response.employee_code,
        is_admin: response.is_admin
      });
      
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify({
        staff_id: response.staff_id,
        name: response.name,
        employee_code: response.employee_code,
        is_admin: response.is_admin
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