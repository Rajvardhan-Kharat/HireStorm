import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CompanyLayout from '../../layouts/CompanyLayout';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, X, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

const STEPS = ['Basic Info', 'Requirements', 'Perks & Deadline'];
const DOMAINS = ['Web Dev','Data Science','UI/UX','Mobile','AI/ML','DevOps','Blockchain','Cybersecurity','Marketing','Finance'];

export default function CreateListing() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newPerk, setNewPerk] = useState('');
  const [form, setForm] = useState({
    title:'', type:'INTERNSHIP', domain:'', location:'', isRemote:false,
    description:'', duration:'', openings:1,
    skillsRequired:[], perks:[],
    stipend:{ amount:0, period:'month' },
    applicationDeadline:'',
    status:'ACTIVE',
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
      await api.post('/listings', form);
      toast.success('Listing created! 🎉');
      navigate('/company/listings');
    } catch (err) { toast.error(err.response?.data?.message || 'Could not create listing'); }
    finally { setSubmitting(false); }
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
          {/* Step 0 */}
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

          {/* Step 1 */}
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

          {/* Step 2 */}
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

          {/* Navigation */}
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:28, paddingTop:20, borderTop:'1px solid var(--clr-border)' }}>
            <button className="btn btn-ghost" onClick={() => step > 0 ? setStep(s => s-1) : navigate('/company/listings')} style={{ gap:6 }}>
              <ArrowLeft size={14}/> {step === 0 ? 'Cancel' : 'Back'}
            </button>
            {step < STEPS.length - 1 ? (
              <button
                className="btn btn-primary"
                onClick={() => setStep(s => s+1)}
                disabled={step===0 && !isStep0Valid}
                style={{ gap:6 }}
              >
                Next <ArrowRight size={14}/>
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ gap:6 }}>
                {submitting ? <span className="spinner"/> : <><CheckCircle2 size={14}/> Publish Listing</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </CompanyLayout>
  );
}
