import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, FileText, Code2,
  BookOpen, Bell, Settings, LogOut, Star, User,
  ChevronRight, BadgeCheck, Sun, Moon
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import useThemeStore from '../store/themeStore';

const navItems = [
  { to: '/dashboard',       icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
  { to: '/listings',        icon: <Briefcase size={16} />,       label: 'Browse Jobs' },
  { to: '/my-applications', icon: <FileText size={16} />,        label: 'My Applications' },
  { to: '/hackathons',      icon: <Code2 size={16} />,           label: 'Hackathons' },
  { to: '/courses',         icon: <BookOpen size={16} />,        label: 'Courses' },
];

const ilmItems = [
  { to: '/ilm',             icon: <Star size={16} />,        label: 'ILM Overview' },
  { to: '/ilm/daily-log',   icon: <FileText size={16} />,    label: 'Daily Log' },
  { to: '/ilm/wbs',         icon: <LayoutDashboard size={16}/>, label: 'Work Plan' },
  { to: '/ilm/certificate', icon: <Star size={16} />,        label: 'Certificate' },
];

const accountItems = [
  { to: '/profile',                icon: <User size={16} />,     label: 'My Profile' },
  { to: '/notifications',          icon: <Bell size={16} />,     label: 'Notifications' },
  { to: '/settings/subscription',  icon: <Settings size={16} />, label: 'Upgrade Plan' },
];

export default function StudentLayout({ children }) {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const isIntern = user?.role === 'INTERN';

  const initials = [user?.profile?.firstName?.[0], user?.profile?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
  const roleName = user?.role?.replace(/_/g, ' ') || 'Student';

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div className="layout">
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="sidebar-brand-icon">⚡</div>
            <div>
              <div className="sidebar-brand-name">HireStorm</div>
              <div className="sidebar-brand-sub">Student Portal</div>
            </div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={toggleTheme} style={{ padding: 6 }}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Main Nav */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">Menu</div>
          <ul className="sidebar-nav">
            {navItems.map(({ to, icon, label }) => (
              <li key={to}>
                <NavLink to={to} end={to === '/dashboard'} className={({ isActive }) => isActive ? 'active' : ''}>
                  {icon}
                  <span style={{ flex:1 }}>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* ILM Nav (always visible so students know where to go) */}
        <div className="sidebar-section">
          <div className="sidebar-section-label" style={{ color: 'var(--clr-success)' }}>🎓 Internship</div>
          <ul className="sidebar-nav">
            {ilmItems.map(({ to, icon, label }) => (
              <li key={to}>
                <NavLink to={to} className={({ isActive }) => isActive ? 'active' : ''}>
                  {icon}<span style={{ flex:1 }}>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Account Nav */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">Account</div>
          <ul className="sidebar-nav">
            {accountItems.map(({ to, icon, label }) => (
              <li key={to}>
                <NavLink to={to} className={({ isActive }) => isActive ? 'active' : ''}>
                  {icon}
                  <span style={{ flex:1 }}>{label}</span>
                  {to === '/notifications' && unreadCount > 0 && (
                    <span className="badge badge-blue" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>{unreadCount}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* User Footer */}
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-user-name truncate" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {user?.profile?.firstName} {user?.profile?.lastName}
                {user?.role === 'PRO_STUDENT' && <BadgeCheck size={14} fill="var(--clr-primary)" color="#fff" title="Pro Student" />}
              </div>
              <div className="sidebar-user-role">{roleName}</div>
            </div>
          </div>
          <button className="btn btn-ghost w-full btn-sm" style={{ justifyContent:'flex-start', gap:8 }} onClick={handleLogout}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="main-content">{children}</div>
    </div>
  );
}
