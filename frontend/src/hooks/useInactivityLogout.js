import { useEffect } from 'react';
import useAuthStore from '../store/authStore';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export default function useInactivityLogout() {
  const logout = useAuthStore(state => state.logout);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
        window.location.href = '/login?reason=inactivity';
      }, INACTIVITY_TIMEOUT);
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    
    events.forEach(event => window.addEventListener(event, resetTimeout));
    resetTimeout(); // Initialize

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimeout));
      clearTimeout(timeoutId);
    };
  }, [isAuthenticated, logout]);
}
