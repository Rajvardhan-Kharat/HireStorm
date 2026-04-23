import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  ChevronRight, ChevronLeft, Plus, Trash2, CheckCircle2,
  Globe, Users, Calendar, DollarSign, BookOpen, Eye,
} from 'lucide-react';

const STEPS = ['Basic Info', 'Timeline', 'Problem Statements', 'Review & Publish'];

const defaultPS = () => ({ title: '', description: '', domain: '', difficulty: 'MEDIUM' });

export default function AdminCreateHackathon() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title:            '',
    description:      '',
    banner:           '',
    entryFee:         0,
    eligibleColleges: [],
    collegeInput:     '',
    teamConfig:       { minSize: 2, maxSize: 4 },
    timeline: {
      registrationOpen:  '',
      registrationClose: '',
    },
    problemStatements: [defaultPS()],
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setTimeline = (key, val) => setForm(f => ({ ...f, timeline: { ...f.timeline, [key]: val } }));
  const setTeam = (key, val) => setForm(f => ({ ...f, teamConfig: { ...f.teamConfig, [key]: val } }));

  /* ── College tags ── */
  const addCollege = () => {
    const v = form.collegeInput.trim();
    if (v && !form.eligibleColleges.includes(v)) {
      set('eligibleColleges', [...form.eligibleColleges, v]);
    }
    set('collegeInput', '');
  };
  const removeCollege = c => set('eligibleColleges', form.eligibleColleges.filter(x => x !== c));

  /* ── Problem Statements ── */
  const setPS = (i, key, val) => {
    const ps = [...form.problemStatements];
    ps[i] = { ...ps[i], [key]: val };
    set('problemStatements', ps);
  };
  const addPS = () => {
    if (form.problemStatements.length >= 6) return toast.error('Max 6 problem statements');
    set('problemStatements', [...form.problemStatements, defaultPS()]);
  };
  const removePS = i => {
    if (form.problemStatements.length <= 1) return;
    set('problemStatements', form.problemStatements.filter((_, idx) => idx !== i));
  };

  /* ── Submit ── */
  const handleSubmit = async (publishNow) => {
    setLoading(true);
    try {
      const payload = {
        title:            form.title,
        description:      form.description,
        banner:           form.banner,
        entryFee:         Number(form.entryFee),
        eligibleColleges: form.eligibleColleges,
        teamConfig:       form.teamConfig,
        timeline: {
          registrationOpen:  form.timeline.registrationOpen || undefined,
          registrationClose: form.timeline.registrationClose || undefined,
        },
        status: publishNow ? 'REGISTRATION_OPEN' : 'DRAFT',
      };

      const { data } = await api.post('/hackathons', payload);
      const hackId   = data.data._id;

      // Create problem statements
      await Promise.all(
        form.problemStatements
          .filter(p => p.title.trim())
          .map(p => api.post(`/hackathons/${hackId}/problems`, p))
      );

      toast.success(publishNow ? 'Hackathon published!' : 'Draft saved!');
      navigate('/admin/hackathons');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create hackathon');
    } finally {
      setLoading(false);
    }
  };

  const canAdvance = () => {
    if (step === 0) return form.title.trim() && form.description.trim();
    if (step === 1) return form.timeline.registrationClose;
    if (step === 2) return form.problemStatements.some(p => p.title.trim());
    return true;
  };

  /* ── Step styles ── */
  const stepStyle = (i) => ({
    display: 'flex', alignItems: 'center', gap: 8,
    color: i === step ? 'var(--clr-primary)' : i < step ? 'var(--clr-success)' : 'var(--clr-text-3)',
    fontWeight: i === step ? 700 : 500,
    fontSize: '0.82rem',
  });

  return (
    <AdminLayout>
      <div className="page animate-fade-in">
        {/* Header */}
        <div className="page-header-row">
          <div className="page-header" style={{ marginBottom: 0 }}>
            <h1>Create Hackathon</h1>
            <p className="text-muted">Set up your Innobytes hackathon — step by step</p>
          </div>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32, flexWrap: 'wrap', gap: 4 }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => i < step && setStep(i)}
                style={{
                  ...stepStyle(i),
                  background: 'none', border: 'none', cursor: i < step ? 'pointer' : 'default',
                  padding: '6px 10px', borderRadius: 'var(--r-sm)',
                  background: i === step ? 'var(--clr-primary-dim)' : 'transparent',
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: i < step ? 'var(--clr-success)' : i === step ? 'var(--clr-primary)' : 'var(--clr-surface-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700, color: i <= step ? '#fff' : 'var(--clr-text-3)',
                }}>
                  {i < step ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                {label}
              </button>
              {i < STEPS.length - 1 && (
                <div style={{ width: 24, height: 1, background: 'var(--clr-border-2)', margin: '0 4px' }} />
              )}
            </div>
          ))}
        </div>

        <div className="card" style={{ maxWidth: 860 }}>

          {/* ─── STEP 0: Basic Info ─────────────────────────────────────────── */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>
                <Globe size={18} style={{ marginRight: 8, color: 'var(--clr-primary)' }} />
                Basic Information
              </h3>

              <div className="form-group">
                <label>Hackathon Title *</label>
                <input
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="e.g. InnoBytes Build Sprint 2026"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Describe the hackathon, its goals, and what participants will build..."
                  rows={5}
                  required
                />
              </div>

              <div className="form-group">
                <label>Banner Image URL</label>
                <input
                  value={form.banner}
                  onChange={e => set('banner', e.target.value)}
                  placeholder="https://your-image-url.com/banner.jpg"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><DollarSign size={13} style={{ marginRight: 4 }} />Entry Fee (₹)</label>
                  <input
                    type="number" min={0}
                    value={form.entryFee}
                    onChange={e => set('entryFee', e.target.value)}
                    placeholder="0 for free"
                  />
                  <div className="form-hint">Set to 0 for a free hackathon</div>
                </div>
                <div className="form-group">
                  <label><Users size={13} style={{ marginRight: 4 }} />Team Size</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="number" min={1} max={10} value={form.teamConfig.minSize}
                      onChange={e => setTeam('minSize', Number(e.target.value))}
                      placeholder="Min" style={{ flex: 1 }} />
                    <span className="text-muted">to</span>
                    <input type="number" min={1} max={10} value={form.teamConfig.maxSize}
                      onChange={e => setTeam('maxSize', Number(e.target.value))}
                      placeholder="Max" style={{ flex: 1 }} />
                  </div>
                  <div className="form-hint">Min and max members per team</div>
                </div>
              </div>

              <div className="form-group">
                <label>Eligible Colleges (leave empty = all colleges allowed)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={form.collegeInput}
                    onChange={e => set('collegeInput', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCollege())}
                    placeholder="Type college name and press Enter"
                  />
                  <button type="button" className="btn btn-outline btn-sm" onClick={addCollege}>
                    <Plus size={14} /> Add
                  </button>
                </div>
                {form.eligibleColleges.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    {form.eligibleColleges.map(c => (
                      <span key={c} className="tag active" onClick={() => removeCollege(c)}
                        style={{ cursor: 'pointer' }}>
                        {c} ✕
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── STEP 1: Timeline ───────────────────────────────────────────── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>
                <Calendar size={18} style={{ marginRight: 8, color: 'var(--clr-primary)' }} />
                Timeline & Deadlines
              </h3>

              <div style={{ padding: '14px 18px', background: 'var(--clr-primary-dim)', borderRadius: 'var(--r-sm)', border: '1px solid rgba(79,126,248,0.3)', fontSize: '0.875rem' }}>
                <strong>📋 Hackathon Structure (2.5 Days)</strong>
                <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20, color: 'var(--clr-text-2)', lineHeight: 1.8 }}>
                  <li>Registration closes on the date you set below</li>
                  <li>You manually click "Start Hackathon" when ready</li>
                  <li><strong>Phase 1 (24h):</strong> Teams submit PPT + Video + Proposed Solution</li>
                  <li><strong>Admin Reviews</strong> Phase 1 submissions → shortlist or reject</li>
                  <li><strong>Phase 2 (24h):</strong> Shortlisted teams build final solution → GitHub + video</li>
                  <li><strong>Interviews → Winner → Internship Offer</strong></li>
                </ul>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Registration Opens</label>
                  <input type="datetime-local"
                    value={form.timeline.registrationOpen}
                    onChange={e => setTimeline('registrationOpen', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Registration Closes *</label>
                  <input type="datetime-local"
                    value={form.timeline.registrationClose}
                    onChange={e => setTimeline('registrationClose', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ padding: '12px 16px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 'var(--r-sm)', fontSize: '0.85rem', color: 'var(--clr-text-2)' }}>
                ✅ Phase 1 and Phase 2 deadlines are automatically set at <strong>24h</strong> and <strong>48h</strong> from when you click "Start Hackathon".
              </div>
            </div>
          )}

          {/* ─── STEP 2: Problem Statements ─────────────────────────────────── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  <BookOpen size={18} style={{ marginRight: 8, color: 'var(--clr-primary)' }} />
                  Problem Statements
                  <span className="badge badge-blue" style={{ marginLeft: 10 }}>{form.problemStatements.length}/6</span>
                </h3>
                <button className="btn btn-outline btn-sm" onClick={addPS} disabled={form.problemStatements.length >= 6}>
                  <Plus size={14} /> Add Problem
                </button>
              </div>

              {form.problemStatements.map((ps, i) => (
                <div key={i} style={{ padding: 20, background: 'var(--clr-surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--clr-text-3)' }}>Problem {i + 1}</span>
                    {form.problemStatements.length > 1 && (
                      <button className="btn btn-ghost btn-icon btn-xs" onClick={() => removePS(i)}
                        style={{ color: 'var(--clr-danger)' }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="form-group">
                      <label>Title *</label>
                      <input value={ps.title} onChange={e => setPS(i, 'title', e.target.value)}
                        placeholder="e.g. Build an AI-powered Resume Screener" />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea rows={3} value={ps.description}
                        onChange={e => setPS(i, 'description', e.target.value)}
                        placeholder="Detailed problem description, constraints, expected output..." />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Domain / Category</label>
                        <input value={ps.domain} onChange={e => setPS(i, 'domain', e.target.value)}
                          placeholder="e.g. AI/ML, Web Dev, IoT" />
                      </div>
                      <div className="form-group">
                        <label>Difficulty</label>
                        <select value={ps.difficulty} onChange={e => setPS(i, 'difficulty', e.target.value)}>
                          <option value="EASY">Easy</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HARD">Hard</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── STEP 3: Review & Publish ────────────────────────────────────── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                <Eye size={18} style={{ marginRight: 8, color: 'var(--clr-primary)' }} />
                Review & Publish
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Title', value: form.title },
                  { label: 'Entry Fee', value: form.entryFee === 0 ? 'Free' : `₹${form.entryFee}` },
                  { label: 'Team Size', value: `${form.teamConfig.minSize}–${form.teamConfig.maxSize} members` },
                  { label: 'Registration Closes', value: form.timeline.registrationClose ? new Date(form.timeline.registrationClose).toLocaleString('en-IN') : '—' },
                  { label: 'Eligible Colleges', value: form.eligibleColleges.length > 0 ? form.eligibleColleges.join(', ') : 'All colleges' },
                  { label: 'Problem Statements', value: `${form.problemStatements.filter(p => p.title.trim()).length} defined` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: '12px 16px', background: 'var(--clr-surface-2)', borderRadius: 'var(--r-sm)', border: '1px solid var(--clr-border)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--clr-text-3)', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '14px 18px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 'var(--r-sm)', fontSize: '0.875rem' }}>
                ⚡ <strong>Publish</strong> makes the hackathon visible to students immediately. You can also save as Draft and publish later.
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button className="btn btn-outline" onClick={() => handleSubmit(false)} disabled={loading}>
                  💾 Save as Draft
                </button>
                <button className="btn btn-primary" onClick={() => handleSubmit(true)} disabled={loading}>
                  {loading ? <span className="spinner" style={{ borderTopColor: '#fff' }} /> : '🚀 Publish Now'}
                </button>
              </div>
            </div>
          )}

          {/* ─── Navigation ─────────────────────────────────────────────────── */}
          {step < 3 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
              <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
                <ChevronLeft size={16} /> Back
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setStep(s => s + 1)}
                disabled={!canAdvance()}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
