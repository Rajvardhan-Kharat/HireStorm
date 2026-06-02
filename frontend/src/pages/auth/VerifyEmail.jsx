import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import axios from '../../api/axios';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('Verifying your email...');
  const hasAttempted = useRef(false);

  useEffect(() => {
    // Prevent double verification on React StrictMode mount
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    const verifyToken = async () => {
      try {
        const { data } = await axios.get(`/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(data.message || 'Your email has been successfully verified.');
      } catch (error) {
        setStatus('error');
        setMessage(
          error.response?.data?.message || 
          'Verification failed. The link may be invalid or has expired.'
        );
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-brand" style={{ flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 440, margin: '0 auto', textAlign: 'center' }}>
          
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 40 }}>
            <div style={{
              width: 40, height: 40,
              background: 'linear-gradient(135deg,var(--clr-primary),var(--clr-accent))',
              borderRadius: 'var(--r-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>⚡</div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>HireStorm</span>
          </div>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '40px 32px',
            borderRadius: 'var(--r-lg)',
            border: '1px solid var(--clr-border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }}>
            {status === 'loading' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                <Loader2 size={48} style={{ color: 'var(--clr-primary)', animation: 'spin 1.5s linear infinite' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Verifying Email</h2>
                <p style={{ color: 'var(--clr-text-2)' }}>Please wait while we confirm your email address...</p>
              </div>
            )}

            {status === 'success' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <CheckCircle2 size={56} style={{ color: 'var(--clr-success)' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--clr-success)' }}>Email Verified!</h2>
                <p style={{ color: 'var(--clr-text-2)', lineHeight: 1.6, marginBottom: 8 }}>{message}</p>
                <Link to="/login" className="btn btn-primary" style={{ width: '100%', maxWidth: 200, justifyContent: 'center' }}>
                  Go to Login
                </Link>
              </div>
            )}

            {status === 'error' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <XCircle size={56} style={{ color: 'var(--clr-danger)' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--clr-danger)' }}>Verification Failed</h2>
                <p style={{ color: 'var(--clr-text-2)', lineHeight: 1.6, marginBottom: 8 }}>{message}</p>
                <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'center' }}>
                  <Link to="/login" className="btn btn-primary" style={{ flex: 1, maxWidth: 160, justifyContent: 'center' }}>
                    Go to Login
                  </Link>
                  <Link to="/register" className="btn btn-outline" style={{ flex: 1, maxWidth: 160, justifyContent: 'center' }}>
                    Sign Up
                  </Link>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
