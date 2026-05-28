import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CompanyLayout from '../../layouts/CompanyLayout';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, X, ArrowRight, ArrowLeft, CheckCircle2, CreditCard, Zap, Star, Lock } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const STEPS = ['Basic Info', 'Requirements', 'Perks & Deadline', 'Payment'];
const DOMAINS = ['Web Dev','Data Science','UI/UX','Mobile','AI/ML','DevOps','Blockchain','Cybersecurity','Marketing','Finance'];

/* ── Listing plans ─────────────────────────────────────────────────────────── */
const PLANS = [
  {
    id: 'basic',
    label: 'Basic Listing',
    price: 0,
    desc: 'Post and go live — standard visibility',
    features: ['Listed for 30 days', 'Standard placement', 'Basic analytics'],
    type: null, // no transaction needed
    color: '#6b7280',
  },
  {
    id: 'pinned',
    label: 'Pinned / Boosted',
    price: 499,
    desc: 'Top of search results for 30 days',
    features: ['Pinned at top of listings', 'Priority in search', 'Full analytics dashboard', '3× more applicants on avg'],
    type: 'LISTING_PIN',
    color: '#4f7ef8',
    badge: 'POPULAR',
  },
  {
    id: 'pro',
    label: 'PRO-Only Listing',
    price: 999,
    desc: 'Exclusively visible to PRO students — higher quality applicants',
    features: ['PRO-student audience only', 'Verified candidate profiles', 'ATS screening included', 'Priority support'],
    type: 'LISTING_PIN',
    color: '#a78bfa',
    badge: 'PREMIUM',
  },
];

