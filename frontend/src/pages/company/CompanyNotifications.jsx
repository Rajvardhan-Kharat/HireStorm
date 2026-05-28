import { useEffect, useState } from 'react';
import CompanyLayout from '../../layouts/CompanyLayout';
import api from '../../api/axios';
import useNotificationStore from '../../store/notificationStore';
import { Bell, CheckCheck, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CompanyNotifications() {
  const { notifications, setNotifications, markRead, markAllRead } = useNotificationStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications?limit=50')
      .then(r => { setNotifications(r.data?.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      markRead(id);
    } catch { toast.error('Could not mark as read'); }
  };

  const handleMarkAll = async () => {
    try {
      await api.patch('/notifications/read-all');
      markAllRead();
      toast.success('All notifications marked as read');
    } catch { toast.error('Failed'); }
  };

  const typeColor = (type) => {
    const map = {
      OFFER_LETTER: '#4f7ef8', APPLICATION: '#10b981', HACKATHON: '#f59e0b',
      SHORTLIST: '#8b5cf6', SYSTEM: '#6b7280', CAMPUS_DRIVE: '#06b6d4',
    };
    return map[type] || '#6b7280';
  };

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  };

  return (
    <CompanyLayout>
      <div className="page">
        <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Bell size={24} /> Notifications
            </h1>
            <p className="text-muted">Stay updated with activity on your company account</p>
          </div>
          {notifications.some(n => !n.isRead) && (
            <button className="btn btn-outline btn-sm" onClick={handleMarkAll} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
            <span className="spinner" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="card" style={{ textAlign:'center', padding:60 }}>
            <Bell size={48} style={{ color:'var(--clr-text-3)', marginBottom:16 }} />
            <h3>No notifications yet</h3>
            <p className="text-muted">You're all caught up! Activity from listings, hackathons and applications will appear here.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {notifications.map(n => (
              <div
                key={n._id}
                className="card"
                style={{
                  display:'flex', alignItems:'flex-start', gap:14,
                  borderLeft: `3px solid ${typeColor(n.type)}`,
                  background: n.isRead
                    ? 'var(--clr-surface)'
                    : 'linear-gradient(135deg, rgba(79,126,248,0.04), transparent)',
                  cursor: n.isRead ? 'default' : 'pointer',
                  transition: 'opacity 0.2s',
                  opacity: n.isRead ? 0.75 : 1,
                  padding: '14px 18px',
                }}
                onClick={() => !n.isRead && handleMarkRead(n._id)}
              >
                {/* Dot */}
                <div style={{
                  width: 8, height: 8, borderRadius:'50%', marginTop: 6, flexShrink: 0,
                  background: n.isRead ? 'var(--clr-border)' : typeColor(n.type),
                }} />

                {/* Content */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight: n.isRead ? 500 : 700, marginBottom:4 }}>{n.title}</div>
                  <div className="text-sm text-muted">{n.message}</div>
                  {n.link && (
                    <a href={n.link} className="text-xs" style={{ color:'var(--clr-primary)', marginTop:6, display:'inline-block' }}
                      onClick={e => e.stopPropagation()}>
                      View →
                    </a>
                  )}
                </div>

                {/* Time + badge */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0 }}>
                  <span className="text-xs text-muted" style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <Clock size={10} /> {timeAgo(n.createdAt)}
                  </span>
                  {!n.isRead && (
                    <span style={{
                      background: typeColor(n.type), color:'#fff',
                      borderRadius:'999px', fontSize:'0.6rem', fontWeight:700,
                      padding:'2px 8px',
                    }}>NEW</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CompanyLayout>
  );
}
