import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  CheckCircle2, XCircle, Calendar, Trophy, Video, FileText,
  Code, ArrowLeft, RefreshCw, Users, Clock, ExternalLink,
  ChevronDown, Send, Play, Award,
} from 'lucide-react';

const STAGE_LABELS = {
  REGISTERED:         { label: 'Registered',      color: 'badge-gray'   },
  IDEATION_SUBMITTED: { label: 'Phase 1 Submitted',color: 'badge-blue'   },
  SHORTLISTED:        { label: 'Shortlisted ✓',   color: 'badge-green'  },
  IN_HACKATHON:       { label: 'Phase 2 Building', color: 'badge-purple' },
  EVALUATED:          { label: 'Phase 2 Submitted',color: 'badge-teal'   },
  WINNER:             { label: 'Winner 🏆',        color: 'badge-yellow' },
  REJECTED:           { label: 'Rejected',         color: 'badge-red'    },
};

export default function AdminHackathonReview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hackathon,     setHackathon]     = useState(null);
  const [teams,         setTeams]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeSection, setActiveSection] = useState('phase1');
  const [actionLoading, setActionLoading] = useState({});

  // Interview scheduling
  const [interviewForm, setInterviewForm] = useState({
    startDate:           '',
    slotDurationMinutes: 30,
    gapMinutes:          10,
  });

  const load = async () => {
    setLoading(true);
    try {
      const [hackRes, teamsRes] = await Promise.all([
        api.get(`/hackathons/${id}`),
        api.get(`/hackathons/${id}/phase1-submissions`),
      ]);
      setHackathon(hackRes.data.data);
      setTeams(teamsRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load hackathon data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const setAction = (teamId, val) => setActionLoading(p => ({ ...p, [teamId]: val }));

  /* ── Review Phase 1 ── */
  const reviewPhase1 = async (teamId, action) => {
    setAction(teamId, action);
    try {
      await api.put(`/hackathons/${id}/teams/${teamId}/review-phase1`, { action });
      toast.success(action === 'SHORTLIST' ? '✅ Team shortlisted & email sent!' : '❌ Team rejected & email sent');
      setTeams(prev => prev.map(t =>
        t._id === teamId ? { ...t, stage: action === 'SHORTLIST' ? 'SHORTLISTED' : 'REJECTED' } : t
      ));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setAction(teamId, null);
    }
  };

  /* ── Schedule Interviews ── */
  const scheduleInterviews = async () => {
    if (!interviewForm.startDate) return toast.error('Please select a start date & time');
    setAction('interviews', true);
    try {
      const { data } = await api.post(`/hackathons/${id}/schedule-interviews`, {
        startDate:           interviewForm.startDate,
        slotDurationMinutes: Number(interviewForm.slotDurationMinutes),
        gapMinutes:          Number(interviewForm.gapMinutes),
      });
      toast.success(`${data.data?.length || 0} interview slots scheduled & emails sent!`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule interviews');
    } finally {
      setAction('interviews', null);
    }
  };

  /* ── Declare Winner ── */
  const declareWinner = async (teamId) => {
    if (!window.confirm('Declare this team as winner? Offer letters will be sent to ALL team members via email.')) return;
    setAction(teamId, 'winner');
    try {
      const { data } = await api.post(`/hackathons/${id}/teams/${teamId}/select-winner`);
      toast.success(`🏆 Winner declared! ${data.data?.length || 0} offer letters sent!`);
      setTeams(prev => prev.map(t => t._id === teamId ? { ...t, stage: 'WINNER' } : t));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to declare winner');
    } finally {
      setAction(teamId, null);
    }
  };

  /* ── Start Hackathon ── */
  const startHackathon = async () => {
    if (!window.confirm('Start the hackathon now? This will email all group leaders and begin the 24-hour Phase 1 clock.')) return;
    try {
      const { data } = await api.post(`/hackathons/${id}/start`);
      toast.success(data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start');
    }
  };

  /* ── Filtered lists ── */
  const phase1Pending     = teams.filter(t => t.stage === 'IDEATION_SUBMITTED');
  const phase1Shortlisted = teams.filter(t => ['SHORTLISTED','IN_HACKATHON','EVALUATED','WINNER'].includes(t.stage));
  const phase2Submitted   = teams.filter(t => ['EVALUATED','WINNER'].includes(t.stage));
  const allRegistered     = teams.filter(t => t.stage === 'REGISTERED');

  if (loading) return (
    <AdminLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      </div>
    </AdminLayout>
  );

  const Section = ({ id: sid, label, count, icon }) => (
    <button
      onClick={() => setActiveSection(sid)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 16px', borderRadius: 'var(--r-sm)',
        background: activeSection === sid ? 'var(--clr-primary-dim)' : 'transparent',
        border: activeSection === sid ? '1px solid rgba(79,126,248,0.3)' : '1px solid transparent',
        color: activeSection === sid ? 'var(--clr-primary)' : 'var(--clr-text-2)',
        cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600,
        fontSize: '0.85rem', transition: 'all 0.15s',
      }}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span style={{
          background: activeSection === sid ? 'var(--clr-primary)' : 'var(--clr-surface-3)',
          color: activeSection === sid ? '#fff' : 'var(--clr-text-2)',
          padding: '1px 7px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
        }}>{count}</span>
      )}
    </button>
  );

  return (
    <AdminLayout>
      <div className="page animate-fade-in">

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/hackathons')} style={{ marginBottom: 12 }}>
            <ArrowLeft size={14} /> Back to Hackathons
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                {hackathon?.title || 'Hackathon Review'}
              </h1>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
                <span className={`badge ${
                  hackathon?.status === 'ACTIVE' ? 'badge-green' :
                  hackathon?.status === 'REGISTRATION_OPEN' ? 'badge-blue' :
                  hackathon?.status === 'COMPLETED' ? 'badge-yellow' : 'badge-gray'
                }`}>{hackathon?.status}</span>
                <span className="badge badge-gray"><Users size={11} /> {hackathon?.totalRegistrations || 0} Teams</span>
                {hackathon?.entryFee > 0 && <span className="badge badge-purple">₹{hackathon.entryFee} Entry</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-sm" onClick={load}>
                <RefreshCw size={14} /> Refresh
              </button>
              {!hackathon?.isStarted && ['REGISTRATION_OPEN','REGISTRATION_CLOSED'].includes(hackathon?.status) && (
                <button className="btn btn-primary" onClick={startHackathon}>
                  <Play size={15} /> Start Hackathon
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Pipeline Status Bar */}
        <div className="card" style={{ marginBottom: 24, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto' }}>
            {[
              { label: 'Registration', done: true },
              { label: 'Hackathon Start', done: hackathon?.isStarted },
              { label: 'Phase 1 Review', done: phase1Shortlisted.length > 0 },
              { label: 'Phase 2 Build', done: phase2Submitted.length > 0 },
              { label: 'Interviews', done: false },
              { label: 'Winner & Offers', done: teams.some(t => t.stage === 'WINNER') },
            ].map((s, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < arr.length - 1 ? 1 : 0 }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  minWidth: 80, textAlign: 'center',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: s.done ? 'var(--clr-success)' : 'var(--clr-surface-3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {s.done ? <CheckCircle2 size={14} color="#fff" /> : <span style={{ color: 'var(--clr-text-3)', fontSize: '0.7rem', fontWeight: 700 }}>{i + 1}</span>}
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: s.done ? 'var(--clr-success)' : 'var(--clr-text-3)', whiteSpace: 'nowrap' }}>{s.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ flex: 1, height: 1, background: s.done ? 'var(--clr-success)' : 'var(--clr-border-2)', margin: '0 0 20px' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section Nav */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          <Section sid="phase1"    id="phase1"    label="Phase 1 Review"    count={phase1Pending.length}     icon={<FileText size={14} />} />
          <Section sid="phase2"    id="phase2"    label="Phase 2 Submissions" count={phase2Submitted.length} icon={<Code size={14} />} />
          <Section sid="interview" id="interview" label="Schedule Interviews"                                icon={<Calendar size={14} />} />
          <Section sid="winner"    id="winner"    label="Declare Winner"    count={phase2Submitted.filter(t => t.stage !== 'WINNER').length} icon={<Trophy size={14} />} />
          <Section sid="all"       id="all"       label="All Teams"         count={teams.length}             icon={<Users size={14} />} />
        </div>

        {/* ── Section: Phase 1 Review ─────────────────────────────────────── */}
        {activeSection === 'phase1' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Phase 1 Submissions — Pending Review</h2>
              <p className="text-muted text-sm">Review PPT, video, and proposed solution. Shortlist to advance to Phase 2, or reject.</p>
            </div>

            {phase1Pending.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--sp-10)' }}>
                <FileText size={36} />
                <p>No pending submissions to review right now.</p>
                {allRegistered.length > 0 && <p className="text-sm">({allRegistered.length} teams registered but haven't submitted yet)</p>}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {phase1Pending.map(team => (
                  <div key={team._id} className="card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{team.name}</h3>
                          <span className={`badge ${STAGE_LABELS[team.stage]?.color}`}>{STAGE_LABELS[team.stage]?.label}</span>
                        </div>
                        <div className="text-sm text-muted" style={{ marginBottom: 10 }}>
                          {team.college && <span>🏫 {team.college} · </span>}
                          <span>👥 {team.members?.length || 1} members · </span>
                          <span>Leader: {team.leader?.profile?.firstName} {team.leader?.profile?.lastName}</span>
                        </div>

                        {team.phase1Submission && (
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {team.phase1Submission.pptUrl && (
                              <a href={team.phase1Submission.pptUrl} target="_blank" rel="noreferrer"
                                className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem' }}>
                                <FileText size={13} /> View PPT <ExternalLink size={11} />
                              </a>
                            )}
                            {team.phase1Submission.videoUrl && (
                              <a href={team.phase1Submission.videoUrl} target="_blank" rel="noreferrer"
                                className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem' }}>
                                <Video size={13} /> Watch Video <ExternalLink size={11} />
                              </a>
                            )}
                            {team.phase1Submission.proposedSolution && (
                              <div style={{ padding: '8px 12px', background: 'var(--clr-surface-2)', borderRadius: 'var(--r-sm)', fontSize: '0.82rem', color: 'var(--clr-text-2)', maxWidth: 500 }}>
                                <strong style={{ color: 'var(--clr-text-3)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Proposed Solution:</strong>
                                <p style={{ margin: '4px 0 0', lineHeight: 1.5 }}>{team.phase1Submission.proposedSolution}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'var(--clr-danger-dim)', color: 'var(--clr-danger)', border: '1px solid rgba(248,113,113,0.3)' }}
                          onClick={() => reviewPhase1(team._id, 'REJECT')}
                          disabled={actionLoading[team._id]}
                        >
                          {actionLoading[team._id] === 'REJECT' ? <span className="spinner" style={{ borderTopColor: 'var(--clr-danger)' }}/> : <XCircle size={14} />}
                          Reject
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'var(--clr-success-dim)', color: 'var(--clr-success)', border: '1px solid rgba(52,211,153,0.3)' }}
                          onClick={() => reviewPhase1(team._id, 'SHORTLIST')}
                          disabled={actionLoading[team._id]}
                        >
                          {actionLoading[team._id] === 'SHORTLIST' ? <span className="spinner" style={{ borderTopColor: 'var(--clr-success)' }}/> : <CheckCircle2 size={14} />}
                          Shortlist
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Already reviewed */}
            {phase1Shortlisted.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--clr-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Already Shortlisted ({phase1Shortlisted.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {phase1Shortlisted.map(t => (
                    <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'var(--clr-surface-2)', borderRadius: 'var(--r-sm)' }}>
                      <span style={{ fontWeight: 600 }}>{t.name}</span>
                      <span className={`badge ${STAGE_LABELS[t.stage]?.color}`}>{STAGE_LABELS[t.stage]?.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Section: Phase 2 Submissions ──────────────────────────────────── */}
        {activeSection === 'phase2' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Phase 2 Final Submissions</h2>
              <p className="text-muted text-sm">Teams that were shortlisted and submitted their final GitHub repo, video, and PPT.</p>
            </div>

            {phase2Submitted.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--sp-10)' }}>
                <Code size={36} />
                <p>No final submissions yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {phase2Submitted.map(team => (
                  <div key={team._id} className="card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <h3 style={{ fontWeight: 700 }}>{team.name}</h3>
                          <span className={`badge ${STAGE_LABELS[team.stage]?.color}`}>{STAGE_LABELS[team.stage]?.label}</span>
                        </div>
                        <div className="text-sm text-muted" style={{ marginBottom: 10 }}>
                          Leader: {team.leader?.profile?.firstName} {team.leader?.profile?.lastName} · {team.members?.length || 1} members
                        </div>
                        {team.phase2Submission && (
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {team.phase2Submission.repoUrl && (
                              <a href={team.phase2Submission.repoUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem' }}>
                                <Code size={13} /> GitHub Repo <ExternalLink size={11} />
                              </a>
                            )}
                            {team.phase2Submission.videoUrl && (
                              <a href={team.phase2Submission.videoUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem' }}>
                                <Video size={13} /> Demo Video <ExternalLink size={11} />
                              </a>
                            )}
                            {team.phase2Submission.pptUrl && (
                              <a href={team.phase2Submission.pptUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem' }}>
                                <FileText size={13} /> Final PPT <ExternalLink size={11} />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Section: Schedule Interviews ──────────────────────────────────── */}
        {activeSection === 'interview' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Schedule Google Meet Interviews</h2>
              <p className="text-muted text-sm">Auto-create Google Meet slots and email each Phase 2 team leader their slot time and link.</p>
            </div>

            <div className="card" style={{ maxWidth: 560, marginBottom: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label>Interview Start Date & Time *</label>
                  <input type="datetime-local"
                    value={interviewForm.startDate}
                    onChange={e => setInterviewForm(f => ({ ...f, startDate: e.target.value }))}
                  />
                  <div className="form-hint">First interview slot. Subsequent slots are auto-calculated.</div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Slot Duration (minutes)</label>
                    <input type="number" min={15} max={120}
                      value={interviewForm.slotDurationMinutes}
                      onChange={e => setInterviewForm(f => ({ ...f, slotDurationMinutes: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Gap Between Slots (minutes)</label>
                    <input type="number" min={0} max={60}
                      value={interviewForm.gapMinutes}
                      onChange={e => setInterviewForm(f => ({ ...f, gapMinutes: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ padding: '10px 14px', background: 'var(--clr-primary-dim)', borderRadius: 'var(--r-sm)', fontSize: '0.82rem', color: 'var(--clr-text-2)' }}>
                  📧 Each Phase 2 team leader will receive an email with their unique Google Meet link and time slot.
                </div>

                <button className="btn btn-primary" onClick={scheduleInterviews} disabled={actionLoading['interviews']}>
                  {actionLoading['interviews'] ? <span className="spinner" style={{ borderTopColor: '#fff' }} /> : <Send size={15} />}
                  Generate Meet Links & Send Emails
                </button>
              </div>
            </div>

            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--clr-text-2)', marginBottom: 8 }}>
              Teams eligible for interview ({phase2Submitted.length})
            </div>
            {phase2Submitted.map(team => (
              <div key={team._id} style={{ padding: '10px 16px', background: 'var(--clr-surface-2)', borderRadius: 'var(--r-sm)', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>{team.name}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-3)' }}>{team.leader?.email}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Section: Declare Winner ───────────────────────────────────────── */}
        {activeSection === 'winner' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Declare Winner</h2>
              <p className="text-muted text-sm">After interviews, declare the winning team. Offer letters will be auto-generated and sent to ALL team members.</p>
            </div>

            {phase2Submitted.filter(t => t.stage !== 'WINNER').length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--sp-10)' }}>
                <Trophy size={36} />
                <p>No teams available for winner selection yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {phase2Submitted.filter(t => t.stage !== 'WINNER').map(team => (
                  <div key={team._id} className="card card-hover" style={{ borderColor: 'rgba(251,191,36,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 42, height: 42, background: 'rgba(251,191,36,0.15)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trophy size={20} style={{ color: 'var(--clr-warning)' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{team.name}</div>
                        <div className="text-xs text-muted">{team.college}</div>
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div className="text-xs text-dimmed" style={{ marginBottom: 6 }}>Team Members ({team.members?.length || 1})</div>
                      {(team.members || []).map(m => (
                        <div key={m.user?._id} style={{ fontSize: '0.82rem', color: 'var(--clr-text-2)', marginBottom: 2 }}>
                          {m.role === 'Leader' ? '👑' : '👤'} {m.user?.profile?.firstName} {m.user?.profile?.lastName}
                        </div>
                      ))}
                    </div>

                    <button
                      className="btn btn-primary w-full"
                      onClick={() => declareWinner(team._id)}
                      disabled={actionLoading[team._id]}
                      style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#0a1520' }}
                    >
                      {actionLoading[team._id] === 'winner'
                        ? <span className="spinner" style={{ borderTopColor: '#0a1520' }} />
                        : <Award size={15} />}
                      Declare as Winner
                    </button>
                    <p className="text-xs text-dimmed" style={{ marginTop: 8, textAlign: 'center' }}>
                      Offer letters will be sent to all {team.members?.length || 1} members
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Already declared winners */}
            {teams.filter(t => t.stage === 'WINNER').length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--clr-warning)', marginBottom: 10 }}>
                  🏆 Winners Declared
                </div>
                {teams.filter(t => t.stage === 'WINNER').map(t => (
                  <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 'var(--r-sm)', marginBottom: 8 }}>
                    <Trophy size={16} style={{ color: 'var(--clr-warning)', flexShrink: 0 }} />
                    <span style={{ fontWeight: 700 }}>{t.name}</span>
                    <span className="badge badge-yellow">Winner 🏆</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Section: All Teams ────────────────────────────────────────────── */}
        {activeSection === 'all' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>All Registered Teams ({teams.length})</h2>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Team Name</th>
                    <th>College</th>
                    <th>Leader</th>
                    <th>Members</th>
                    <th>Stage</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map(t => (
                    <tr key={t._id}>
                      <td style={{ fontWeight: 600 }}>{t.name}</td>
                      <td className="text-muted">{t.college || '—'}</td>
                      <td>{t.leader?.profile?.firstName} {t.leader?.profile?.lastName}</td>
                      <td>{t.members?.length || 1}</td>
                      <td><span className={`badge ${STAGE_LABELS[t.stage]?.color || 'badge-gray'}`}>{STAGE_LABELS[t.stage]?.label || t.stage}</span></td>
                      <td className="text-muted text-sm">{t.phase1Submission?.submittedAt ? '✅ Phase 1' : '—'}</td>
                    </tr>
                  ))}
                  {teams.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--clr-text-3)', padding: 32 }}>No teams registered yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
