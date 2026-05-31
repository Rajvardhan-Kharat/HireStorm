import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowRight, CheckCircle2, GraduationCap, MailWarning, RefreshCw } from 'lucide-react';

const features = [
  'Browse 500+ internships & jobs',
  'AI-powered profile matching',
  '90-day internship lifecycle program',
  'Verified company network',
  'Real-time application tracking',
];

export default function Login() {
  const [form, setForm]                   = useState({ email: '', password: '' });
  const [unverifiedEmail, setUnverifiedEmail] = useState(null); // email that failed due to unverified
  const [resending, setResending]         = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0); // seconds remaining
  const { login, resendVerification, isLoading } = useAuthStore();
  const navigate = useNavigate();

  /* ── countdown ticker ── */
  const startCooldown = (seconds = 60) => {
    setResendCooldown(seconds);
    const id = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUnverifiedEmail(null);
    const res = await login(form.email, form.password);
    if (res.success) {
      const role = useAuthStore.getState().user?.role;
      if (['PLATFORM_ADMIN', 'SUPER_ADMIN'].includes(role)) navigate('/admin/dashboard');
      else if (['COMPANY_ADMIN', 'COMPANY_HR'].includes(role)) navigate('/company/dashboard');
      else navigate('/dashboard');
    } else if (res.emailUnverified) {
      setUnverifiedEmail(form.email);   // show the banner, not a toast
    } else {
      toast.error(res.message);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    const res = await resendVerification(unverifiedEmail);
    setResending(false);
    if (res.success) {
      toast.success(res.message || 'Verification email sent!');
      startCooldown(60);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="auth-page">
      {/* Left – Brand Panel */}
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

          <h1 style={{ fontSize:'2.4rem', fontWeight:900, letterSpacing:'-0.04em', lineHeight:1.15, marginBottom:16 }}>
            Launch your<br />
            <span style={{ background:'linear-gradient(90deg,var(--clr-primary),var(--clr-accent))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              tech career
            </span>
          </h1>
          <p style={{ color:'var(--clr-text-2)', fontSize:'1rem', lineHeight:1.7, marginBottom:36, maxWidth:380 }}>
            India's most comprehensive internship platform — from application to certification.
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {features.map(f => (
              <div key={f} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <CheckCircle2 size={16} style={{ color:'var(--clr-success)', flexShrink:0 }}/>
                <span style={{ fontSize:'0.9rem', color:'var(--clr-text-2)' }}>{f}</span>
              </div>
            ))}
          </div>

          <div style={{
            marginTop:48,
            padding:'16px 20px',
            background:'var(--clr-surface-2)',
            borderRadius:'var(--r-md)',
            border:'1px solid var(--clr-border)'
          }}>
            <div style={{ fontSize:'1.6rem', fontWeight:900, color:'var(--clr-primary)', letterSpacing:'-0.04em' }}>12,000+</div>
            <div style={{ fontSize:'0.82rem', color:'var(--clr-text-3)', marginTop:2 }}>students placed and growing</div>
          </div>
        </div>
      </div>

      {/* Right – Form */}
      <div className="auth-form-side">
        <div className="auth-form-card animate-fade-up">
          <h2 style={{ fontSize:'1.6rem', fontWeight:800, letterSpacing:'-0.03em', marginBottom:6 }}>Welcome back</h2>
          <p className="text-muted text-sm" style={{ marginBottom:32 }}>Sign in to your HireStorm account</p>

          {/* ── Email-not-verified banner ── */}
          {unverifiedEmail && (
            <div style={{
              marginBottom: 24,
              padding: '16px 18px',
              borderRadius: 'var(--r-md)',
              border: '1.5px solid #f59e0b',
              background: 'rgba(245,158,11,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              animation: 'fadeInDown 0.3s ease',
            }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                <MailWarning size={20} style={{ color:'#f59e0b', flexShrink:0, marginTop:1 }}/>
                <div>
                  <p style={{ fontWeight:700, fontSize:'0.88rem', color:'#92400e', marginBottom:2 }}>
                    Email not verified
                  </p>
                  <p style={{ fontSize:'0.82rem', color:'#78350f', lineHeight:1.5 }}>
                    We sent a verification link to <strong>{unverifiedEmail}</strong>.
                    Check your inbox (and spam folder) and click the link before signing in.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResend}
                disabled={resending || resendCooldown > 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  padding: '9px 16px',
                  borderRadius: 'var(--r-sm)',
                  border: '1.5px solid #f59e0b',
                  background: resendCooldown > 0 ? 'rgba(245,158,11,0.05)' : '#f59e0b',
                  color: resendCooldown > 0 ? '#92400e' : '#fff',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: (resending || resendCooldown > 0) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: (resending || resendCooldown > 0) ? 0.75 : 1,
                }}
              >
                <RefreshCw size={14} style={{ animation: resending ? 'spin 1s linear infinite' : 'none' }}/>
                {resending
                  ? 'Sending…'
                  : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend verification email'
                }
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <Mail size={15}/>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => {
                    setForm(p => ({ ...p, email: e.target.value }));
                    if (unverifiedEmail) setUnverifiedEmail(null); // clear banner if user edits email
                  }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <label>Password</label>
                <Link to="/forgot-password" style={{ fontSize:'0.78rem' }}>Forgot password?</Link>
              </div>
              <div className="input-with-icon">
                <Lock size={15}/>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
              </div>
            </div>

            <button className="btn btn-primary btn-lg w-full" type="submit" disabled={isLoading} style={{ marginTop:4 }}>
              {isLoading ? <span className="spinner" style={{ borderTopColor:'#fff' }}/> : (
                <><span>Sign In</span><ArrowRight size={16}/></>
              )}
            </button>
          </form>

          <div className="divider" style={{ margin:'28px 0' }}/>

          <p className="text-sm text-muted" style={{ textAlign:'center' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ fontWeight:600 }}>Create one free →</Link>
          </p>

          {/* College portal link */}
          <Link
            to="/college/login"
            style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              marginTop:14,
              padding:'10px 16px',
              borderRadius:'var(--r-sm)',
              border:'1.5px solid var(--clr-border)',
              background:'var(--clr-surface-2)',
              color:'var(--clr-text-2)',
              fontSize:'0.82rem', fontWeight:600,
              textDecoration:'none',
              transition:'all 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--clr-primary)'; e.currentTarget.style.color='var(--clr-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--clr-border)'; e.currentTarget.style.color='var(--clr-text-2)'; }}
          >
            <GraduationCap size={15}/>
            College / Institution? Sign in here →
          </Link>
        </div>
      </div>
    </div>
  );
}
