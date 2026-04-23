import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CompanyLayout from '../../layouts/CompanyLayout';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Code2, Calendar, IndianRupee, Users, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

const STEPS = ['Basic Info', 'Timeline & Prizes', 'Review & Submit'];

export default function CompanyCreateHackathon() {
  const navigate = useNavigate();
  const [step, setStep]         = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  const [form, setForm] = useState({
    title:         '',
    tagline:       '',
    description:   '',
    theme:         '',
    category:      'General',
    maxTeamSize:   4,
    minTeamSize:   1,
    entryFee:      0,
    prizePool:     '',
    firstPrize:    '',
    secondPrize:   '',
    thirdPrize:    '',
    registrationStart: '',
    registrationEnd:   '',
    hackathonDate:     '',
    contactEmail:  '',
    website:       '',
    tags:          '',
  });

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
    if (!form.title || !form.description) return toast.error('Title and description are required');
    setSubmitting(true);
    try {
      const payload = {
        title:       form.title,
        description: form.description,
        tagline:     form.tagline,
        theme:       form.theme,
        category:    form.category,
        entryFee:    Number(form.entryFee) || 0,
        prizes: {
          pool:   form.prizePool,
          first:  form.firstPrize,
          second: form.secondPrize,
          third:  form.thirdPrize,
        },
        teamConfig: {
          minSize: Number(form.minTeamSize),
          maxSize: Number(form.maxTeamSize),
        },
        timeline: {
          registrationStart: form.registrationStart || null,
          registrationEnd:   form.registrationEnd   || null,
          hackathonStart:    form.hackathonDate      || null,
        },
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
        contactEmail: form.contactEmail,
        website:      form.website,
      };
      await api.post('/hackathons/company/new', payload);
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  if (submitted) return (
    <CompanyLayout>
      <div className="page" style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ marginTop: 60 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(52,211,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle2 size={40} style={{ color: 'var(--clr-success)' }} />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 12 }}>Hackathon Submitted! 🎉</h1>
          <p className="text-muted" style={{ marginBottom: 24, lineHeight: 1.7 }}>
            Your hackathon proposal has been submitted for <strong>Super Admin review</strong>. Once approved, it will be published on the platform. You'll receive a notification within 24–48 hours.
          </p>
          <div style={{ padding: '16px 20px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--r-sm)', marginBottom: 28, textAlign: 'left' }}>
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.9rem' }}>📋 Review Process</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['Proposal submitted (now)', 'Admin reviews content & compliance', 'Admin publishes on platform', 'Registration opens for students'].map((s, i) => (
                <li key={i} style={{ display: 'flex', gap: 10, fontSize: '0.85rem', color: 'var(--clr-text-2)' }}>
                  <span style={{ color: i === 0 ? 'var(--clr-success)' : 'var(--clr-text-3)', fontWeight: 700 }}>{i + 1}.</span> {s}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-outline" onClick={() => navigate('/company/hackathons')}>View My Hackathons</button>
            <button className="btn btn-primary" onClick={() => { setSubmitted(false); setStep(0); setForm({ title: '', tagline: '', description: '', theme: '', category: 'General', maxTeamSize: 4, minTeamSize: 1, entryFee: 0, prizePool: '', firstPrize: '', secondPrize: '', thirdPrize: '', registrationStart: '', registrationEnd: '', hackathonDate: '', contactEmail: '', website: '', tags: '' }); }}>
              Submit Another
            </button>
          </div>
        </div>
      </div>
    </CompanyLayout>
  );

  return (
    <CompanyLayout>
      <div className="page" style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className="page-header">
          <h1>Host a Hackathon</h1>
          <p className="text-muted">Propose a hackathon. After admin approval it goes live on the platform.</p>
        </div>

        {/* Hosting Fee Notice */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 18px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--r-sm)', marginBottom: 28 }}>
          <IndianRupee size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>Hackathon Hosting Fee: ₹9,999</div>
            <p className="text-sm text-muted">This one-time fee covers platform infrastructure, registration management, leaderboard, and participant communications. Payment collected after admin approval.</p>
          </div>
        </div>

        {/* Step Progress */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 32 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem',
                  background: i <= step ? 'var(--clr-primary)' : 'var(--clr-surface-2)',
                  color: i <= step ? '#fff' : 'var(--clr-text-3)',
                  transition: 'all 0.2s',
                }}>{i + 1}</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: i === step ? 'var(--clr-primary)' : 'var(--clr-text-3)', whiteSpace: 'nowrap' }}>{s}</div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: i < step ? 'var(--clr-primary)' : 'var(--clr-border)', marginBottom: 22, transition: 'background 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 28 }}>
          {/* Step 0: Basic Info */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Basic Information</h3>
              <div className="form-group">
                <label>Hackathon Title *</label>
                <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g., InnoHack 2025 — Build for Bharat" />
              </div>
              <div className="form-group">
                <label>Tagline</label>
                <input type="text" value={form.tagline} onChange={e => set('tagline', e.target.value)} placeholder="e.g., 48 hours to change the world" />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the hackathon, its goals, and what participants will build..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Theme / Domain</label>
                  <input type="text" value={form.theme} onChange={e => set('theme', e.target.value)} placeholder="e.g., FinTech, HealthTech, AI/ML" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={e => set('category', e.target.value)}>
                    {['General', 'Domain-Specific', 'Open Innovation', 'Social Impact'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Min Team Size</label>
                  <input type="number" min={1} max={4} value={form.minTeamSize} onChange={e => set('minTeamSize', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Max Team Size</label>
                  <input type="number" min={1} max={6} value={form.maxTeamSize} onChange={e => set('maxTeamSize', e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Entry Fee (₹) — 0 for free</label>
                  <input type="number" min={0} step={100} value={form.entryFee} onChange={e => set('entryFee', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Contact Email</label>
                  <input type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} placeholder="hackathon@yourcompany.com" />
                </div>
              </div>
              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input type="text" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="AI, Web3, Sustainability, Hackathon" />
              </div>
            </div>
          )}

          {/* Step 1: Timeline & Prizes */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Timeline & Prizes</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Registration Opens</label>
                  <input type="date" value={form.registrationStart} onChange={e => set('registrationStart', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Registration Closes</label>
                  <input type="date" value={form.registrationEnd} onChange={e => set('registrationEnd', e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Hackathon Date</label>
                  <input type="date" value={form.hackathonDate} onChange={e => set('hackathonDate', e.target.value)} />
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 16 }}>
                <h4 style={{ fontWeight: 700, marginBottom: 14, fontSize: '0.95rem' }}>🏆 Prize Structure</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label>Total Prize Pool</label>
                    <input type="text" value={form.prizePool} onChange={e => set('prizePool', e.target.value)} placeholder="e.g., ₹1,00,000" />
                  </div>
                  <div className="form-group">
                    <label>1st Prize 🥇</label>
                    <input type="text" value={form.firstPrize} onChange={e => set('firstPrize', e.target.value)} placeholder="e.g., ₹50,000 + Internship" />
                  </div>
                  <div className="form-group">
                    <label>2nd Prize 🥈</label>
                    <input type="text" value={form.secondPrize} onChange={e => set('secondPrize', e.target.value)} placeholder="e.g., ₹30,000" />
                  </div>
                  <div className="form-group">
                    <label>3rd Prize 🥉</label>
                    <input type="text" value={form.thirdPrize} onChange={e => set('thirdPrize', e.target.value)} placeholder="e.g., ₹20,000" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: 18 }}>Review Your Submission</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Title', value: form.title },
                  { label: 'Tagline', value: form.tagline || '—' },
                  { label: 'Theme', value: form.theme || '—' },
                  { label: 'Team Size', value: `${form.minTeamSize}–${form.maxTeamSize} members` },
                  { label: 'Entry Fee', value: form.entryFee > 0 ? `₹${Number(form.entryFee).toLocaleString()}` : 'Free' },
                  { label: 'Prize Pool', value: form.prizePool || '—' },
                  { label: 'Hackathon Date', value: form.hackathonDate || '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--clr-border)', fontSize: '0.9rem' }}>
                    <span className="text-muted">{label}</span>
                    <span style={{ fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8 }}>
                <p className="text-sm" style={{ color: '#f59e0b' }}>
                  ⚠️ Your hackathon will be in <strong>DRAFT</strong> status until the Super Admin reviews and publishes it.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--clr-border)' }}>
            <button className="btn btn-ghost" onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/company/hackathons')} disabled={submitting}>
              {step === 0 ? 'Cancel' : '← Back'}
            </button>
            {step < STEPS.length - 1 ? (
              <button className="btn btn-primary" onClick={() => { if (step === 0 && !form.title) return toast.error('Please add a title'); setStep(s => s + 1); }}>
                Next →
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ gap: 8 }}>
                {submitting ? <span className="spinner" /> : '🚀 Submit for Review'}
              </button>
            )}
          </div>
        </div>
      </div>
    </CompanyLayout>
  );
}
