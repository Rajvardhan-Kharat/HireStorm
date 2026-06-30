import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  const [form, setForm]                     = useState({ email: '', password: '' });
  const [resending, setResending]           = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [loginError, setLoginError]         = useState('');
  const cooldownRef                         = useRef(null);

  // Banner state lives in the STORE — survives React StrictMode double-mount,
  // component remounts, and any re-render triggered by isLoading changes.
  const loginBannerEmail  = useAuthStore(s => s.loginBannerEmail);
  const loginBannerResent = useAuthStore(s => s.loginBannerResent);
  const clearLoginBanner  = useAuthStore(s => s.clearLoginBanner);

  // Granular selectors — avoids Login re-rendering on every store update
  const login              = useAuthStore(s => s.login);
  const resendVerification = useAuthStore(s => s.resendVerification);
  const isLoading          = useAuthStore(s => s.isLoading);
  const navigate           = useNavigate();
  const { search }         = useLocation(); // fallback for oauth

  // Detect OAuth fallback
  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get('error') === 'oauth_failed' || params.get('error') === 'oauth_failed_fallback_to_local') {
      toast.error('Social login unavailable. Please sign in with your email and password.', {
        duration: 5000,
        icon: '⚠️'
      });
      setLoginError('Social login is temporarily unavailable. Please use local login.');
      // Remove query param to prevent toast loop on refresh
      navigate('/login', { replace: true });
    }
  }, [search, navigate]);

  // Clean up cooldown timer on unmount
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
    setLoginError(''); // clear previous error immediately
    const res = await login(form.email, form.password);
    if (res.success) {
      const role = useAuthStore.getState().user?.role;
      if (['PLATFORM_ADMIN', 'SUPER_ADMIN'].includes(role)) navigate('/admin/dashboard');
      else if (['COMPANY_ADMIN', 'COMPANY_HR'].includes(role)) navigate('/company/dashboard');
      else navigate('/dashboard');
    } else if (!res.emailUnverified) {
      // Clear banner for unrelated errors, show inline error immediately
      clearLoginBanner();
      setLoginError(res.message || 'Invalid email or password. Please try again.');
    }
    // If emailUnverified — store already set loginBannerEmail inside login()
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending || !loginBannerEmail) return;
    setResending(true);
    const res = await resendVerification(loginBannerEmail);
    setResending(false);
    if (res.success) {
      startCooldown(60);
      // loginBannerResent is set inside resendVerification() in the store
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
      <div className="auth-form-side" style={{ position: 'relative', flexDirection: 'column', gap: 0 }}>

        {/* ── Persistent email-not-verified banner ──────────────────────────
            State is in Zustand store, NOT useState — survives StrictMode and
            any component remount. Rendered outside the form card so it's never
            inside an animated container.                                      */}
        {loginBannerEmail && (
          <div
            id="email-unverified-banner"
            style={{
              width: '100%',
              maxWidth: 440,
              marginBottom: 20,
              padding: '16px 18px',
              borderRadius: 'var(--r-md)',
              border: '2px solid #f59e0b',
              background: '#fffbeb',
              boxShadow: '0 4px 20px rgba(245,158,11,0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {/* Top row: icon + text + dismiss */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <MailWarning size={22} style={{ color: '#d97706', flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 800, fontSize: '0.92rem', color: '#92400e', marginBottom: 5 }}>
                  ✉️ Verify your email first
                </p>
                <p style={{ fontSize: '0.83rem', color: '#78350f', lineHeight: 1.65, margin: 0 }}>
                  We sent a link to <strong>{loginBannerEmail}</strong>. Click it to activate your account, then try signing in again.
                </p>
                {loginBannerResent && (
                  <p style={{
                    fontSize: '0.8rem', color: '#065f46', fontWeight: 700,
                    marginTop: 8, display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <CheckCircle2 size={13} />
                    New email sent — check your inbox!
                  </p>
                )}
              </div>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => { clearLoginBanner(); setResendCooldown(0); clearInterval(cooldownRef.current); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#92400e', fontSize: '1.3rem', lineHeight: 1,
                  padding: '0 4px', opacity: 0.55, flexShrink: 0,
                  fontWeight: 300,
                }}
              >×</button>
            </div>

            {/* Bottom row: resend button + hint */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                id="resend-verification-btn"
                onClick={handleResend}
                disabled={resending || resendCooldown > 0}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '9px 20px',
                  borderRadius: 'var(--r-sm)',
                  border: '2px solid #f59e0b',
                  background: (resending || resendCooldown > 0) ? '#fef3c7' : '#f59e0b',
                  color: (resending || resendCooldown > 0) ? '#92400e' : '#fff',
                  fontWeight: 700, fontSize: '0.84rem',
                  cursor: (resending || resendCooldown > 0) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.18s',
                  whiteSpace: 'nowrap',
                }}
              >
                <RefreshCw
                  size={14}
                  style={{ animation: resending ? 'spin 0.75s linear infinite' : 'none' }}
                />
                {resending
                  ? 'Sending…'
                  : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend verification email'}
              </button>
              <span style={{ fontSize: '0.75rem', color: '#92400e', opacity: 0.65 }}>
                Not in inbox? Check your spam folder.
              </span>
            </div>
          </div>
        )}

        {/* ── Login Card ──────────────────────────────────────── */}
        <div className="auth-form-card" style={{ width: '100%', maxWidth: 440 }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>Welcome back</h2>
          <p className="text-muted text-sm" style={{ marginBottom: 32 }}>Sign in to your HireStorm account</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <Mail size={15} />
                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => {
                    setForm(p => ({ ...p, email: e.target.value }));
                    setLoginError(''); // clear error on new input
                    // Clear banner only if user types a different email
                    if (loginBannerEmail && e.target.value !== loginBannerEmail) {
                      clearLoginBanner();
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
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setLoginError(''); }}
                  required
                />
              </div>
            </div>

            <button
              id="login-submit-btn"
              className="btn btn-primary btn-lg w-full"
              type="submit"
              disabled={isLoading}
              style={{ marginTop: 4 }}
            >
              {isLoading
                ? <><span className="spinner" style={{ borderTopColor: '#fff' }} /><span>Signing in…</span></>
                : <><span>Sign In</span><ArrowRight size={16} /></>
              }
            </button>

            {/* Inline error — appears instantly, no toast delay */}
            {loginError && (
              <div
                role="alert"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 'var(--r-sm)',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1.5px solid rgba(239,68,68,0.3)',
                  color: 'var(--clr-danger)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  animation: 'fadeIn 0.15s ease',
                }}
              >
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
                {loginError}
              </div>
            )}
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
