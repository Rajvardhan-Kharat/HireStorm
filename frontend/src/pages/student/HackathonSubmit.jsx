import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import StudentLayout from '../../layouts/StudentLayout';
import {
  ArrowLeft, FileText, Video, Code, Link2, CheckCircle2,
  Upload, AlertCircle, Lock, Clock, Target
} from 'lucide-react';

export default function HackathonSubmit() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [hackathon, setHackathon] = useState(null);
  const [myTeam,    setMyTeam]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [submitting,setSubmitting]= useState(false);

  // Phase 1 form
  const [p1Form, setP1Form] = useState({ pptUrl: '', videoUrl: '', proposedSolution: '' });
  // Phase 2 form
  const [p2Form, setP2Form] = useState({ repoUrl: '', pptUrl: '', videoUrl: '' });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/hackathons/${slug}`);
      setHackathon(data.data);
      const teamRes = await api.get(`/hackathons/${data.data._id}/teams/my`);
      setMyTeam(teamRes.data.data);
    } catch (err) {
      toast.error('Could not load submission page');
      navigate('/hackathons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [slug]);

  const submitPhase1 = async () => {
    if (!p1Form.pptUrl && !p1Form.videoUrl) return toast.error('Please provide at least a PPT or video link');
    if (!p1Form.proposedSolution.trim()) return toast.error('Proposed solution description is required');
    setSubmitting(true);
    try {
      await api.post(`/hackathons/${hackathon._id}/submit/ideation`, p1Form);
      toast.success('✅ Phase 1 submitted! Watch for an email with results.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const submitPhase2 = async () => {
    if (!p2Form.repoUrl) return toast.error('GitHub repository URL is required');
    setSubmitting(true);
    try {
      await api.post(`/hackathons/${hackathon._id}/submit/final`, p2Form);
      toast.success('✅ Phase 2 submitted! You will be contacted for the interview.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLockProblem = async (psId) => {
    if (!window.confirm("Are you sure you want to lock this Problem Statement? You cannot change this later.")) return;
    setSubmitting(true);
    try {
      await api.post(`/hackathons/${hackathon._id}/problems/${psId}/lock`);
      toast.success('Problem statement locked!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not lock problem statement');
    } finally {
      setSubmitting(false);
    }
  };

  const timeLeft = (d) => {
    if (!d) return null;
    const diff = new Date(d) - Date.now();
    if (diff <= 0) return 'CLOSED';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m remaining`;
  };

  if (loading) return (
    <StudentLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    </StudentLayout>
  );

  if (!hackathon || !myTeam) return (
    <StudentLayout>
      <div className="page">
        <div className="empty-state">
          <Lock size={40} />
          <h3>No Team Found</h3>
          <p>You need to register a team before you can submit.</p>
          <button className="btn btn-primary" onClick={() => navigate(`/hackathons/${slug}`)}>
            Back to Hackathon
          </button>
        </div>
      </div>
    </StudentLayout>
  );

  const isLeader = myTeam.leader?._id === myTeam.members?.find(m => m.role === 'Leader')?.user?._id;
  const phase1Done = myTeam.stage !== 'REGISTERED';
  const phase2Done = ['EVALUATED','WINNER'].includes(myTeam.stage);
  const phase1Deadline = hackathon.timeline?.phase1Deadline || hackathon.phase1Deadline;
  const phase2Deadline = hackathon.timeline?.phase2Deadline || hackathon.phase2Deadline;
  const p1TimeLeft = timeLeft(phase1Deadline);
  const p2TimeLeft = timeLeft(phase2Deadline);

  return (
    <StudentLayout>
      <div className="page animate-fade-in" style={{ maxWidth: 760 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/hackathons/${slug}`)} style={{ marginBottom: 16 }}>
          <ArrowLeft size={14} /> Back to Hackathon
        </button>

        <div className="page-header">
          <h1>Submit — {hackathon.title}</h1>
          <p className="text-muted">Team: <strong>{myTeam.name}</strong> · {myTeam.members?.length || 1} members</p>
        </div>

        {/* Leader-only notice */}
        {!isLeader && (
          <div style={{ padding: '12px 16px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 'var(--r-sm)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.875rem' }}>
            <AlertCircle size={16} style={{ color: 'var(--clr-warning)', flexShrink: 0 }} />
            Only the <strong>group leader</strong> can submit on behalf of the team. Contact your team leader to submit.
          </div>
        )}

        {/* ── Problem Statement Selection ── */}
        {myTeam.isProblemLocked ? (
          <div className="card" style={{ padding: '16px 20px', marginBottom: 20, borderLeft: '3px solid var(--clr-success)', background: 'var(--clr-surface-2)' }}>
            <div className="text-xs text-muted" style={{ fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Locked Problem Statement</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{myTeam.problemStatement?.title}</h3>
            <p className="text-sm text-dimmed" style={{ marginTop: 4 }}>{myTeam.problemStatement?.description}</p>
          </div>
        ) : phase1Done ? null : (
          <div className="card" style={{ marginBottom: 20, borderLeft: '3px solid var(--clr-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Target size={18} style={{ color: 'var(--clr-primary)' }} />
              <h3 style={{ fontWeight: 700 }}>Select a Problem Statement</h3>
            </div>
            
            {(!hackathon.problemStatements || hackathon.problemStatements.length === 0) ? (
              <p className="text-muted text-sm">No problem statements are available yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {hackathon.problemStatements.map(ps => (
                  <div key={ps._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14, background: 'var(--clr-surface-2)', borderRadius: 'var(--r-sm)' }}>
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>{ps.title} {ps.isLocked && <span className="text-xs" style={{ color:'var(--clr-warning)', marginLeft: 8 }}>(Locked)</span>}</h4>
                      <p className="text-sm text-dimmed" style={{ marginTop: 4 }}>{ps.description}</p>
                    </div>
                    {isLeader && !ps.isLocked && (
                      <button className="btn btn-outline btn-sm" onClick={() => handleLockProblem(ps._id)} disabled={submitting}>
                        Lock PS
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Phase 1 ── */}
        <div className="card" style={{ marginBottom: 20, opacity: myTeam.stage === 'REJECTED' ? 0.5 : 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: phase1Done ? 'var(--clr-success)' : 'var(--clr-primary)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {phase1Done ? <CheckCircle2 size={16} color="#fff" /> : <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>1</span>}
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Phase 1 — Ideation Submission</h3>
                <p className="text-xs text-muted">Submit your PPT, demo video, and proposed solution (24-hour window)</p>
              </div>
            </div>
            {p1TimeLeft && !phase1Done && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: p1TimeLeft === 'CLOSED' ? 'var(--clr-danger)' : 'var(--clr-warning)', fontWeight: 700 }}>
                <Clock size={12} /> {p1TimeLeft}
              </span>
            )}
          </div>

          {phase1Done ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--clr-success-dim)', borderRadius: 'var(--r-sm)', fontSize: '0.875rem', color: 'var(--clr-success)' }}>
              <CheckCircle2 size={15} />
              {myTeam.stage === 'SHORTLISTED' ? '🎉 Submitted & Shortlisted for Phase 2!' :
               myTeam.stage === 'REJECTED' ? 'Submitted — not selected for Phase 2' :
               'Phase 1 submitted successfully. Awaiting review.'}
            </div>
          ) : !myTeam.isProblemLocked ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: 'rgba(251,191,36,0.1)', borderRadius: 'var(--r-sm)', fontSize: '0.875rem', color: 'var(--clr-warning)' }}>
              <Lock size={15} /> You must lock a Problem Statement above before submitting Phase 1.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label><FileText size={13} style={{ marginRight: 4 }} />PPT / Presentation URL</label>
                <input
                  value={p1Form.pptUrl}
                  onChange={e => setP1Form(f => ({ ...f, pptUrl: e.target.value }))}
                  placeholder="Google Slides, Canva, or any shareable link"
                />
                <div className="form-hint">Share a link to your presentation (Google Slides recommended)</div>
              </div>

              <div className="form-group">
                <label><Video size={13} style={{ marginRight: 4 }} />Demo / Walkthrough Video URL</label>
                <input
                  value={p1Form.videoUrl}
                  onChange={e => setP1Form(f => ({ ...f, videoUrl: e.target.value }))}
                  placeholder="YouTube, Loom, or Google Drive video link"
                />
                <div className="form-hint">A short video explaining your idea (2–5 minutes)</div>
              </div>

              <div className="form-group">
                <label>Proposed Solution *</label>
                <textarea
                  value={p1Form.proposedSolution}
                  onChange={e => setP1Form(f => ({ ...f, proposedSolution: e.target.value }))}
                  rows={5}
                  placeholder="Describe your proposed solution in detail. What problem are you solving? How? What technologies will you use? What is the expected outcome?"
                  required
                />
              </div>

              <div style={{ padding: '10px 14px', background: 'var(--clr-primary-dim)', borderRadius: 'var(--r-sm)', fontSize: '0.82rem', color: 'var(--clr-text-2)' }}>
                ℹ️ Only the <strong>group leader</strong> can submit. This submission represents your entire team.
              </div>

              {isLeader && (
                <button className="btn btn-primary" onClick={submitPhase1} disabled={submitting || !isLeader}>
                  {submitting ? <span className="spinner" style={{ borderTopColor: '#fff' }} /> : <Upload size={15} />}
                  Submit Phase 1
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Phase 2 ── */}
        <div className="card" style={{ opacity: ['SHORTLISTED','IN_HACKATHON','EVALUATED','WINNER'].includes(myTeam.stage) ? 1 : 0.4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: phase2Done ? 'var(--clr-success)' : 'var(--clr-surface-3)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {phase2Done ? <CheckCircle2 size={16} color="#fff" /> : <span style={{ color: 'var(--clr-text-3)', fontWeight: 700, fontSize: '0.85rem' }}>2</span>}
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Phase 2 — Final Build Submission</h3>
                <p className="text-xs text-muted">Submit your GitHub repo, final video, and presentation (after shortlisting)</p>
              </div>
            </div>
            {p2TimeLeft && myTeam.stage === 'IN_HACKATHON' && !phase2Done && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'var(--clr-warning)', fontWeight: 700 }}>
                <Clock size={12} /> {p2TimeLeft}
              </span>
            )}
          </div>

          {!['SHORTLISTED','IN_HACKATHON','EVALUATED','WINNER'].includes(myTeam.stage) ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--clr-surface-2)', borderRadius: 'var(--r-sm)', fontSize: '0.875rem', color: 'var(--clr-text-3)' }}>
              <Lock size={14} /> Complete Phase 1 and get shortlisted to unlock this section.
            </div>
          ) : phase2Done ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--clr-success-dim)', borderRadius: 'var(--r-sm)', fontSize: '0.875rem', color: 'var(--clr-success)' }}>
              <CheckCircle2 size={15} />
              {myTeam.stage === 'WINNER'
                ? '🏆 Winner! Check your email for the internship offer.'
                : 'Phase 2 submitted! You will be contacted for the interview.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: '10px 14px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 'var(--r-sm)', fontSize: '0.85rem' }}>
                🎉 <strong>You're shortlisted!</strong> Now build your final solution and submit before the Phase 2 deadline.
              </div>

              <div className="form-group">
                <label><Code size={13} style={{ marginRight: 4 }} />GitHub Repository URL *</label>
                <input
                  value={p2Form.repoUrl}
                  onChange={e => setP2Form(f => ({ ...f, repoUrl: e.target.value }))}
                  placeholder="https://github.com/yourteam/project"
                  required
                />
                <div className="form-hint">Make sure the repo is public or accessible to reviewers</div>
              </div>

              <div className="form-group">
                <label><Video size={13} style={{ marginRight: 4 }} />Final Demo Video URL</label>
                <input
                  value={p2Form.videoUrl}
                  onChange={e => setP2Form(f => ({ ...f, videoUrl: e.target.value }))}
                  placeholder="YouTube or Drive link of your final demo"
                />
              </div>

              <div className="form-group">
                <label><FileText size={13} style={{ marginRight: 4 }} />Final Presentation URL</label>
                <input
                  value={p2Form.pptUrl}
                  onChange={e => setP2Form(f => ({ ...f, pptUrl: e.target.value }))}
                  placeholder="Google Slides or Canva final deck"
                />
              </div>

              {isLeader && (
                <button className="btn btn-primary" onClick={submitPhase2} disabled={submitting}>
                  {submitting ? <span className="spinner" style={{ borderTopColor: '#fff' }} /> : <Upload size={15} />}
                  Submit Phase 2 — Final Build
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </StudentLayout>
  );
}
