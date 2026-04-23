import { useEffect, useState } from 'react';
import CompanyLayout from '../../layouts/CompanyLayout';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { Briefcase, Users, TrendingUp, Plus, ArrowRight, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CompanyDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ listings:0, applicants:0, shortlisted:0 });
  const [listings, setListings] = useState([]);
  const [recentApps, setRecentApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/listings/my?limit=5'),
      api.get('/applications/company?limit=8'),
    ]).then(([lr, ar]) => {
      const ls = lr.data.data || [];
      const apps = ar.data.data || [];
      setListings(ls);
      setRecentApps(apps);
      setStats({
        listings:   ls.length,
        applicants: apps.length,
        shortlisted:apps.filter(a => a.status === 'SHORTLISTED').length,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <CompanyLayout>
      <div className="page">
        <div className="page-header-row">
          <div className="page-header" style={{ marginBottom:0 }}>
            <h1>Company Dashboard</h1>
            <p className="text-muted">Welcome back, {user?.profile?.firstName}</p>
          </div>
          <Link to="/company/listings/new">
            <button className="btn btn-primary"><Plus size={15}/> Post a Job</button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid-3" style={{ marginBottom:24 }}>
          {[
            { icon:<Briefcase size={22}/>, label:'Active Listings',  value: stats.listings,   clr:'#4f7ef8', bg:'rgba(79,126,248,0.15)',   link:'/company/listings' },
            { icon:<Users size={22}/>,     label:'Total Applicants', value: stats.applicants, clr:'#a78bfa', bg:'rgba(167,139,250,0.15)', link:'/company/candidates' },
            { icon:<TrendingUp size={22}/>,label:'Shortlisted',      value: stats.shortlisted,clr:'#34d399', bg:'rgba(52,211,153,0.15)',  link:'/company/candidates' },
          ].map(({ icon, label, value, clr, bg, link }) => (
            <Link key={label} to={link} style={{ textDecoration:'none' }}>
              <div className="card stat-card card-hover card-clickable">
                <div className="stat-icon" style={{ background:bg, color:clr }}>{icon}</div>
                <div className="stat-value">{loading ? '—' : value}</div>
                <div className="stat-label">{label}</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid-2">
          {/* Your Listings */}
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <h3 style={{ fontWeight:700 }}>Your Listings</h3>
              <Link to="/company/listings" className="text-sm">View all →</Link>
            </div>
            {loading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[1,2,3].map(i=><div key={i} className="skeleton skeleton-text"/>)}
              </div>
            ) : listings.length === 0 ? (
              <div className="empty-state" style={{ padding:'var(--sp-8)' }}>
                <Briefcase size={32} style={{ color:'var(--clr-text-3)' }}/>
                <p>No listings yet. Post your first job!</p>
                <Link to="/company/listings/new"><button className="btn btn-primary btn-sm">Post Job</button></Link>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {listings.map(l => (
                  <div key={l._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--clr-border)' }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{l.title}</div>
                      <div className="text-xs text-dimmed">{l.applicationsCount || 0} applicants · {l.type}</div>
                    </div>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <span className={`badge ${l.isActive ? 'badge-green' : 'badge-gray'}`}>{l.isActive ? 'Active' : 'Paused'}</span>
                      <Link to={`/company/listings/${l._id}/applicants`}>
                        <button className="btn btn-ghost btn-icon btn-xs"><Eye size={13}/></button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Applicants */}
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <h3 style={{ fontWeight:700 }}>Recent Applicants</h3>
              <Link to="/company/candidates" className="text-sm">View all →</Link>
            </div>
            {loading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[1,2,3].map(i=><div key={i} className="skeleton skeleton-text"/>)}
              </div>
            ) : recentApps.length === 0 ? (
              <div className="empty-state" style={{ padding:'var(--sp-8)' }}>
                <Users size={32} style={{ color:'var(--clr-text-3)' }}/>
                <p>No applications yet</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {recentApps.map(app => (
                  <div key={app._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--clr-border)' }}>
                    <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                      <div className="avatar avatar-sm">{app.applicant?.profile?.firstName?.[0]}</div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:'0.875rem' }}>
                          {app.applicant?.profile?.firstName} {app.applicant?.profile?.lastName}
                        </div>
                        <div className="text-xs text-dimmed">{app.listing?.title}</div>
                      </div>
                    </div>
                    <span className={`badge ${app.status==='SHORTLISTED'?'badge-green':app.status==='REJECTED'?'badge-red':'badge-blue'}`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </CompanyLayout>
  );
}
