import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  Search, Calendar, Users, DollarSign, Clock,
  ChevronRight, Trophy, Filter, RefreshCw,
} from 'lucide-react';
import StudentLayout from '../../layouts/StudentLayout';

const STATUS_CONFIG = {
  DRAFT:               { label: 'Draft',             color: '#6b7280' },
  REGISTRATION_OPEN:   { label: 'Registration Open', color: 'var(--clr-success)' },
  REGISTRATION_CLOSED: { label: 'Reg. Closed',       color: 'var(--clr-warning)' },
  ACTIVE:              { label: '🔥 Live',            color: 'var(--clr-danger)' },
  SHORTLISTING:        { label: 'Under Review',       color: 'var(--clr-accent)' },
  HACKING:             { label: '⚡ Phase 2 Live',    color: 'var(--clr-danger)' },
  EVALUATION:          { label: 'Interviews',         color: 'var(--clr-primary)' },
  COMPLETED:           { label: 'Completed',          color: '#6b7280' },
};

export default function Hackathons() {
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState('ALL');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/hackathons?limit=50');
      setHackathons(data.data || []);
    } catch {
      toast.error('Failed to load hackathons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filters = ['ALL', 'REGISTRATION_OPEN', 'ACTIVE', 'COMPLETED'];

  const filtered = hackathons.filter(h => {
    const matchSearch = h.title?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || h.status === filter;
    return matchSearch && matchFilter;
  });

  const timeLeft = (deadline) => {
    if (!deadline) return null;
    const diff = new Date(deadline) - Date.now();
    if (diff <= 0) return 'Closed';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    return d > 0 ? `${d}d ${h}h left` : `${h}h left`;
  };

  return (
    <StudentLayout>
      <div className="page animate-fade-in">
        {/* Header */}
        <div className="page-header">
          <h1>Hackathons</h1>
          <p className="text-muted">Compete in Innobytes hackathons and win a 90-day internship opportunity</p>
        </div>

        {/* Feature Banner */}
        <div style={{
          background: 'linear-gradient(135deg, var(--clr-primary) 0%, var(--clr-accent) 100%)',
          borderRadius: 'var(--r-lg)', padding: '28px 32px', marginBottom: 28,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Trophy size={24} color="#fff" />
              <h2 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#fff', letterSpacing: '-0.02em' }}>
                Hackathon → Internship Pipeline
              </h2>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', maxWidth: 540, lineHeight: 1.6 }}>
              Submit your solution → Get shortlisted → Build your final project → Interview online → Win a <strong>90-day Innobytes internship</strong> with offer letter & completion certificate.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
              {['2.5 Day Challenge','Live Problem Statements','Google Meet Interviews','90-Day Internship Offer','Completion Certificate'].map(f => (
                <div key={f} style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.15)', borderRadius: 99, fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>{f}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
          <div className="input-with-icon" style={{ flex: 1, minWidth: 220 }}>
            <Search size={14} />
            <input
              placeholder="Search hackathons..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '7px 14px', borderRadius: 'var(--r-sm)',
                  border: '1px solid var(--clr-border)',
                  background: filter === f ? 'var(--clr-primary)' : 'var(--clr-surface-2)',
                  color: filter === f ? '#fff' : 'var(--clr-text-2)',
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                  fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
                }}
              >
                {f === 'ALL' ? 'All' : f === 'REGISTRATION_OPEN' ? 'Open' : f === 'ACTIVE' ? 'Live' : 'Past'}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={load}>
            <RefreshCw size={13} />
          </button>
        </div>

        {/* Cards */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" style={{ width: 36, height: 36 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--sp-16)' }}>
            <Trophy size={48} />
            <h3>No hackathons found</h3>
            <p>{search ? 'Try a different search.' : 'Check back soon for upcoming hackathons!'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {filtered.map(hack => {
              const statusCfg = STATUS_CONFIG[hack.status] || { label: hack.status, color: '#6b7280' };
              const isOpen    = hack.status === 'REGISTRATION_OPEN';
              const isLive    = ['ACTIVE','HACKING'].includes(hack.status);
              const regLeft   = timeLeft(hack.timeline?.registrationClose);

              return (
                <div
                  key={hack._id}
                  className="card card-hover"
                  style={{ cursor: 'pointer', overflow: 'hidden', padding: 0 }}
                  onClick={() => navigate(`/hackathons/${hack.slug || hack._id}`)}
                >
                  {/* Banner */}
                  <div style={{
                    height: 120,
                    background: hack.banner
                      ? `url(${hack.banner}) center/cover`
                      : 'linear-gradient(135deg, var(--clr-primary) 0%, var(--clr-accent) 100%)',
                    position: 'relative',
                  }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
                    <div style={{ position: 'absolute', top: 12, left: 12 }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
                        background: isLive ? 'var(--clr-danger)' : isOpen ? 'var(--clr-success)' : 'rgba(0,0,0,0.5)',
                        color: '#fff',
                      }}>{statusCfg.label}</span>
                    </div>
                    {hack.entryFee > 0 && (
                      <div style={{ position: 'absolute', top: 12, right: 12, padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                        ₹{hack.entryFee}
                      </div>
                    )}
                    {hack.entryFee === 0 && (
                      <div style={{ position: 'absolute', top: 12, right: 12, padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, background: 'rgba(52,211,153,0.8)', color: '#fff' }}>
                        FREE
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '18px 20px' }}>
                    <h3 style={{ fontWeight: 700, marginBottom: 6, fontSize: '1rem', lineHeight: 1.3 }}>{hack.title}</h3>
                    <p className="text-muted text-sm" style={{ marginBottom: 14, lineHeight: 1.5 }}>
                      {hack.description?.slice(0, 100)}{hack.description?.length > 100 ? '...' : ''}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                      <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Users size={11} /> {hack.teamConfig?.minSize || 1}–{hack.teamConfig?.maxSize || 4} per team
                      </span>
                      <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Users size={11} /> {hack.totalRegistrations || 0} registered
                      </span>
                      {isOpen && regLeft && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--clr-warning)', fontWeight: 600 }}>
                          <Clock size={11} /> {regLeft}
                        </span>
                      )}
                    </div>

                    {/* Problem statement count */}
                    {hack.problemStatements?.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                        <span style={{ padding: '2px 8px', background: 'var(--clr-primary-dim)', color: 'var(--clr-primary)', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700 }}>
                          {hack.problemStatements.length} Problem Statements
                        </span>
                      </div>
                    )}

                    <button
                      className="btn w-full"
                      style={{
                        background: isOpen
                          ? 'linear-gradient(135deg, var(--clr-primary), var(--clr-accent))'
                          : isLive ? 'linear-gradient(135deg, var(--clr-danger), #f59e0b)'
                          : 'var(--clr-surface-3)',
                        color: isOpen || isLive ? '#fff' : 'var(--clr-text-3)',
                        border: 'none', fontWeight: 700,
                      }}
                    >
                      {isOpen ? 'Register Now' : isLive ? 'View Dashboard' : 'View Details'}
                      <ChevronRight size={15} />
                    </button>
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
