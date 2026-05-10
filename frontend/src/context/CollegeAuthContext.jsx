import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const CollegeAuthContext = createContext(null);

export function CollegeAuthProvider({ children }) {
  const [college, setCollege] = useState(() => {
    try { return JSON.parse(localStorage.getItem('college_data')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('college_token'));
  const [loading, setLoading] = useState(false);

  const login = useCallback((accessToken, collegeData) => {
    localStorage.setItem('college_token', accessToken);
    localStorage.setItem('college_data', JSON.stringify(collegeData));
    setToken(accessToken);
    setCollege(collegeData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post(`${API}/college/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
    } catch (_) {}
    localStorage.removeItem('college_token');
    localStorage.removeItem('college_data');
    setToken(null);
    setCollege(null);
  }, [token]);

  // Refresh token on mount if we have a college session
  const refresh = useCallback(async () => {
    try {
      const { data } = await axios.post(`${API}/college/auth/refresh`, {}, { withCredentials: true });
      setToken(data.accessToken);
      localStorage.setItem('college_token', data.accessToken);
      return data.accessToken;
    } catch {
      logout();
      return null;
    }
  }, [logout]);

  // Axios interceptor to auto-attach college token
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(config => {
      const t = localStorage.getItem('college_token');
      if (t && config.url?.includes('/college/')) {
        config.headers.Authorization = `Bearer ${t}`;
      }
      return config;
    });
    return () => axios.interceptors.request.eject(interceptor);
  }, []);

  const collegeAxios = useCallback((config) => {
    return axios({
      ...config,
      headers: { ...config.headers, Authorization: `Bearer ${token}` },
      withCredentials: true,
    });
  }, [token]);

  return (
    <CollegeAuthContext.Provider value={{ college, token, loading, login, logout, refresh, collegeAxios }}>
      {children}
    </CollegeAuthContext.Provider>
  );
}

export function useCollegeAuth() {
  return useContext(CollegeAuthContext);
}
