import { useEffect, useState } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Bell, Check, CheckCheck, Briefcase, Code2, Star, Info } from 'lucide-react';

const TYPE_META = {
  APPLICATION:  { icon:<Briefcase size={15}/>, color:'var(--clr-primary)' },
  HACKATHON:    { icon:<Code2 size={15}/>,     color:'var(--clr-accent)' },
  INTERNSHIP:   { icon:<Star size={15}/>,      color:'var(--clr-success)' },
  SYSTEM:       { icon:<Info size={15}/>,      color:'var(--clr-text-3)' },
};

function groupByDate(notifications) {
  const groups = {};
  notifications.forEach(n => {
    const d = new Date(n.createdAt);
    const now = new Date();
    let label;
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) label = 'Today';
    else if (diffDays === 1) label = 'Yesterday';
    else if (diffDays < 7) label = 'This Week';
    else label = 'Earlier';
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  });
  return groups;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = () => {
    api.get('/notifications?limit=50')
      .then(r => { setNotifications(r.data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(fetchNotifs, []);

  const markAll = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(n => n.map(x => ({ ...x, isRead: true })));
      toast.success('All marked as read');
    } catch {}
  };

  const markOne = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(n => n.map(x => x._id === id ? { ...x, isRead: true } : x));
    } catch {}
  };

  const unread = notifications.filter(n => !n.isRead).length;
  const grouped = groupByDate(notifications);

  return (
    <StudentLayout>
      <div className="page page-sm">
        <div className="page-header-row">
          <div className="page-header" style={{ marginBottom:0 }}>
            <h1>Notifications</h1>
            <p className="text-muted">{unread > 0 ? `${unread} unread` : 'All caught up!'}</p>
          </div>
          {unread > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={markAll}>
              <CheckCheck size={14}/> Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[1,2,3,4].map(i=>(
              <div key={i} className="card" style={{ display:'flex', gap:12 }}>
                <div className="skeleton skeleton-avatar"/>
                <div style={{ flex:1 }}><div className="skeleton skeleton-text w-3/4"/><div className="skeleton skeleton-text w-1/2"/></div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Bell size={28} style={{ color:'var(--clr-text-3)' }}/></div>
            <h3>No notifications yet</h3>
            <p>We'll notify you about applications, hackathons and more</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date} style={{ marginBottom:24 }}>
              <div style={{
                fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em',
                color:'var(--clr-text-3)', marginBottom:10, paddingLeft:4
              }}>{date}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {items.map(n => {
                  const meta = TYPE_META[n.type] || TYPE_META.SYSTEM;
                  return (
                    <div
                      key={n._id}
                      onClick={() => !n.isRead && markOne(n._id)}
                      style={{
                        display:'flex', gap:14, alignItems:'flex-start',
                        padding:'14px 16px',
                        background: n.isRead ? 'var(--clr-surface)' : 'var(--clr-primary-dim)',
                        border:`1px solid ${n.isRead ? 'var(--clr-border)' : 'rgba(79,126,248,0.2)'}`,
                        borderRadius:'var(--r-sm)',
                        cursor: n.isRead ? 'default' : 'pointer',
                        transition:'all 0.15s'
                      }}
                    >
                      <div style={{
                        width:36, height:36, borderRadius:'50%',
                        background:`${meta.color}1A`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        color: meta.color, flexShrink:0
                      }}>
                        {meta.icon}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight: n.isRead ? 500 : 700, fontSize:'0.875rem', marginBottom:3 }}>{n.message}</div>
                        <div className="text-xs text-dimmed">
                          {new Date(n.createdAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                          {' · '}{new Date(n.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                      {!n.isRead && (
                        <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--clr-primary)', flexShrink:0, marginTop:4 }}/>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </StudentLayout>
  );
}
