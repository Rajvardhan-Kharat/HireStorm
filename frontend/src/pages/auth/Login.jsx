import { useState, useRef, useEffect } from 'react';
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
  const [form, setForm]                       = useState({ email: '', password: '' });
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [resending, setResending]             = useState(false);
  const [resendCooldown, setResendCooldown]   = useState(0);
  const [resendDone, setResendDone]           = useState(false);
  const cooldownRef                           = useRef(null);

  // Granular selectors — so isLoading flips don't cause unnecessary re-renders
  const login              = useAuthStore(s => s.login);
  const resendVerification = useAuthStore(s => s.resendVerification);
  const isLoading          = useAuthStore(s => s.isLoading);
  const navigate           = useNavigate();

  useEffect(() => () => clearInterval(cooldownRef.current), []);

  const startCooldown = (seconds = 60) => {
    setResendCooldown(seconds);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(form.email, form.password);
    if (res.success) {
      const role = useAuthStore.getState().user?.role;
      if (['PLATFORM_ADMIN', 'SUPER_ADMIN'].includes(role)) navigate('/admin/dashboard');
      else if (['COMPANY_ADMIN', 'COMPANY_HR'].includes(role)) navigate('/company/dashboard');
      else navigate('/dashboard');
    } else if (res.emailUnverified) {
      // Show persistent banner — never auto-dismiss
      setUnverifiedEmail(form.email);
      setResendDone(false);
    } else {
      setUnverifiedEmail(null);
      toast.error(res.message);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    const res = await resendVerification(unverifiedEmail);
    setResending(false);
    if (res.success) {
      setResendDone(true);
      startCooldown(60);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="auth-page">

      {/* ─── Left – Brand Panel ─────────────────────────────── */}
      <div className="auth-brand">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
            <div style={{
              width: 40, height: 40,
              background: 'linear-gradient(135deg,var(--clr-primary),var(--clr-accent))',
              borderRadius: 'var(--r-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>⚡</div>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em' }}>HireStorm</span>
          </div>

          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: 16 }}>
            Launch your<br />
            <span style={{ background: 'linear-gradient(90deg,var(--clr-primary),var(--clr-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              tech career
            </span>
          </h1>
          <p style={{ color: 'var(--clr-text-2)', fontSize: '1rem', lineHeight: 1.7, marginBottom: 36, maxWidth: 380 }}>
            India's most comprehensive internship platform — from application to certification.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {features.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={16} style={{ color: 'var(--clr-success)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--clr-text-2)' }}>{f}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 48, padding: '16px 20px', background: 'var(--clr-surface-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--clr-border)' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--clr-primary)', letterSpacing: '-0.04em' }}>12,000+</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--clr-text-3)', marginTop: 2 }}>students placed and growing</div>
          </div>
        </div>
      </div>

      {/* ─── Right – Form side ──────────────────────────────── */}
      <div className="auth-form-side" style={{ position: 'relative' }}>

        {/* Email-not-verified banner — sits at top of right panel, outside the card
            so it's NEVER affected by card re-renders / animations               */}
        {unverifiedEmail && (
          <div style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(440px, calc(100% - 40px))',
            zIndex: 100,
            padding: '14px 18px',
            borderRadius: 'var(--r-md)',
            border: '1.5px solid #f59e0b',
            background: '#fffbeb',
            boxShadow: '0 6px 24px rgba(245,158,11,0.18)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <MailWarning size={20} style={{ color: '#d97706', flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#92400e', marginBottom: 4 }}>
                  Email not verified
                </p>
                <p style={{ fontSize: '0.82rem', color: '#78350f', lineHeight: 1.6, margin: 0 }}>
                  A verification link was sent to <strong>{unverifiedEmail}</strong>.
                  Check your inbox (and spam) then click the link to sign in.
                </p>
                {resendDone && (
                  <p style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 600, marginTop: 8, display: 'flex', alignItems: 'center', gap: 5, margin: '8px 0 0' }}>
                    <CheckCircle2 size={13} /> New verification email sent — check your inbox!
                  </p>
                )}
              </div>
              {/* Dismiss X */}
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => { setUnverifiedEmail(null); setResendDone(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', fontSize: '1.1rem', lineHeight: 1, padding: '2px 4px', opacity: 0.6, flexShrink: 0 }}
              >
                ×
              </button>
            </div>

            {/* Resend button row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                id="resend-verification-btn"
                onClick={handleResend}
                disabled={resending || resendCooldown > 0}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 18px',
                  borderRadius: 'var(--r-sm)',
                  border: '1.5px solid #f59e0b',
                  background: (resending || resendCooldown > 0) ? 'transparent' : '#f59e0b',
                  color: (resending || resendCooldown > 0) ? '#92400e' : '#fff',
                  fontWeight: 700, fontSize: '0.82rem',
                  cursor: (resending || resendCooldown > 0) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: (resending || resendCooldown > 0) ? 0.7 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                <RefreshCw size={13} style={{ animation: resending ? 'spin 0.8s linear infinite' : 'none' }} />
                {resending
                  ? 'Sending…'
                  : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend verification email'}
              </button>
              <span style={{ fontSize: '0.75rem', color: '#92400e', opacity: 0.7 }}>
                Didn't get it? Check spam or resend.
              </span>
            </div>
          </div>
        )}

        {/* Login Card — no animate-fade-up class to prevent animation re-triggering */}
        <div className="auth-form-card" style={{ marginTop: unverifiedEmail ? 140 : 0, transition: 'margin-top 0.25s ease' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>Welcome back</h2>
          <p className="text-muted text-sm" style={{ marginBottom: 32 }}>Sign in to your HireStorm account</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <Mail size={15} />
                <input
                  type="email"
                  id="login-email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => {
                    setForm(p => ({ ...p, email: e.target.value }));
                    // Only clear banner if user types a *different* email
                    if (unverifiedEmail && e.target.value !== unverifiedEmail) {
                      setUnverifiedEmail(null);
                      setResendDone(false);
                    }
                  }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '0.78rem' }}>Forgot password?</Link>
              </div>
              <div className="input-with-icon">
                <Lock size={15} />
                <input
                  type="password"
                  id="login-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg w-full"
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              style={{ marginTop: 4 }}
            >
              {isLoading
                ? <span className="spinner" style={{ borderTopColor: '#fff' }} />
                : <><span>Sign In</span><ArrowRight size={16} /></>
              }
            </button>
          </form>

          <div className="divider" style={{ margin: '28px 0' }} />

          <p className="text-sm text-muted" style={{ textAlign: 'center' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ fontWeight: 600 }}>Create one free →</Link>
          </p>

          <Link
            to="/college/login"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 14, padding: '10px 16px',
              borderRadius: 'var(--r-sm)',
              border: '1.5px solid var(--clr-border)',
              background: 'var(--clr-surface-2)',
              color: 'var(--clr-text-2)',
              fontSize: '0.82rem', fontWeight: 600,
              textDecoration: 'none', transition: 'all 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--clr-primary)'; e.currentTarget.style.color = 'var(--clr-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--clr-border)'; e.currentTarget.style.color = 'var(--clr-text-2)'; }}
          >
            <GraduationCap size={15} />
            College / Institution? Sign in here →
          </Link>
        </div>
      </div>
    </div>
  );
}
