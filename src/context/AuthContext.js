import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/apiClient';
import storage from '../utils/storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedUser = await storage.getItem('hs_current_member');
      const storedToken = await storage.getItem('hs_access_token');
      const storedRole = await storage.getItem('temp_role');

      if (storedUser && storedToken && storedRole) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        setRole(storedRole);
      }
    } catch (e) {
      console.error('Failed to load stored auth:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password, selectedRole) => {
    setIsLoading(true);
    try {
      const apiRole = (selectedRole === 'partner' || selectedRole === 'affiliate') ? 'member' : selectedRole;
      const response = await apiClient.post('/auth/login', {
        email,
        password,
        role: apiRole,
      });

      if (response.data && response.data.success) {
        const { token: accessToken, refreshToken, role: returnedRole, user: userData } = response.data;
        
        const userObj = {
          id: userData.id,
          name: userData.profile?.full_name || email.split('@')[0],
          email: userData.email,
          plan: userData.profile?.plan_badge || 'Free',
        };

        const finalRole = selectedRole ? selectedRole.toLowerCase() : (returnedRole ? returnedRole.toLowerCase() : 'member');

        await storage.setItem('hs_access_token', accessToken);
        await storage.setItem('hs_refresh_token', refreshToken);
        await storage.setItem('hs_current_member', JSON.stringify(userObj));
        await storage.setItem('temp_role', finalRole);

        setToken(accessToken);
        setRole(finalRole);
        setUser(userObj);

        return { success: true, user: userObj };
      } else if (response.data && response.data.code === 'PENDING_APPROVAL') {
        return { success: false, code: 'PENDING_APPROVAL', message: 'Your account is pending admin approval.' };
      } else {
        return { success: false, message: response.data.message || 'Login failed.' };
      }
    } catch (err) {
      console.error('Login Error:', err);
      const errMsg = err.response?.data?.message || 'Authentication error. Please check your credentials.';
      return { success: false, message: errMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (signupData) => {
    setIsLoading(true);
    try {
      const apiRole = (signupData.role === 'partner' || signupData.role === 'affiliate') ? 'member' : signupData.role;
      const response = await apiClient.post('/auth/register', {
        name: signupData.name,
        email: signupData.email,
        password: signupData.password,
        role: apiRole,
        phone: signupData.phone,
        specialty: signupData.role === 'advisor' ? signupData.specialty : undefined,
        plan: (signupData.role === 'member' || signupData.role === 'partner' || signupData.role === 'affiliate') ? (signupData.plan || 'Free Sakhi') : undefined,
      });

      if (response.data && response.data.success) {
        return { success: true };
      } else {
        return { success: false, message: response.data.message || 'Signup failed.' };
      }
    } catch (err) {
      console.error('Signup Error:', err);
      const errMsg = err.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, message: errMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await storage.removeItem('hs_access_token');
      await storage.removeItem('hs_refresh_token');
      await storage.removeItem('hs_current_member');
      await storage.removeItem('temp_role');

      setToken(null);
      setRole(null);
      setUser(null);
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const [memberProgress, setMemberProgress] = useState(null);

  const switchRole = async (newRole) => {
    try {
      await storage.setItem('temp_role', newRole);
      setRole(newRole);
    } catch (e) {
      console.error('Failed to switch role:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, token, isLoading, login, signup, logout, switchRole, memberProgress, setMemberProgress }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
