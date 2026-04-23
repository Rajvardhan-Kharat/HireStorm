import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import StudentLayout from '../../layouts/StudentLayout';
import useAuthStore from '../../store/authStore';
import {
  Calendar, Users, DollarSign, Clock, Trophy, FileText,
  ChevronRight, ArrowLeft, CheckCircle2, Lock, Unlock,
  AlertCircle, Target, UserPlus, X, Mail
} from 'lucide-react';

export default function HackathonDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [hackathon,  setHackathon]  = useState(null);
  const [myTeam,     setMyTeam]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [regLoading, setRegLoading] = useState(false);

  // Registration form
  const [showRegForm, setShowRegForm] = useState(false);
  const [regForm,     setRegForm]     = useState({ name: '', college: '' });
  
  // Invites
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/hackathons/${slug}`);
      setHackathon(data.data);

      // Check if student already has a team
      try {
        const teamRes = await api.get(`/hackathons/${data.data._id}/teams/my`);
        setMyTeam(teamRes.data.data);
      } catch { /* Not in a team */ }
    } catch {
      toast.error('Hackathon not found');
      navigate('/hackathons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [slug]);

  const register = async () => {
    if (!regForm.name.trim()) return toast.error('Team name is required');
    setRegLoading(true);
    try {
      // Demo payment (always allowed)
      if (hackathon.entryFee > 0) {
        await api.post(`/hackathons/${hackathon._id}/registration-order`);
        // Demo: proceed without real payment
      }
      const { data } = await api.post(`/hackathons/${hackathon._id}/teams/register`, regForm);
      setMyTeam(data.data);
      setShowRegForm(false);
      toast.success('🎉 Team registered successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return toast.error('Enter an email address');
    setInviting(true);
    try {
      await api.post(`/hackathons/${hackathon._id}/teams/invite`, { teamId: myTeam._id, email: inviteEmail });
      toast.success('Invite sent!');
      setInviteEmail('');
      load(); // Reload to show new invite in list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  const format = (d) => d ? new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—';
  const timeLeft = (d) => {
    if (!d) return null;
    const diff = new Date(d) - Date.now();
    if (diff <= 0) return null;
    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    return days > 0 ? `${days}d ${hours}h` : `${hours}h ${Math.floor((diff % 3600000) / 60000)}m`;
  };

  if (loading) return (
    <StudentLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    </StudentLayout>
  );

  if (!hackathon) return null;

  const isOpen     = hackathon.status === 'REGISTRATION_OPEN';
  const isActive   = ['ACTIVE','SHORTLISTING','HACKING','EVALUATION'].includes(hackathon.status);
  const isComplete = hackathon.status === 'COMPLETED';
  const regLeft    = timeLeft(hackathon.timeline?.registrationClose);
  const p1Left     = timeLeft(hackathon.timeline?.phase1Deadline);

  const teamStageMsg = {
    REGISTERED:         { label: 'Registered ✓', color: 'var(--clr-primary)', action: null },
    IDEATION_SUBMITTED: { label: 'Phase 1 Submitted', color: 'var(--clr-success)', action: null },
    SHORTLISTED:        { label: '🎉 Shortlisted for Phase 2!', color: 'var(--clr-success)', action: '/submit' },
    IN_HACKATHON:       { label: 'Phase 2 in Progress', color: 'var(--clr-accent)', action: '/submit' },
    EVALUATED:          { label: 'Phase 2 Submitted', color: 'var(--clr-success)', action: null },
    WINNER:             { label: '🏆 Winner! Check your email', color: 'var(--clr-warning)', action: null },
    REJECTED:           { label: 'Not selected this time', color: 'var(--clr-danger)', action: null },
  };
  const stageCfg = myTeam ? (teamStageMsg[myTeam.stage] || {}) : null;

  return (
    <StudentLayout>
      <div className="page animate-fade-in">

        {/* Back */}
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/hackathons')} style={{ marginBottom: 16 }}>
          <ArrowLeft size={14} /> Back to Hackathons
        </button>

        {/* Hero Banner */}
        <div style={{
          background: hackathon.banner
            ? `linear-gradient(rgba(15,22,35,0.7), rgba(15,22,35,0.9)), url(${hackathon.banner}) center/cover`
            : 'linear-gradient(135deg, var(--clr-primary) 0%, var(--clr-accent) 100%)',
          borderRadius: 'var(--r-lg)', padding: '40px 36px', marginBottom: 28, position: 'relative',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{
                  padding: '3px 12px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700,
                  background: isOpen ? 'var(--clr-success)' : isActive ? 'var(--clr-danger)' : 'rgba(255,255,255,0.2)',
                  color: '#fff',
                }}>{isOpen ? 'Registration Open' : isActive ? '🔥 Live Now' : hackathon?.status}</span>
                {hackathon.entryFee === 0
                  ? <span style={{ padding: '3px 12px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700, background: 'rgba(52,211,153,0.3)', color: '#34d399' }}>FREE</span>
                  : <span style={{ padding: '3px 12px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700, background: 'rgba(0,0,0,0.4)', color: '#fff' }}>₹{hackathon.entryFee} Entry Fee</span>
                }
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 10 }}>
                {hackathon.title}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.75)', maxWidth: 580, lineHeight: 1.65, fontSize: '0.95rem' }}>
                {hackathon.description}
              </p>

              <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Users size={13} /> {hackathon.teamConfig?.minSize || 1}–{hackathon.teamConfig?.maxSize || 4} members/team
                </span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Users size={13} /> {hackathon.totalRegistrations || 0} teams registered
                </span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Clock size={13} /> 2.5 Day Challenge
                </span>
              </div>
            </div>

            {/* CTA / My Team Status */}
            <div style={{ minWidth: 260 }}>
              {myTeam ? (
                <div className="card" style={{ padding: '18px 20px', background: 'rgba(15,22,35,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontWeight: 700, marginBottom: 8, color: '#fff' }}>Your Team: {myTeam.name}</div>
                  <div style={{ padding: '6px 12px', borderRadius: 'var(--r-sm)', background: 'rgba(79,126,248,0.15)', color: stageCfg?.color || 'var(--clr-primary)', fontWeight: 600, fontSize: '0.85rem', marginBottom: 12 }}>
                    {stageCfg?.label || myTeam.stage}
                  </div>
                  {stageCfg?.action && (
                    <button className="btn btn-primary btn-sm w-full" onClick={() => navigate(`/hackathons/${hackathon.slug || hackathon._id}/submit`)}>
                      Submit Now <ChevronRight size={14} />
                    </button>
                  )}
                  {['SHORTLISTED','IN_HACKATHON'].includes(myTeam.stage) && (
                    <button className="btn btn-primary w-full" style={{ marginTop: 8 }}
                      onClick={() => navigate(`/hackathons/${hackathon.slug || hackathon._id}/submit`)}>
                      Go to Submission <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              ) : isOpen ? (
                <div style={{ textAlign: 'right' }}>
                  {regLeft && (
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                      <Clock size={13} /> {regLeft} to register
                    </div>
                  )}
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowRegForm(true)}
                    style={{ background: 'rgba(255,255,255,0.95)', color: 'var(--clr-primary)', fontWeight: 800 }}
                  >
                    Register Team
                  </button>
                </div>
              ) : (
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textAlign: 'right' }}>
                  {isActive ? 'Hackathon in progress' : 'Registration closed'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Registration Form Modal */}
        {showRegForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div className="card" style={{ width: '100%', maxWidth: 440, padding: 32, animation: 'fadeUp 0.2s ease' }}>
              <h3 style={{ fontWeight: 700, marginBottom: 6, fontSize: '1.2rem' }}>Register Your Team</h3>
              {hackathon.entryFee > 0 && (
                <div style={{ padding: '8px 12px', background: 'var(--clr-primary-dim)', borderRadius: 'var(--r-sm)', marginBottom: 16, fontSize: '0.85rem', color: 'var(--clr-primary)' }}>
                  💳 Entry fee: ₹{hackathon.entryFee} — <em>Demo mode: payment skipped</em>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label>Team Name *</label>
                  <input value={regForm.name} onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Code Wizards" autoFocus />
                </div>
                <div className="form-group">
                  <label>College / Institution</label>
                  <input value={regForm.college} onChange={e => setRegForm(f => ({ ...f, college: e.target.value }))}
                    placeholder="Your college name" />
                </div>
                {hackathon.eligibleColleges?.length > 0 && (
                  <div className="text-sm text-muted" style={{ background: 'var(--clr-surface-2)', padding: '8px 12px', borderRadius: 'var(--r-sm)' }}>
                    ✅ Eligible colleges: {hackathon.eligibleColleges.join(', ')}
                  </div>
                )}
                <div className="text-sm text-muted">
                  You are registering as <strong>Team Leader</strong>. You can invite members after registration.
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button className="btn btn-ghost flex-1" onClick={() => setShowRegForm(false)}>Cancel</button>
                  <button className="btn btn-primary flex-1" onClick={register} disabled={regLoading}>
                    {regLoading ? <span className="spinner" style={{ borderTopColor: '#fff' }} /> : 'Register'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
          {/* Left: Problem Statements */}
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: 16 }}>
              <Target size={18} style={{ marginRight: 8, color: 'var(--clr-primary)' }} />
              Problem Statements
              <span className="badge badge-blue" style={{ marginLeft: 10 }}>{hackathon.problemStatements?.length || 0}</span>
            </h2>

            {(!hackathon.problemStatements || hackathon.problemStatements.length === 0) ? (
              <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--clr-text-3)' }}>
                <Lock size={24} style={{ marginBottom: 8 }} />
                <p>Problem statements will be revealed when the hackathon starts.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {hackathon.problemStatements.map((ps, i) => (
                  <div key={ps._id || i} className="card" style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, background: 'var(--clr-primary-dim)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-primary)', fontWeight: 700, fontSize: '0.8rem' }}>
                          P{i + 1}
                        </div>
                        <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{ps.title}</h4>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {ps.domain && <span className="tag">{ps.domain}</span>}
                        <span className={`badge ${ps.difficulty === 'HARD' ? 'badge-red' : ps.difficulty === 'MEDIUM' ? 'badge-orange' : 'badge-green'}`}>{ps.difficulty}</span>
                      </div>
                    </div>
                    {ps.description && (
                      <p className="text-muted text-sm" style={{ lineHeight: 1.6 }}>{ps.description}</p>
                    )}
                    {ps.isLocked && (
                      <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--clr-warning)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Lock size={11} /> Locked by a team
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Timeline & Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Key Dates */}
            <div className="card" style={{ padding: '18px 20px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 14 }}>
                <Calendar size={15} style={{ marginRight: 6, color: 'var(--clr-primary)' }} />
                Key Dates
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Registration Closes', date: hackathon.timeline?.registrationClose, icon: '📝' },
                  { label: 'Hackathon Starts', date: hackathon.timeline?.hackathonStart, icon: '🔥' },
                  { label: 'Phase 1 Deadline', date: hackathon.timeline?.phase1Deadline || hackathon.phase1Deadline, icon: '⏰' },
                  { label: 'Phase 2 Deadline', date: hackathon.timeline?.phase2Deadline || hackathon.phase2Deadline, icon: '🚀' },
                ].map(({ label, date, icon }) => date && (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div className="text-xs text-dimmed">{icon} {label}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{format(date)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Info */}
            <div className="card" style={{ padding: '18px 20px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 12 }}>
                <Users size={15} style={{ marginRight: 6, color: 'var(--clr-primary)' }} />
                Team Requirements
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="text-sm"><span className="text-muted">Team Size:</span> <strong>{hackathon.teamConfig?.minSize || 1}–{hackathon.teamConfig?.maxSize || 4} members</strong></div>
                <div className="text-sm"><span className="text-muted">Entry Fee:</span> <strong>{hackathon.entryFee === 0 ? 'Free' : `₹${hackathon.entryFee}`}</strong></div>
                {hackathon.eligibleColleges?.length > 0 && (
                  <div className="text-sm">
                    <div className="text-muted" style={{ marginBottom: 4 }}>Eligible Colleges:</div>
                    {hackathon.eligibleColleges.map(c => <div key={c} className="tag" style={{ display: 'inline-block', marginRight: 4, marginBottom: 4 }}>{c}</div>)}
                  </div>
                )}
              </div>
            </div>

            {/* Team Management (only visible if part of team) */}
            {myTeam && (
              <div className="card animate-fade-in" style={{ padding: '18px 20px', borderTop: '3px solid var(--clr-primary)' }}>
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 14 }}>
                  <Users size={15} style={{ marginRight: 6, color: 'var(--clr-primary)' }} />
                  Manage Team
                </h3>

                <div style={{ marginBottom: 16 }}>
                  <div className="text-xs text-muted" style={{ marginBottom: 8, fontWeight: 700, textTransform: 'uppercase' }}>Members</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {myTeam.members?.map(m => (
                      <div key={m.email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--clr-surface-2)', borderRadius: 'var(--r-sm)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 24, height: 24, background: 'var(--clr-primary)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>
                            {m.user?.profile?.firstName?.[0] || m.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold">{m.user?.profile?.firstName || m.email.split('@')[0]}</div>
                            <div className="text-xs text-muted">{m.role}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {myTeam.invites?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div className="text-xs text-muted" style={{ marginBottom: 8, fontWeight: 700, textTransform: 'uppercase' }}>Pending Invites</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {myTeam.invites.filter(i => i.status === 'PENDING').map(inv => (
                        <div key={inv.token} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--clr-surface-2)', borderRadius: 'var(--r-sm)', border: '1px dashed var(--clr-border)' }}>
                          <span className="text-sm">{inv.email}</span>
                          <span className="text-xs" style={{ color: 'var(--clr-warning)', fontWeight: 600 }}>Pending</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Only let leader invite, and only if max size not reached */}
                {myTeam.leader?._id === user?._id && (myTeam.members.length + myTeam.invites.filter(i => i.status === 'PENDING').length) < (hackathon.teamConfig?.maxSize || 4) && (
                  <div style={{ marginTop: 16 }}>
                    <div className="text-xs text-muted" style={{ marginBottom: 8 }}>Invite Teammate ({myTeam.members.length + myTeam.invites.filter(i => i.status === 'PENDING').length} / {hackathon.teamConfig?.maxSize || 4})</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input 
                        type="email" 
                        placeholder="student@example.com" 
                        value={inviteEmail} 
                        onChange={e => setInviteEmail(e.target.value)}
                        style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }} 
                      />
                      <button className="btn btn-primary" style={{ padding: '0 12px' }} onClick={handleInvite} disabled={inviting}>
                        {inviting ? <span className="spinner" /> : <UserPlus size={16} />}
                      </button>
                    </div>
                  </div>
                )}
                {myTeam.leader?._id === user?._id && (myTeam.members.length + myTeam.invites.filter(i => i.status === 'PENDING').length) >= (hackathon.teamConfig?.maxSize || 4) && (
                  <div className="text-xs text-muted" style={{ marginTop: 12, textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 4 }}>
                    Max team size reached
                  </div>
                )}
              </div>
            )}

            {/* What You'll Win */}
            <div className="card" style={{ padding: '18px 20px', border: '1px solid rgba(251,191,36,0.2)', background: 'rgba(251,191,36,0.04)' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 12, color: 'var(--clr-warning)' }}>
                <Trophy size={15} style={{ marginRight: 6 }} />
                What You Win
              </h3>
              {['90-Day Innobytes Internship','Offer Letter (Digitally Signed)','Certificate of Completion','LinkedIn Share Option','Expert Mentorship'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: '0.83rem' }}>
                  <CheckCircle2 size={13} style={{ color: 'var(--clr-success)', flexShrink: 0 }} />
                  {item}
                </div>
              ))}
            </div>

            {/* Submit CTA if in team and hackathon active */}
            {myTeam && isActive && ['SHORTLISTED','IN_HACKATHON'].includes(myTeam.stage) && (
              <button
                className="btn btn-primary w-full"
                onClick={() => navigate(`/hackathons/${hackathon.slug || hackathon._id}/submit`)}
              >
                <FileText size={15} /> Submit Phase 2
              </button>
            )}
            {myTeam && hackathon.status === 'ACTIVE' && myTeam.stage === 'REGISTERED' && (
              <button
                className="btn btn-primary w-full"
                onClick={() => navigate(`/hackathons/${hackathon.slug || hackathon._id}/submit`)}
              >
                <FileText size={15} /> Submit Phase 1 (Ideation)
              </button>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
