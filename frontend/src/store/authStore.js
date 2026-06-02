import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from '../api/axios';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,

      // Unverified-email banner state — NOT persisted (see partialize below).
      // Lives in the store so it survives React StrictMode double-mount and
      // any accidental component remounts that would wipe useState.
      loginBannerEmail: null,
      loginBannerResent: false,
      setLoginBanner: (email) => set({ loginBannerEmail: email, loginBannerResent: false }),
      clearLoginBanner: () => set({ loginBannerEmail: null, loginBannerResent: false }),
      setLoginBannerResent: () => set({ loginBannerResent: true }),

      setAuth: (user, accessToken) => set({ user, accessToken }),
      clearAuth: () => set({ user: null, accessToken: null }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await axios.post('/auth/login', { email, password });
          set({ user: data.user, accessToken: data.accessToken, isLoading: false, loginBannerEmail: null });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          const message = err.response?.data?.message || 'Login failed';
          const emailUnverified = err.response?.status === 401 &&
            message.toLowerCase().includes('verify your email');
          if (emailUnverified) {
            // Store in Zustand — survives any component remount
            set({ loginBannerEmail: email, loginBannerResent: false });
          }
          return { success: false, message, emailUnverified };
        }
      },

      resendVerification: async (email) => {
        try {
          const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out. The server may be waking up — try again in a moment.')), 12000)
          );
          const request = axios.post('/auth/resend-verification', { email });
          const { data } = await Promise.race([request, timeout]);
          set({ loginBannerResent: true });
          return { success: true, message: data.message };
        } catch (err) {
          return { success: false, message: err.response?.data?.message || err.message || 'Failed to resend email' };
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
    {
      name: 'hirestorm-auth',
      // Only persist auth tokens — never persist banner state
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    }
  )
);

export default useAuthStore;
