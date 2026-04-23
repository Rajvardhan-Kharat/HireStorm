import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { Mail, Lock, User, ArrowRight, GraduationCap, Building2 } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', password:'', role:'STUDENT' });
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const passwordStrength = (p) => {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strength = passwordStrength(form.password);
  const strengthColor = ['','var(--clr-danger)','var(--clr-warning)','var(--clr-primary)','var(--clr-success)'][strength];
  const strengthLabel = ['','Weak','Fair','Good','Strong'][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await register(form);
    if (res.success) {
      toast.success('Account created! Check your email to verify.');
      navigate('/login');
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="auth-page">
      {/* Brand Panel */}
      <div className="auth-brand">
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:40 }}>
            <div style={{
              width:40, height:40,
              background:'linear-gradient(135deg,var(--clr-primary),var(--clr-accent))',
              borderRadius:'var(--r-sm)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:20
            }}>⚡</div>
            <span style={{ fontSize:'1.15rem', fontWeight:800, letterSpacing:'-0.02em' }}>HireStorm</span>
          </div>

          <h1 style={{ fontSize:'2.2rem', fontWeight:900, letterSpacing:'-0.04em', lineHeight:1.15, marginBottom:16 }}>
            Your next career<br/>
            <span style={{ background:'linear-gradient(90deg,var(--clr-accent),var(--clr-primary))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              starts here
            </span>
          </h1>
          <p style={{ color:'var(--clr-text-2)', fontSize:'0.95rem', lineHeight:1.7, marginBottom:36 }}>
            Join thousands of students and companies on India's fastest-growing internship platform.
          </p>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[
              { n:'500+', l:'Active Listings' },
              { n:'200+', l:'Verified Companies' },
              { n:'90',   l:'Day ILM Program' },
              { n:'4.8★', l:'Student Rating' },
            ].map(({ n,l }) => (
              <div key={l} style={{ padding:'14px 16px', background:'var(--clr-surface-2)', borderRadius:'var(--r-sm)', border:'1px solid var(--clr-border)' }}>
                <div style={{ fontSize:'1.4rem', fontWeight:900, color:'var(--clr-primary)', letterSpacing:'-0.03em' }}>{n}</div>
                <div style={{ fontSize:'0.75rem', color:'var(--clr-text-3)', marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="auth-form-side">
        <div className="auth-form-card animate-fade-up">
          <h2 style={{ fontSize:'1.5rem', fontWeight:800, letterSpacing:'-0.03em', marginBottom:6 }}>Create your account</h2>
          <p className="text-muted text-sm" style={{ marginBottom:28 }}>Free forever. Upgrade anytime.</p>

          {/* Role Toggle */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:24 }}>
            {[
              { val:'STUDENT',       label:'Student / Fresher', icon:<GraduationCap size={16}/> },
              { val:'COMPANY_ADMIN', label:'Employer / Company', icon:<Building2 size={16}/> },
            ].map(({ val, label, icon }) => (
              <button
                key={val}
                type="button"
                onClick={() => set('role', val)}
                style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'11px 14px',
                  borderRadius:'var(--r-sm)',
                  border: form.role === val ? '1.5px solid var(--clr-primary)' : '1.5px solid var(--clr-border)',
                  background: form.role === val ? 'var(--clr-primary-dim)' : 'var(--clr-surface-2)',
                  color: form.role === val ? 'var(--clr-primary)' : 'var(--clr-text-2)',
                  cursor:'pointer', fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:600,
                  transition:'all 0.15s'
                }}
              >
                {icon}{label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <div className="input-with-icon">
                  <User size={14}/>
                  <input value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="John" required/>
                </div>
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Doe" required/>
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <Mail size={14}/>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" required/>
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <Lock size={14}/>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 8 characters" required minLength={8}/>
              </div>
              {form.password && (
                <div style={{ marginTop:6 }}>
                  <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex:1, height:3, borderRadius:99, background: i <= strength ? strengthColor : 'var(--clr-surface-3)', transition:'background 0.3s' }}/>
                    ))}
                  </div>
                  <div style={{ fontSize:'0.72rem', color: strengthColor, fontWeight:600 }}>{strengthLabel}</div>
                </div>
              )}
            </div>

            <button className="btn btn-primary btn-lg w-full" type="submit" disabled={isLoading} style={{ marginTop:6 }}>
              {isLoading ? <span className="spinner" style={{ borderTopColor:'#fff' }}/> : (
                <><span>Create Account</span><ArrowRight size={16}/></>
              )}
            </button>
          </form>

          <div className="divider" style={{ margin:'24px 0' }}/>
          <p className="text-sm text-muted" style={{ textAlign:'center' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight:600 }}>Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
