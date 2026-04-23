import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Building, Code2, Star, CreditCard, LogOut, Shield, BookOpen, Sun, Moon } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';

const navItems = [
  { to: '/admin/dashboard',    icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
  { to: '/admin/users',        icon: <Users size={16} />,           label: 'Users' },
  { to: '/admin/companies',    icon: <Building size={16} />,        label: 'Companies' },
  { to: '/admin/hackathons',   icon: <Code2 size={16} />,           label: 'Hackathons' },
  { to: '/admin/ilm',          icon: <Star size={16} />,            label: 'Internships' },
  { to: '/admin/courses',      icon: <BookOpen size={16} />,        label: 'Course CMS' },
  { to: '/admin/transactions', icon: <CreditCard size={16} />,      label: 'Transactions' },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };
  const initials = [user?.profile?.firstName?.[0], user?.profile?.lastName?.[0]].filter(Boolean).join('') || 'A';

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="sidebar-brand-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}>⚡</div>
            <div>
              <div className="sidebar-brand-name">HireStorm</div>
              <div className="sidebar-brand-sub">Admin Portal</div>
            </div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={toggleTheme} style={{ padding: 6 }}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label" style={{ display:'flex', alignItems:'center', gap: 5 }}>
            <Shield size={10}/> Administration
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
            <div className="sidebar-avatar" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', borderColor: '#f87171' }}>
              {initials}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div className="sidebar-user-name truncate">{user?.profile?.firstName} {user?.profile?.lastName}</div>
              <div className="sidebar-user-role" style={{ color: 'var(--clr-danger)' }}>{user?.role}</div>
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
