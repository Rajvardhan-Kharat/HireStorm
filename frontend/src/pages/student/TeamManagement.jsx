import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import api from '../../api/axios';
import { Users, Mail, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeamManagement() {
  const { slug } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    // Assuming backend has a route to get team details by hackathon slug
    api.get(`/hackathons/${slug}/team`)
      .then(r => { setTeam(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    try {
      await api.post(`/hackathons/${slug}/team/invite`, { email: inviteEmail });
      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
      // Ideally refresh team state here to show pending invite
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  if (loading) return <StudentLayout><div className="skeleton" style={{ height: 400 }} /></StudentLayout>;
  if (!team) return (
    <StudentLayout>
      <div className="empty-state">
        <Users size={48} className="text-muted" style={{ marginBottom: 16 }} />
        <h3>No Team Found</h3>
        <p className="text-muted">You haven't joined or created a team for this hackathon yet.</p>
        <Link to={`/hackathons/${slug}`} className="btn btn-primary" style={{ marginTop: 16 }}>Go to Hackathon</Link>
      </div>
    </StudentLayout>
  );

  return (
    <StudentLayout>
      <div className="page" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Team: {team.name}</h1>
            <p className="text-muted">Manage your team members and invites.</p>
          </div>
          <Link to={`/hackathons/${slug}`} className="btn btn-outline">Back to Hackathon</Link>
        </div>

        <div className="grid-2">
          {/* Members List */}
          <div className="card">
            <h3 style={{ fontWeight: 800, marginBottom: 16 }}>Team Members</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {team.members.map(m => (
                <div key={m.user?._id || m.email} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--clr-surface-2)', borderRadius: 'var(--r-sm)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--clr-primary-dim)', color: 'var(--clr-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {m.user?.profile?.firstName?.[0] || m.email[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{m.user?.profile?.firstName ? `${m.user.profile.firstName} ${m.user.profile.lastName}` : m.email}</div>
                    <div className="text-xs text-muted">{m.status === 'LEADER' ? 'Team Leader' : m.status}</div>
                  </div>
                  {m.status === 'PENDING' && <span className="badge badge-yellow">Pending</span>}
                  {m.status === 'ACCEPTED' && <CheckCircle2 size={18} className="text-success" />}
                </div>
              ))}
            </div>
          </div>

          {/* Invite Section */}
          <div className="card">
            <h3 style={{ fontWeight: 800, marginBottom: 16 }}>Invite Members</h3>
            <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label>Email Address</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="student@university.edu" />
                  <button type="submit" className="btn btn-primary" disabled={inviting}>
                    {inviting ? <span className="spinner"/> : <Mail size={18} />}
                  </button>
                </div>
              </div>
            </form>
            
            <div style={{ marginTop: 24, padding: 16, background: 'rgba(234, 179, 8, 0.1)', border: '1px solid var(--clr-warning)', borderRadius: 'var(--r-sm)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <AlertCircle size={20} className="text-warning" style={{ flexShrink: 0, marginTop: 2 }} />
              <div className="text-sm">
                <strong style={{ color: 'var(--clr-warning)' }}>Team Limit</strong>
                <p style={{ marginTop: 4 }}>A team can have a maximum of 4 members. Once an invite is accepted, they cannot be removed.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
