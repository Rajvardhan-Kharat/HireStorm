import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Search, Play, Eye, Calendar, Users, DollarSign, RefreshCw, Trophy } from 'lucide-react';

const STATUS_BADGE = {
  DRAFT:               'badge-gray',
  REGISTRATION_OPEN:   'badge-blue',
  REGISTRATION_CLOSED: 'badge-orange',
  ACTIVE:              'badge-green',
  SHORTLISTING:        'badge-purple',
  HACKING:             'badge-teal',
  EVALUATION:          'badge-yellow',
  COMPLETED:           'badge-gray',
};

const STATUS_LABEL = {
  DRAFT:               'Draft',
  REGISTRATION_OPEN:   'Registration Open',
  REGISTRATION_CLOSED: 'Registration Closed',
  ACTIVE:              'Active — Phase 1',
  SHORTLISTING:        'Shortlisting',
  HACKING:             'Phase 2 Build',
  EVALUATION:          'Interviews',
  COMPLETED:           'Completed',
};

export default function AdminHackathons() {
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/hackathons?status=ALL&limit=50');
      // Also fetch drafts via admin
      const { data: adminData } = await api.get('/admin/hackathons').catch(() => ({ data: { data: [] } }));
      const all = [...(data.data || []), ...(adminData.data || [])];
      // deduplicate by _id
      const unique = Object.values(Object.fromEntries(all.map(h => [h._id, h])));
      setHackathons(unique);
    } catch (err) {
      // fallback: just public list
      try {
        const { data } = await api.get('/hackathons');
        setHackathons(data.data || []);
      } catch {
        toast.error('Failed to load hackathons');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startHackathon = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Start this hackathon now? Phase 1 clock will begin immediately.')) return;
    try {
      const { data } = await api.post(`/hackathons/${id}/start`);
      toast.success(data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start');
    }
  };

  const filtered = hackathons.filter(h =>
    h.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="page animate-fade-in">
        {/* Header */}
        <div className="page-header-row">
          <div className="page-header" style={{ marginBottom: 0 }}>
            <h1>Hackathons</h1>
            <p className="text-muted">Manage your Innobytes hackathon pipeline — create, start, review, and declare winners.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost btn-sm" onClick={load}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/admin/hackathons/create')}>
              <Plus size={15} /> Create Hackathon
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Total',      value: hackathons.length,                                         icon: <Trophy size={16} />,   color: 'var(--clr-primary)' },
            { label: 'Active',     value: hackathons.filter(h => h.status === 'ACTIVE').length,      icon: <Play size={16} />,     color: 'var(--clr-success)' },
            { label: 'Open Reg',   value: hackathons.filter(h => h.status === 'REGISTRATION_OPEN').length, icon: <Calendar size={16}/>, color: 'var(--clr-accent)' },
            { label: 'Completed',  value: hackathons.filter(h => h.status === 'COMPLETED').length,   icon: <Trophy size={16} />,   color: 'var(--clr-warning)' },
          ].map(s => (
            <div key={s.label} className="metric-card" style={{ '--metric-color': s.color }}>
              <div className="metric-icon" style={{ color: s.color }}>{s.icon}</div>
              <div className="metric-value">{s.value}</div>
              <div className="metric-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="input-with-icon" style={{ maxWidth: 380, marginBottom: 20 }}>
          <Search size={14} />
          <input
            placeholder="Search hackathons..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Hackathon Cards */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" style={{ width: 36, height: 36 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--sp-16)' }}>
            <Trophy size={48} />
            <h3>No hackathons yet</h3>
            <p>Create your first hackathon to get started.</p>
            <button className="btn btn-primary" onClick={() => navigate('/admin/hackathons/create')}>
              <Plus size={15} /> Create Hackathon
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(hack => (
              <div
                key={hack._id}
                className="card card-hover"
                style={{ padding: '20px 24px', cursor: 'pointer' }}
                onClick={() => navigate(`/admin/hackathons/${hack._id}/review`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>{hack.title}</h3>
                      <span className={`badge ${STATUS_BADGE[hack.status] || 'badge-gray'}`}>
                        {STATUS_LABEL[hack.status] || hack.status}
                      </span>
                      {hack.entryFee > 0 && (
                        <span className="badge badge-purple">₹{hack.entryFee}</span>
                      )}
                    </div>
                    <p className="text-muted text-sm" style={{ marginBottom: 10, maxWidth: 600 }}>
                      {hack.description?.slice(0, 120)}{hack.description?.length > 120 ? '...' : ''}
                    </p>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Users size={11} /> {hack.totalRegistrations || 0} teams
                      </span>
                      <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={11} /> Reg. closes: {hack.timeline?.registrationClose ? new Date(hack.timeline.registrationClose).toLocaleDateString('en-IN') : '—'}
                      </span>
                      {hack.eligibleColleges?.length > 0 && (
                        <span className="text-xs text-muted">🏫 {hack.eligibleColleges.slice(0, 2).join(', ')}{hack.eligibleColleges.length > 2 ? ` +${hack.eligibleColleges.length - 2}` : ''}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    {!hack.isStarted && ['REGISTRATION_OPEN','REGISTRATION_CLOSED'].includes(hack.status) && (
                      <button className="btn btn-primary btn-sm" onClick={(e) => startHackathon(hack._id, e)}>
                        <Play size={13} /> Start
                      </button>
                    )}
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => navigate(`/admin/hackathons/${hack._id}/review`)}
                    >
                      <Eye size={13} /> Review Panel
                    </button>
                  </div>
                </div>

                {/* Pipeline mini progress */}
                {hack.isStarted && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--clr-border)' }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {['ACTIVE','SHORTLISTING','HACKING','EVALUATION','COMPLETED'].map(s => {
                        const STAGES = ['DRAFT','REGISTRATION_OPEN','REGISTRATION_CLOSED','ACTIVE','SHORTLISTING','HACKING','EVALUATION','COMPLETED'];
                        const isDone = STAGES.indexOf(hack.status) >= STAGES.indexOf(s);
                        return (
                          <div key={s} style={{
                            flex: 1, height: 4, borderRadius: 99,
                            background: isDone ? 'var(--clr-primary)' : 'var(--clr-surface-3)',
                            transition: 'background 0.3s',
                          }} />
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      {['Phase 1','Review','Phase 2','Interviews','Done'].map(l => (
                        <span key={l} style={{ fontSize: '0.62rem', color: 'var(--clr-text-3)' }}>{l}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
