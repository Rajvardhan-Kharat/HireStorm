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

    return () => {
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
