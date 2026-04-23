import { useEffect, useState } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import api from '../../api/axios';
import { Briefcase, Clock, Building2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const STATUS_META = {
  APPLIED:     { label:'Applied',     color:'badge-blue',   col:'rgba(79,126,248,0.07)' },
  SHORTLISTED: { label:'Shortlisted', color:'badge-green',  col:'rgba(52,211,153,0.07)' },
  INTERVIEW:   { label:'Interview',   color:'badge-purple', col:'rgba(167,139,250,0.07)' },
  OFFER:       { label:'Offer',       color:'badge-yellow', col:'rgba(251,191,36,0.07)'  },
  REJECTED:    { label:'Rejected',    color:'badge-red',    col:'rgba(248,113,113,0.07)' },
};
const STATUS_ORDER = ['APPLIED','SHORTLISTED','INTERVIEW','OFFER','REJECTED'];

export default function MyApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL');

  useEffect(() => {
    api.get('/applications/my')
      .then(r => { setApps(r.data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const tabs = ['ALL', ...STATUS_ORDER];
  const filtered = tab === 'ALL' ? apps : apps.filter(a => a.status === tab);

  return (
    <StudentLayout>
      <div className="page">
        <div className="page-header-row">
          <div className="page-header" style={{ marginBottom:0 }}>
            <h1>My Applications</h1>
            <p className="text-muted">Track your job & internship applications</p>
          </div>
          <Link to="/listings">
            <button className="btn btn-primary"><Briefcase size={15}/> Browse More</button>
          </Link>
        </div>

        {/* Status Pipeline (desktop) */}
        <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:4, marginBottom:24, marginTop:8 }}>
          {STATUS_ORDER.map(s => {
            const meta = STATUS_META[s];
            const count = apps.filter(a => a.status === s).length;
            return (
              <div key={s} style={{
                flex:'0 0 auto', minWidth:120,
                padding:'12px 16px',
                background: count > 0 ? meta.col : 'var(--clr-surface)',
                border:'1px solid var(--clr-border)',
                borderRadius:'var(--r-sm)',
                textAlign:'center'
              }}>
                <div style={{ fontSize:'1.6rem', fontWeight:900, letterSpacing:'-0.04em', color: count > 0 ? 'var(--clr-text)' : 'var(--clr-text-3)' }}>{count}</div>
                <div className="text-xs text-dimmed" style={{ marginTop:3 }}>{meta.label}</div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="tabs">
          {tabs.map(t => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t === 'ALL' ? `All (${apps.length})` : `${STATUS_META[t].label} (${apps.filter(a=>a.status===t).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[1,2,3].map(i => (
              <div key={i} className="card" style={{ display:'flex', gap:16, alignItems:'center' }}>
                <div className="skeleton skeleton-avatar"/>
                <div style={{ flex:1 }}>
                  <div className="skeleton skeleton-text w-3/4"/>
                  <div className="skeleton skeleton-text w-1/2"/>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Briefcase size={28} style={{ color:'var(--clr-text-3)' }}/></div>
            <h3>No applications yet</h3>
            <p>Start applying for internships and jobs to see them here</p>
            <Link to="/listings"><button className="btn btn-primary">Browse Listings</button></Link>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filtered.map(app => {
              const meta = STATUS_META[app.status] || STATUS_META.APPLIED;
              return (
                <div key={app._id} className="card card-clickable" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 20px', flexWrap:'wrap', gap:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <div className="avatar avatar-sm" style={{ borderRadius:'var(--r-xs)', background:'var(--clr-primary-dim)', color:'var(--clr-primary)' }}>
                      {app.listing?.company?.name?.[0] || <Building2 size={14}/>}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:'0.92rem', marginBottom:2 }}>{app.listing?.title || 'Position'}</div>
                      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }} className="text-xs text-dimmed">
                        {app.listing?.company?.name && <span style={{ display:'flex', alignItems:'center', gap:4 }}><Building2 size={11}/>{app.listing.company.name}</span>}
                        <span style={{ display:'flex', alignItems:'center', gap:4 }}><Clock size={11}/>{new Date(app.appliedAt || app.createdAt).toLocaleDateString('en-IN',{ day:'numeric',month:'short',year:'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span className={`badge ${meta.color}`}>{meta.label}</span>
                    {app.listing?._id && (
                      <Link to={`/listings/${app.listing._id}`}>
                        <ChevronRight size={16} style={{ color:'var(--clr-text-3)' }}/>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
