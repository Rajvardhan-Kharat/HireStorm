import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CompanyLayout from '../../layouts/CompanyLayout';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  Plus, X, ArrowLeft, ArrowRight, CheckCircle2,
  BookOpen, CreditCard, Lock,
} from 'lucide-react';
import PaymentModal from '../../components/PaymentModal';

const STEPS = ['Course Details', 'Curriculum', 'Pricing & Payment'];

const CATEGORIES = ['Technical', 'Soft Skills', 'Design', 'Management'];

/* ── Platform listing fee plans ─────────────────────────────────────────────── */
const FEE_PLANS = [
  {
    id: 'basic',
    label: 'Basic Listing',
    platformFee: 0,
    desc: 'Submit for admin review — goes live after approval',
    features: ['Listed in catalogue', 'Standard placement', 'Reviewed within 48h'],
    color: '#6b7280',
  },
  {
    id: 'featured',
    label: 'Featured Course',
    platformFee: 1999,
    desc: 'Featured badge + top placement in course catalogue',
    features: ['⭐ Featured badge', 'Top of catalogue', 'Email blast to all students', 'Priority review (24h)'],
    color: '#4f7ef8',
    badge: 'POPULAR',
  },
  {
    id: 'premium',
    label: 'Premium Spotlight',
    platformFee: 4999,
    desc: 'Homepage spotlight for 30 days + notification to all users',
    features: ['🏆 Homepage spotlight', 'Push notification to students', 'Dedicated promo banner', 'Analytics dashboard', 'Priority review (12h)'],
    color: '#a78bfa',
    badge: 'BEST VALUE',
  },
];

