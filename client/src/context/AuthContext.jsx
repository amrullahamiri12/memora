import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getToken, setToken, removeToken } from '../utils/api';
import { isStaff } from '../utils/roles';
import { disableStudentView } from '../utils/studentView';

const AuthContext = createContext(null);

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
      if (data.user && isStaff(data.user.role)) {
        disableStudentView();
      }
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
    setToken(data.token);
    if (isStaff(data.user?.role)) {
      disableStudentView();
    }
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password, subjectIds = []) => {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, subjectIds }),
    });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
