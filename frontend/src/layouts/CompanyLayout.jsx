import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, Code2, Settings, LogOut, Building, BookOpen, TrendingUp, Sun, Moon } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';

const navItems = [
  { to: '/company/dashboard',  icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
  { to: '/company/listings',   icon: <Briefcase size={16} />,       label: 'Listings' },
  { to: '/company/candidates', icon: <Users size={16} />,           label: 'Candidates' },
  { to: '/company/hackathons', icon: <Code2 size={16} />,           label: 'Hackathons' },
  { to: '/company/courses',    icon: <BookOpen size={16} />,        label: 'Courses' },
  { to: '/company/analytics',  icon: <TrendingUp size={16} />,      label: 'Analytics & Revenue' },
  { to: '/company/settings',   icon: <Settings size={16} />,        label: 'Settings & Billing' },
];

export default function CompanyLayout({ children }) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };
  const initials = [user?.profile?.firstName?.[0], user?.profile?.lastName?.[0]].filter(Boolean).join('') || 'C';

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="sidebar-brand-icon" style={{ background: 'linear-gradient(135deg, #a78bfa, #4f7ef8)' }}>⚡</div>
            <div>
              <div className="sidebar-brand-name">HireStorm</div>
              <div className="sidebar-brand-sub">Company Portal</div>
            </div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={toggleTheme} style={{ padding: 6 }}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label" style={{ display:'flex', alignItems:'center', gap:5 }}>
            <Building size={10}/> Company
          </div>
          <ul className="sidebar-nav">
            {navItems.map(({ to, icon, label }) => (
              <li key={to}>
                <NavLink to={to} className={({ isActive }) => isActive ? 'active' : ''}>
                  {icon}<span style={{ flex:1 }}>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="sidebar-avatar" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', borderColor: '#a78bfa' }}>
              {initials}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div className="sidebar-user-name truncate">{user?.profile?.firstName} {user?.profile?.lastName}</div>
              <div className="sidebar-user-role" style={{ color: 'var(--clr-accent)' }}>{user?.role?.replace(/_/g,' ')}</div>
            </div>
          </div>
          <button className="btn btn-ghost w-full btn-sm" style={{ justifyContent:'flex-start', gap:8 }} onClick={handleLogout}>
            <LogOut size={14}/> Sign Out
          </button>
        </div>
      </aside>
      <div className="main-content">{children}</div>
    </div>
  );
}
