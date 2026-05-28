import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate  = useNavigate();
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [done,        setDone]        = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirm)  return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset link expired or invalid. Request a new one.');
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
            Create a new<br />
            <span style={{ background: 'linear-gradient(90deg,var(--clr-primary),var(--clr-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>password</span>
          </h1>
          <p style={{ color: 'var(--clr-text-2)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 380 }}>
            Choose a strong password with at least 6 characters. You'll be redirected to login automatically.
          </p>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-card animate-fade-up">
          {done ? (
            <div style={{ textAlign: 'center' }}>
              <CheckCircle2 size={48} color="var(--clr-success)" style={{ marginBottom: 16 }} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>Password Reset!</h2>
              <p className="text-muted text-sm">Redirecting you to login in 3 seconds…</p>
              <Link to="/login" className="btn btn-primary w-full" style={{ marginTop: 24 }}>Go to Login</Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>Reset Password</h2>
              <p className="text-muted text-sm" style={{ marginBottom: 32 }}>Enter and confirm your new password below.</p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="form-group">
                  <label>New Password</label>
                  <div className="input-with-icon" style={{ position: 'relative' }}>
                    <Lock size={15} />
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text-3)', display: 'flex' }}>
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Confirm Password</label>
                  <div className="input-with-icon">
                    <Lock size={15} />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                    />
                  </div>
                  {confirm && password !== confirm && (
                    <p style={{ color: 'var(--clr-danger)', fontSize: '0.75rem', marginTop: 4 }}>Passwords do not match</p>
                  )}
                </div>

                <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading || (confirm && password !== confirm)}>
                  {loading ? <span className="spinner" style={{ borderTopColor: '#fff' }} /> : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
