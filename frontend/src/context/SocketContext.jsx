import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, accessToken } = useAuthStore();
  const addNotification = useNotificationStore(s => s.addNotification);
  const hackathonSocketRef = useRef(null);
  const ilmSocketRef = useRef(null);

  useEffect(() => {
    if (!user || !accessToken) return;

    const BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const opts = { auth: { token: accessToken }, transports: ['websocket'] };

    hackathonSocketRef.current = io(`${BASE}/hackathon`, opts);
    ilmSocketRef.current = io(`${BASE}/ilm`, opts);

    // Hackathon events
    hackathonSocketRef.current.on('hackathon:stage-changed', ({ newStage }) => {
      toast(`🎯 Hackathon stage updated: ${newStage}`);
    });
    hackathonSocketRef.current.on('hackathon:shortlist-released', () => {
      toast.success('🎉 Shortlist has been released!');
    });
    hackathonSocketRef.current.on('notification:new', (notif) => {
      addNotification(notif);
      toast(notif.title, { icon: '🔔' });
    });

    // ILM events
    ilmSocketRef.current.on('ilm:exam-unlocked', () => toast.success('🎓 Final exam is now unlocked!'));
    ilmSocketRef.current.on('ilm:certificate-ready', () => toast.success('🏆 Your certificate is ready!'));
    ilmSocketRef.current.on('notification:new', (notif) => {
      addNotification(notif);
      toast(notif.title, { icon: '🔔' });
    });

    // --- HTTP Polling Fallback ---
    let pollInterval;
    const startPolling = () => {
      if (pollInterval) return;
      console.warn('[Socket Fallback] Sockets disconnected. Starting HTTP polling fallback...');
      pollInterval = setInterval(async () => {
        try {
          // Dynamic import of axios to avoid circular dependencies in context
          const { default: api } = await import('../api/axios');
          const res = await api.get('/notifications');
          if (res.data?.success && res.data.data?.length > 0) {
            // Get current notifications to avoid duplicates (assuming zustand store handles it or we check IDs)
            const newNotifs = res.data.data.filter(n => !n.isRead);
            newNotifs.forEach(n => addNotification(n));
          }
        } catch (e) {
          console.error('[Socket Fallback] Polling failed', e.message);
        }
      }, 15000);
    };

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
        console.log('[Socket Fallback] Sockets reconnected. Stopping HTTP polling.');
      }
    };

    hackathonSocketRef.current.on('disconnect', startPolling);
    hackathonSocketRef.current.on('connect_error', startPolling);
    hackathonSocketRef.current.on('connect', stopPolling);

    return () => {
      stopPolling();
      setTimeout(() => {
        if (hackathonSocketRef.current) hackathonSocketRef.current.disconnect();
        if (ilmSocketRef.current) ilmSocketRef.current.disconnect();
      }, 100);
    };
  }, [user, accessToken]);

  return (
    <SocketContext.Provider value={{ hackathonSocket: hackathonSocketRef, ilmSocket: ilmSocketRef }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
