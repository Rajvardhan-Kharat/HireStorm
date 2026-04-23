import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from '../api/axios';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,

      setAuth: (user, accessToken) => set({ user, accessToken }),
      clearAuth: () => set({ user: null, accessToken: null }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await axios.post('/auth/login', { email, password });
          set({ user: data.user, accessToken: data.accessToken, isLoading: false });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, message: err.response?.data?.message || 'Login failed' };
        }
      },

      register: async (payload) => {
        set({ isLoading: true });
        try {
          await axios.post('/auth/register', payload);
          set({ isLoading: false });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, message: err.response?.data?.message || 'Registration failed' };
        }
      },

      logout: async () => {
        try { await axios.post('/auth/logout'); } catch {}
        set({ user: null, accessToken: null });
      },

      refreshToken: async () => {
        try {
          const { data } = await axios.post('/auth/refresh-token');
          set({ accessToken: data.accessToken });
          return data.accessToken;
        } catch {
          set({ user: null, accessToken: null });
          return null;
        }
      },
    }),
    { name: 'hirestorm-auth', partialize: (state) => ({ user: state.user, accessToken: state.accessToken }) }
  )
);

export default useAuthStore;
