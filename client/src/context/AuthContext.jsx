import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getToken, setToken, removeToken } from '../utils/api';
import { disableStudentView } from '../utils/studentView';

const AuthContext = createContext(null);

function applyAuthResponse(data) {
  if (data.token) setToken(data.token);
  if (data.user) return data.user;
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await api('/auth/me');
      setUser(data.user);
    } catch {
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(applyAuthResponse(data));
    return data.user;
  };

  const register = async (name, email, password, subjectIds = []) => {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, subjectIds }),
    });
    setUser(applyAuthResponse(data));
    return data;
  };

  const continueAsGuest = async () => {
    const data = await api('/auth/guest', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    setUser(applyAuthResponse(data));
    return data.user;
  };

  const upgradeGuest = async (name, email, password) => {
    const data = await api('/auth/upgrade-guest', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setUser(applyAuthResponse(data));
    return data;
  };

  const verifyEmail = async (token) => {
    const data = await api('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    setUser(applyAuthResponse(data));
    return data.user;
  };

  const resendVerification = async () => {
    return api('/auth/resend-verification', { method: 'POST', body: JSON.stringify({}) });
  };

  const forgotPassword = async (email) => {
    return api('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  };

  const resetPassword = async (token, password) => {
    const data = await api('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
    setUser(applyAuthResponse(data));
    return data.user;
  };

  const loginWithGoogle = async (credential, subjectIds) => {
    const data = await api('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential, subjectIds }),
    });
    setUser(applyAuthResponse(data));
    return data;
  };

  const logout = () => {
    disableStudentView();
    removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loadUser,
        login,
        register,
        continueAsGuest,
        upgradeGuest,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
