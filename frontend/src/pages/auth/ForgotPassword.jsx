import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Send } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,var(--clr-primary),var(--clr-accent))', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚡</div>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em' }}>HireStorm</span>
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: 16 }}>
            Reset your<br />
            <span style={{ background: 'linear-gradient(90deg,var(--clr-primary),var(--clr-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>password</span>
          </h1>
          <p style={{ color: 'var(--clr-text-2)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 380 }}>
            Enter your registered email address and we'll send you a link to reset your password within minutes.
          </p>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-card animate-fade-up">
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>📬</div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>Check your inbox</h2>
              <p className="text-muted text-sm" style={{ marginBottom: 28, lineHeight: 1.7 }}>
                We've sent a password reset link to <strong>{email}</strong>.<br />
                It expires in 30 minutes.
              </p>
              <p className="text-xs text-muted">
                Didn't receive it? Check your spam folder or{' '}
                <button className="btn btn-link" style={{ fontSize: '0.78rem', display: 'inline', padding: 0 }} onClick={() => setSent(false)}>
                  try again
                </button>.
              </p>
              <Link to="/login" className="btn btn-outline w-full" style={{ marginTop: 24 }}>
                <ArrowLeft size={15} /> Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>Forgot Password?</h2>
              <p className="text-muted text-sm" style={{ marginBottom: 32 }}>We'll send you a secure reset link.</p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="form-group">
                  <label>Email Address</label>
                  <div className="input-with-icon">
                    <Mail size={15} />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}>
                  {loading ? <span className="spinner" style={{ borderTopColor: '#fff' }} /> : <><Send size={15} /><span>Send Reset Link</span></>}
                </button>
              </form>

              <div className="divider" style={{ margin: '24px 0' }} />
              <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--clr-text-2)' }}>
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