export default function CompanyCreateCourse() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [feePlan, setFeePlan] = useState(FEE_PLANS[0]);
  const [showPayment, setShowPayment] = useState(false);
  const [pendingCourseId, setPendingCourseId] = useState(null);

  const [form, setForm] = useState({
    title: '',
    instructor: '',
    description: '',
    category: 'Technical',
    thumbnail: '',
    skills: [],
    // Curriculum — simplified (admins can expand later)
    modules: [{ title: '', lessons: [{ title: '', type: 'VIDEO', duration: '' }] }],
    // Course pricing for students
    price: 0,
    isFree: true,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  /* ── Skill helpers ─────────────────────────────────────────────── */
  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !form.skills.includes(s)) { set('skills', [...form.skills, s]); setNewSkill(''); }
  };

  /* ── Module helpers ────────────────────────────────────────────── */
  const addModule = () => set('modules', [...form.modules, { title: '', lessons: [{ title: '', type: 'VIDEO', duration: '' }] }]);
  const updateModule = (i, key, val) => {
    const m = [...form.modules];
    m[i] = { ...m[i], [key]: val };
    set('modules', m);
  };
  const addLesson = (mi) => {
    const m = [...form.modules];
    m[mi].lessons = [...(m[mi].lessons || []), { title: '', type: 'VIDEO', duration: '' }];
    set('modules', m);
  };
  const updateLesson = (mi, li, key, val) => {
    const m = [...form.modules];
    m[mi].lessons[li] = { ...m[mi].lessons[li], [key]: val };
    set('modules', m);
  };
  const removeModule = (i) => set('modules', form.modules.filter((_, idx) => idx !== i));
  const removeLesson = (mi, li) => {
    const m = [...form.modules];
    m[mi].lessons = m[mi].lessons.filter((_, idx) => idx !== li);
    set('modules', m);
  };

  /* ── Submit ────────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // 1. Create the course (starts as draft)
      const payload = {
        title:       form.title,
        instructor:  form.instructor,
        description: form.description,
        category:    form.category,
        thumbnail:   form.thumbnail || undefined,
        skills:      form.skills,
        modules:     form.modules.map((m, mi) => ({
          title:   m.title,
          order:   mi + 1,
          lessons: (m.lessons || []).map((l, li) => ({
            title:    l.title,
            type:     l.type,
            duration: l.duration,
            order:    li + 1,
          })),
        })),
        price:  form.isFree ? 0 : form.price,
        isFree: form.isFree,
      };

      const res = await api.post('/courses', payload);
      const courseId = res.data?.data?._id;

      // 2. Record platform fee transaction if paid plan
      if (feePlan.platformFee > 0) {
        setPendingCourseId(courseId);
        setShowPayment(true);
      } else {
        toast.success('🎉 Course submitted! Pending admin review.');
        navigate('/company/courses');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  const step0Valid = form.title && form.instructor && form.description;
  const step1Valid = form.modules.length > 0 && form.modules.every(m => m.title);

  return (
    <CompanyLayout>
      <div className="page page-sm">
        <div className="page-header">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen size={22}/> Create a New Course
          </h1>
          <p className="text-muted">Publish a course on HireStorm and monetize your expertise</p>
        </div>

        {/* Step indicator */}
        <div className="steps" style={{ marginBottom: 32 }}>
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

          {/* ── Step 0: Course Details ──────────────────────────────── */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h3 style={{ fontWeight: 700 }}>Course Details</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Course Title *</label>
                  <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Full Stack Web Development"/>
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select value={form.category} onChange={e => set('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Instructor Name *</label>
                <input value={form.instructor} onChange={e => set('instructor', e.target.value)} placeholder="e.g. Dr. Priya Krishnan"/>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea rows={5} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe what students will learn, prerequisites, outcomes..."/>
              </div>

              <div className="form-group">
                <label>Thumbnail URL <span className="text-muted">(optional)</span></label>
                <input value={form.thumbnail} onChange={e => set('thumbnail', e.target.value)} placeholder="https://..."/>
              </div>

              <div className="form-group">
                <label>Skills Covered</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  {form.skills.map(s => (
                    <span key={s} className="chip" style={{ gap: 6 }}>{s}
                      <button onClick={() => set('skills', form.skills.filter(x => x !== s))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--clr-text-3)' }}><X size={12}/></button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSkill()} placeholder="e.g. React, Python, Figma"/>
                  <button className="btn btn-outline btn-sm" onClick={addSkill} type="button"><Plus size={13}/></button>
                </div>
              </div>

              {/* Student pricing */}
              <div style={{ padding: 16, background: 'var(--clr-surface-2)', borderRadius: 'var(--r-sm)' }}>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>Student Pricing</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 10 }}>
                  <input type="checkbox" style={{ width: 'auto' }} checked={form.isFree} onChange={e => set('isFree', e.target.checked)}/>
                  <span className="text-sm">Offer this course for Free</span>
                </label>
                {!form.isFree && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Course Price (₹)</label>
                    <input type="number" min={1} value={form.price} onChange={e => set('price', +e.target.value)} placeholder="e.g. 2999"/>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 1: Curriculum ─────────────────────────────────── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 700 }}>Curriculum</h3>
                <button className="btn btn-outline btn-sm" onClick={addModule} style={{ gap: 6 }}>
                  <Plus size={13}/> Add Module
                </button>
              </div>

              {form.modules.map((mod, mi) => (
                <div key={mi} style={{ border: '1px solid var(--clr-border)', borderRadius: 'var(--r-md)', padding: 16 }}>
                  {/* Module header */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--clr-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>{mi + 1}</div>
                    <input
                      value={mod.title}
                      onChange={e => updateModule(mi, 'title', e.target.value)}
                      placeholder={`Module ${mi + 1} title, e.g. Introduction to React`}
                      style={{ flex: 1 }}
                    />
                    {form.modules.length > 1 && (
                      <button onClick={() => removeModule(mi)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-error)' }}><X size={16}/></button>
                    )}
                  </div>

                  {/* Lessons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginLeft: 38 }}>
                    {(mod.lessons || []).map((les, li) => (
                      <div key={li} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input value={les.title} onChange={e => updateLesson(mi, li, 'title', e.target.value)} placeholder={`Lesson ${li + 1} title`} style={{ flex: 2 }}/>
                        <select value={les.type} onChange={e => updateLesson(mi, li, 'type', e.target.value)} style={{ flex: 1 }}>
                          <option value="VIDEO">Video</option>
                          <option value="READING">Reading</option>
                          <option value="QUIZ">Quiz</option>
                          <option value="ASSIGNMENT">Assignment</option>
                        </select>
                        <input value={les.duration} onChange={e => updateLesson(mi, li, 'duration', e.target.value)} placeholder="e.g. 12 min" style={{ flex: 1 }}/>
                        {mod.lessons.length > 1 && (
                          <button onClick={() => removeLesson(mi, li)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-error)' }}><X size={13}/></button>
                        )}
                      </div>
                    ))}
                    <button className="btn btn-ghost btn-sm" onClick={() => addLesson(mi)} style={{ alignSelf: 'flex-start', gap: 6 }}>
                      <Plus size={12}/> Add Lesson
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Step 2: Pricing & Payment ──────────────────────────── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Platform Listing Fee</h3>
                <p className="text-muted text-sm">Choose how prominently HireStorm should feature your course.</p>
              </div>

              {/* Fee plan cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {FEE_PLANS.map(plan => (
                  <div
                    key={plan.id}
                    onClick={() => setFeePlan(plan)}
                    style={{
                      border: `2px solid ${feePlan.id === plan.id ? plan.color : 'var(--clr-border)'}`,
                      borderRadius: 'var(--r-md)', padding: 20, cursor: 'pointer',
                      background: feePlan.id === plan.id
                        ? `linear-gradient(135deg, ${plan.color}14, transparent)`
                        : 'var(--clr-surface)',
                      transition: 'all 0.2s', position: 'relative',
                    }}
                  >
                    {plan.badge && (
                      <span style={{
                        position: 'absolute', top: -10, right: 12,
                        background: plan.color, color: '#fff',
                        fontSize: '0.6rem', fontWeight: 800, padding: '2px 8px',
                        borderRadius: 999,
                      }}>{plan.badge}</span>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: 2 }}>{plan.label}</div>
                        <div className="text-xs text-muted">{plan.desc}</div>
                      </div>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        border: `2px solid ${plan.color}`,
                        background: feePlan.id === plan.id ? plan.color : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {feePlan.id === plan.id && <CheckCircle2 size={12} color="#fff"/>}
                      </div>
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: plan.color, marginBottom: 12 }}>
                      {plan.platformFee === 0 ? 'Free' : `₹${plan.platformFee.toLocaleString('en-IN')}`}
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {plan.features.map(f => (
                        <li key={f} className="text-xs" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle2 size={11} color={plan.color}/> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Order summary */}
              <div style={{ padding: '18px 20px', background: 'var(--clr-surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)' }}>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>Order Summary</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} className="text-sm">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Course: {form.title || '(untitled)'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Student Price:</span>
                    <span>{form.isFree ? 'Free' : `₹${form.price}`}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--clr-border)', fontWeight: 700 }}>
                    <span>Platform Listing Fee:</span>
                    <span style={{ color: feePlan.platformFee > 0 ? 'var(--clr-primary)' : 'var(--clr-success)' }}>
                      {feePlan.platformFee > 0 ? `₹${feePlan.platformFee.toLocaleString('en-IN')}` : 'Free'}
                    </span>
                  </div>
                </div>
                {feePlan.platformFee > 0 && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(79,126,248,0.08)', borderRadius: 8, fontSize: '0.78rem', color: 'var(--clr-text-2)', display: 'flex', gap: 8 }}>
                    <Lock size={12} style={{ flexShrink: 0, marginTop: 1 }}/>
                    Payment is simulated — real gateway coming soon. Your course goes to admin review after submission.
                  </div>
                )}
                {feePlan.platformFee === 0 && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(34,197,94,0.08)', borderRadius: 8, fontSize: '0.78rem', color: 'var(--clr-text-2)', display: 'flex', gap: 8 }}>
                    <CheckCircle2 size={12} style={{ flexShrink: 0, marginTop: 1 }}/>
                    Your course will be reviewed by the HireStorm team within 48 hours before going live.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Navigation ─────────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--clr-border)' }}>
            <button className="btn btn-ghost" onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/company/courses')} style={{ gap: 6 }}>
              <ArrowLeft size={14}/> {step === 0 ? 'Cancel' : 'Back'}
            </button>
            {step < STEPS.length - 1 ? (
              <button
                className="btn btn-primary"
                onClick={() => setStep(s => s + 1)}
                disabled={(step === 0 && !step0Valid) || (step === 1 && !step1Valid)}
                style={{ gap: 6 }}
              >
                Next <ArrowRight size={14}/>
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ gap: 6 }}>
                {submitting
                  ? <span className="spinner"/>
                  : feePlan.platformFee > 0
                    ? <><CreditCard size={14}/> Proceed to Pay ₹{feePlan.platformFee.toLocaleString('en-IN')}</>
                    : <><CheckCircle2 size={14}/> Submit Course</>
                }
              </button>
            )}
          </div>
        </div>
      </div>

      <PaymentModal
        open={showPayment}
        amount={feePlan.platformFee}
        description={`${feePlan.label} — Course Platform Fee`}
        itemName={form.title || 'New Course'}
        type="COURSE_PURCHASE"
        metadata={{ plan: feePlan.id, courseId: pendingCourseId }}
        onSuccess={() => {
          setShowPayment(false);
          toast.success('🎉 Payment done! Course submitted for review.');
          navigate('/company/courses');
        }}
        onClose={() => {
          setShowPayment(false);
          toast('Course submitted (no boost). Admin will review.', { icon: 'ℹ️' });
          navigate('/company/courses');
        }}
      />
    </CompanyLayout>
  );
}