export default function CreateListing() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newPerk, setNewPerk] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);
  const [form, setForm] = useState({
    title:'', type:'INTERNSHIP', domain:'', location:'', isRemote:false,
    description:'', duration:'', openings:1,
    skillsRequired:[], perks:[],
    stipend:{ amount:0, period:'month' },
    applicationDeadline:'',
    status:'ACTIVE',
    isPinned: false,
    visibility: 'PUBLIC',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !form.skillsRequired.includes(s)) { set('skillsRequired', [...form.skillsRequired, s]); setNewSkill(''); }
  };
  const addPerk = () => {
    const p = newPerk.trim();
    if (p && !form.perks.includes(p)) { set('perks', [...form.perks, p]); setNewPerk(''); }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        isPinned:   selectedPlan.id !== 'basic',
        visibility: selectedPlan.id === 'pro' ? 'PRO_ONLY' : 'PUBLIC',
      };

      // 1. Create listing
      const res = await api.post('/listings', payload);
      const listingId = res.data?.data?._id;

      // 2. Record payment transaction if paid plan
      if (selectedPlan.price > 0 && selectedPlan.type) {
        await api.post('/payments/create-order', {
          type: selectedPlan.type,
          amount: selectedPlan.price,
          metadata: { listingId, plan: selectedPlan.id, listingTitle: form.title },
        });
      }

      toast.success(`Listing published! ${selectedPlan.price > 0 ? '💳 Payment recorded.' : '🎉'}`);
      navigate('/company/listings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create listing');
    } finally {
      setSubmitting(false);
    }
  };

  const isStep0Valid = form.title && form.type && form.description;
  const isStep1Valid = form.skillsRequired.length > 0;

  return (
    <CompanyLayout>
      <div className="page page-sm">
        <div className="page-header">
          <h1>Post a New Listing</h1>
          <p className="text-muted">Reach thousands of qualified students and freshers</p>
        </div>

        {/* Steps */}
        <div className="steps" style={{ marginBottom:32 }}>
          {STEPS.map((s, i) => (
            <>
              <div key={s} className={`step ${i < step ? 'done' : i === step ? 'active' : ''}`}>
                <div className="step-num">{i < step ? '✓' : i + 1}</div>
                <span className="step-label">{s}</span>
              </div>
              {i < STEPS.length - 1 && <div key={`sep-${i}`} className="step-connector"/>}
            </>
          ))}
        </div>

        <div className="card animate-fade-up">
          {/* Step 0 — Basic Info */}
          {step === 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <h3 style={{ fontWeight:700, marginBottom:4 }}>Basic Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Job Title *</label>
                  <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. Frontend Developer Intern"/>
                </div>
                <div className="form-group">
                  <label>Type *</label>
                  <select value={form.type} onChange={e=>set('type',e.target.value)}>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="JOB">Full Time Job</option>
                    <option value="PART_TIME">Part Time</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Domain</label>
                  <select value={form.domain} onChange={e=>set('domain',e.target.value)}>
                    <option value="">Select domain</option>
                    {DOMAINS.map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Duration</label>
                  <input value={form.duration} onChange={e=>set('duration',e.target.value)} placeholder="e.g. 3 months, 6 months"/>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input value={form.location} onChange={e=>set('location',e.target.value)} placeholder="e.g. Bangalore, Mumbai"/>
                </div>
                <div className="form-group">
                  <label>Openings</label>
                  <input type="number" min={1} value={form.openings} onChange={e=>set('openings',+e.target.value)}/>
                </div>
              </div>
              <div className="form-group">
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', userSelect:'none' }}>
                  <input type="checkbox" style={{ width:'auto' }} checked={form.isRemote} onChange={e=>set('isRemote',e.target.checked)}/>
                  <span>This is a remote position</span>
                </label>
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea rows={6} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Describe the role, responsibilities, growth opportunities..."/>
                <div className="form-hint">{form.description.length} characters</div>
              </div>
            </div>
          )}

          {/* Step 1 — Requirements */}
          {step === 1 && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <h3 style={{ fontWeight:700, marginBottom:4 }}>Requirements</h3>
              <div className="form-group">
                <label>Required Skills *</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
                  {form.skillsRequired.map(s => (
                    <span key={s} className="chip" style={{ gap:6 }}>{s}
                      <button onClick={()=>set('skillsRequired',form.skillsRequired.filter(x=>x!==s))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--clr-text-3)', padding:0 }}><X size={12}/></button>
                    </span>
                  ))}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <input value={newSkill} onChange={e=>setNewSkill(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addSkill()} placeholder="e.g. React, Python, Figma"/>
                  <button className="btn btn-outline btn-sm" onClick={addSkill} type="button"><Plus size={13}/></button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Perks & Deadline */}
          {step === 2 && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <h3 style={{ fontWeight:700, marginBottom:4 }}>Perks & Deadline</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Stipend Amount (₹)</label>
                  <input type="number" min={0} value={form.stipend.amount} onChange={e=>set('stipend',{...form.stipend,amount:+e.target.value})} placeholder="0 for unpaid"/>
                </div>
                <div className="form-group">
                  <label>Per</label>
                  <select value={form.stipend.period} onChange={e=>set('stipend',{...form.stipend,period:e.target.value})}>
                    <option value="month">Month</option>
                    <option value="week">Week</option>
                    <option value="project">Project</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Application Deadline</label>
                <input type="date" value={form.applicationDeadline} onChange={e=>set('applicationDeadline',e.target.value)} min={new Date().toISOString().split('T')[0]}/>
              </div>
              <div className="form-group">
                <label>Perks & Benefits</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
                  {form.perks.map(p=>(
                    <span key={p} className="chip" style={{ gap:6 }}>{p}
                      <button onClick={()=>set('perks',form.perks.filter(x=>x!==p))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--clr-text-3)', padding:0 }}><X size={12}/></button>
                    </span>
                  ))}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <input value={newPerk} onChange={e=>setNewPerk(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addPerk()} placeholder="e.g. Certificate, Letter of Recommendation, PPO"/>
                  <button className="btn btn-outline btn-sm" onClick={addPerk} type="button"><Plus size={13}/></button>
                </div>
              </div>
              {/* Summary */}
              <div style={{ padding:'16px', background:'var(--clr-surface-2)', borderRadius:'var(--r-sm)', marginTop:4 }}>
                <div style={{ fontWeight:700, marginBottom:10, fontSize:'0.85rem' }}>Review Summary</div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }} className="text-sm text-muted">
                  <div>📋 <strong>{form.title}</strong> · {form.type}</div>
                  <div>📍 {form.isRemote ? '🌐 Remote' : form.location || 'On-site'}</div>
                  <div>⏱ {form.duration || 'Duration not specified'}</div>
                  <div>💰 {form.stipend.amount > 0 ? `₹${form.stipend.amount}/${form.stipend.period}` : 'Unpaid'}</div>
                  <div>🛠 {form.skillsRequired.join(', ') || 'No skills listed'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Payment / Plan Selection */}
          {step === 3 && (
            <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
              <div>
                <h3 style={{ fontWeight:700, marginBottom:4 }}>Choose a Listing Plan</h3>
                <p className="text-muted text-sm">Basic listing is always free. Boost for better visibility.</p>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:16 }}>
                {PLANS.map(plan => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    style={{
                      border: `2px solid ${selectedPlan.id === plan.id ? plan.color : 'var(--clr-border)'}`,
                      borderRadius: 'var(--r-md)',
                      padding: '20px',
                      cursor: 'pointer',
                      background: selectedPlan.id === plan.id
                        ? `linear-gradient(135deg, ${plan.color}12, transparent)`
                        : 'var(--clr-surface)',
                      transition: 'all 0.2s',
                      position: 'relative',
                    }}
                  >
                    {plan.badge && (
                      <span style={{
                        position:'absolute', top:-10, right:12,
                        background: plan.color, color:'#fff',
                        fontSize:'0.6rem', fontWeight:800, padding:'2px 8px',
                        borderRadius:999, letterSpacing:'0.05em',
                      }}>{plan.badge}</span>
                    )}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                      <div>
                        <div style={{ fontWeight:700, marginBottom:2 }}>{plan.label}</div>
                        <div className="text-xs text-muted">{plan.desc}</div>
                      </div>
                      <div style={{
                        width:20, height:20, borderRadius:'50%',
                        border:`2px solid ${plan.color}`,
                        background: selectedPlan.id === plan.id ? plan.color : 'transparent',
                        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                      }}>
                        {selectedPlan.id === plan.id && <CheckCircle2 size={12} color="#fff"/>}
                      </div>
                    </div>
                    <div style={{ fontSize:'1.8rem', fontWeight:900, color: plan.color, marginBottom:12 }}>
                      {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                    </div>
                    <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:6 }}>
                      {plan.features.map(f => (
                        <li key={f} className="text-xs" style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <CheckCircle2 size={11} color={plan.color}/> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Order summary */}
              <div style={{
                padding:'18px 20px',
                background:'var(--clr-surface-2)',
                borderRadius:'var(--r-md)',
                border:'1px solid var(--clr-border)',
              }}>
                <div style={{ fontWeight:700, marginBottom:12 }}>Order Summary</div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }} className="text-sm">
                  <span className="text-muted">Listing: {form.title || '(untitled)'}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }} className="text-sm">
                  <span className="text-muted">Plan: {selectedPlan.label}</span>
                  <span style={{ fontWeight:700 }}>{selectedPlan.price > 0 ? `₹${selectedPlan.price}` : 'Free'}</span>
                </div>
                {selectedPlan.price > 0 && (
                  <div style={{ marginTop:12, padding:'10px 14px', background:'rgba(79,126,248,0.08)', borderRadius:8, fontSize:'0.78rem', color:'var(--clr-text-2)', display:'flex', gap:8 }}>
                    <Lock size={12} style={{ flexShrink:0, marginTop:1 }}/> 
                    Payment is recorded securely. Real payment gateway integration coming soon — for now it's simulated.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:28, paddingTop:20, borderTop:'1px solid var(--clr-border)' }}>
            <button className="btn btn-ghost" onClick={() => step > 0 ? setStep(s => s-1) : navigate('/company/listings')} style={{ gap:6 }}>
              <ArrowLeft size={14}/> {step === 0 ? 'Cancel' : 'Back'}
            </button>
            {step < STEPS.length - 1 ? (
              <button
                className="btn btn-primary"
                onClick={() => setStep(s => s+1)}
                disabled={step===0 && !isStep0Valid || step===1 && !isStep1Valid}
                style={{ gap:6 }}
              >
                Next <ArrowRight size={14}/>
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ gap:6 }}>
                {submitting
                  ? <span className="spinner"/>
                  : selectedPlan.price > 0
                    ? <><CreditCard size={14}/> Pay ₹{selectedPlan.price} & Publish</>
                    : <><CheckCircle2 size={14}/> Publish Listing</>
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </CompanyLayout>
  );
}
