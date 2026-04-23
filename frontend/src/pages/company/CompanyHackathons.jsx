import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CompanyLayout from '../../layouts/CompanyLayout';
import api from '../../api/axios';
import { Code2, ExternalLink, Plus, Users, Trophy, Clock, CheckCircle2 } from 'lucide-react';

const STATUS_BADGE = {
  DRAFT:              'badge-gray',
  REGISTRATION_OPEN:  'badge-green',
  ACTIVE:             'badge-blue',
  COMPLETED:          'badge-blue',
  SHORTLISTING:       'badge-yellow',
  EVALUATION:         'badge-yellow',
};

export default function CompanyHackathons() {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    api.get('/hackathons/company/mine')
      .then(r => { setHackathons(r.data.data || []); setLoading(false); })
      .catch(() => {
        // Fallback: show all hackathons if company endpoint not found
        api.get('/hackathons')
          .then(r => { setHackathons(r.data.data || []); setLoading(false); })
          .catch(() => setLoading(false));
      });
  }, []);

  const activeCount     = hackathons.filter(h => h.status === 'ACTIVE' || h.status === 'REGISTRATION_OPEN').length;
  const totalParticipants = hackathons.reduce((s, h) => s + (h.totalRegistrations || 0), 0);
  const draftCount      = hackathons.filter(h => h.status === 'DRAFT').length;

  return (
    <CompanyLayout>
      <div className="page">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>My Hackathons</h1>
            <p className="text-muted">Hackathons your company has hosted or is sponsoring.</p>
          </div>
          <Link to="/company/hackathons/new" className="btn btn-primary" style={{ gap: 8 }}>
            <Plus size={16} /> Host New Hackathon
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Hackathons', value: hackathons.length, clr: 'var(--clr-primary)', icon: <Code2 size={18} /> },
            { label: 'Live / Open', value: activeCount, clr: 'var(--clr-success)', icon: <CheckCircle2 size={18} /> },
            { label: 'Total Registrations', value: totalParticipants, clr: 'var(--clr-accent)', icon: <Users size={18} /> },
          ].map(({ label, value, clr, icon }) => (
            <div key={label} className="card stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span className="stat-label">{label}</span>
                <div style={{ color: clr }}>{icon}</div>
              </div>
              <div className="stat-value" style={{ color: clr }}>{value}</div>
            </div>
          ))}
        </div>

        {draftCount > 0 && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--r-sm)', marginBottom: 20, fontSize: '0.88rem' }}>
            <Clock size={15} style={{ color: '#f59e0b', flexShrink: 0 }} />
            <span><strong style={{ color: '#f59e0b' }}>{draftCount} hackathon{draftCount > 1 ? 's' : ''} pending admin review.</strong> You'll be notified once published.</span>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 'var(--r-sm)' }} />)}
          </div>
        ) : hackathons.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 40 }}>
            <Code2 size={52} style={{ color: 'var(--clr-text-3)', marginBottom: 18 }} />
            <h3>No Hackathons Yet</h3>
            <p className="text-muted" style={{ marginBottom: 20 }}>Host your first hackathon to discover and hire top tech talent.</p>
            <Link to="/company/hackathons/new" className="btn btn-primary">Host a Hackathon</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {hackathons.map(h => (
              <div key={h._id} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className={`badge ${STATUS_BADGE[h.status] || 'badge-gray'}`}>{h.status?.replace(/_/g, ' ')}</span>
                  {h.entryFee > 0 && <span className="badge badge-yellow">₹{h.entryFee} entry</span>}
                </div>

                <div>
                  <h3 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 6 }}>{h.title}</h3>
                  <p className="text-sm text-muted line-clamp-2">{h.description}</p>
                </div>

                <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem', color: 'var(--clr-text-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Users size={13} /> {h.totalRegistrations || 0} registered
                  </div>
                  {h.prizes?.pool && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Trophy size={13} /> {h.prizes.pool}
                    </div>
                  )}
                </div>

                {h.status !== 'DRAFT' && (
                  <a href={`/hackathons/${h.slug}`} target="_blank" rel="noreferrer" className="btn btn-outline w-full" style={{ justifyContent: 'center', gap: 8, fontSize: '0.88rem' }}>
                    View Live Page <ExternalLink size={13} />
                  </a>
                )}
                {h.status === 'DRAFT' && (
                  <div className="btn btn-ghost w-full" style={{ justifyContent: 'center', fontSize: '0.85rem', color: 'var(--clr-text-3)', cursor: 'default' }}>
                    ⏳ Awaiting Admin Approval
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </CompanyLayout>
  );
}
