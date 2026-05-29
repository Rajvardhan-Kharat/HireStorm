import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Award, Calendar, Building2, User, Shield } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://hirestorm.onrender.com/api/v1';

export default function VerifyCertificate() {
  const { certId } = useParams();
  const [state, setState] = useState('loading'); // loading | valid | invalid
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!certId) { setState('invalid'); return; }
    fetch(`${API_BASE}/ilm/verify/${certId}`)
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setData(res.data);
          setState('valid');
        } else {
          setState('invalid');
        }
      })
      .catch(() => setState('invalid'));
  }, [certId]);

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      {/* Brand header */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 999, padding: '8px 20px', marginBottom: 12,
        }}>
          <span style={{ fontSize: '1.2rem' }}>⚡</span>
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1rem' }}>HireStorm</span>
          <span style={{
            background: 'linear-gradient(90deg,#6366f1,#a78bfa)',
            color: '#fff', fontSize: '0.65rem', fontWeight: 700,
            borderRadius: 999, padding: '2px 8px', letterSpacing: 1,
          }}>VERIFY</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
          Official Certificate Verification Portal
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 540,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}>

        {/* Loading */}
        {state === 'loading' && (
          <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <Loader2 size={40} style={{ color: '#6366f1', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Verifying certificate…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Valid */}
        {state === 'valid' && (
          <>
            {/* Green banner */}
            <div style={{
              background: 'linear-gradient(135deg, #065f46, #047857)',
              padding: '2rem',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Decorative circles */}
              <div style={{
                position: 'absolute', top: -30, right: -30, width: 120, height: 120,
                background: 'rgba(255,255,255,0.05)', borderRadius: '50%',
              }} />
              <div style={{
                position: 'absolute', bottom: -20, left: -20, width: 80, height: 80,
                background: 'rgba(255,255,255,0.05)', borderRadius: '50%',
              }} />

              <div style={{
                width: 64, height: 64,
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
                border: '2px solid rgba(255,255,255,0.3)',
              }}>
                <CheckCircle size={32} color="#fff" fill="rgba(255,255,255,0.2)" />
              </div>
              <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '1.25rem', margin: '0 0 4px' }}>
                ✅ Certificate Verified
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', margin: 0 }}>
                This is an authentic HireStorm completion certificate
              </p>
            </div>

            {/* Details */}
            <div style={{ padding: '1.75rem 2rem' }}>

              {/* Cert ID chip */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 999, padding: '4px 14px',
                marginBottom: '1.5rem',
              }}>
                <Award size={13} color="#a78bfa" />
                <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.78rem', letterSpacing: 1 }}>
                  {data.certificateId}
                </span>
              </div>

              {/* Info rows */}
              {[
                {
                  icon: <User size={16} color="#6366f1" />,
                  label: 'Intern Name',
                  value: `${data.intern?.firstName || ''} ${data.intern?.lastName || ''}`.trim() || '—',
                },
                {
                  icon: <Building2 size={16} color="#6366f1" />,
                  label: 'Organisation',
                  value: data.company || 'Erfinden Technologies Pvt. Ltd.',
                },
                {
                  icon: <Calendar size={16} color="#6366f1" />,
                  label: 'Issued On',
                  value: formatDate(data.issuedAt),
                },
                {
                  icon: <Shield size={16} color="#6366f1" />,
                  label: 'Issued By',
                  value: 'HireStorm — Erfinden Technologies Pvt. Ltd.',
                },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'rgba(99,102,241,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {icon}
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>
                      {label}
                    </div>
                    <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.92rem' }}>
                      {value}
                    </div>
                  </div>
                </div>
              ))}

              {/* Notice */}
              <div style={{
                marginTop: '1.25rem',
                background: 'rgba(99,102,241,0.06)',
                border: '1px solid rgba(99,102,241,0.15)',
                borderRadius: 10, padding: '12px 14px',
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <Shield size={14} color="#6366f1" style={{ marginTop: 2, flexShrink: 0 }} />
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.5 }}>
                  This certificate was issued by HireStorm and is cryptographically linked to its unique Certificate ID. Any alteration renders it invalid.
                </p>
              </div>
            </div>
          </>
        )}

        {/* Invalid */}
        {state === 'invalid' && (
          <>
            <div style={{
              background: 'linear-gradient(135deg, #7f1d1d, #991b1b)',
              padding: '2rem', textAlign: 'center',
            }}>
              <div style={{
                width: 64, height: 64,
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
                border: '2px solid rgba(255,255,255,0.3)',
              }}>
                <XCircle size={32} color="#fff" />
              </div>
              <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '1.25rem', margin: '0 0 4px' }}>
                ❌ Certificate Not Found
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', margin: 0 }}>
                No valid certificate matches <strong>{certId}</strong>
              </p>
            </div>
            <div style={{ padding: '1.75rem 2rem', textAlign: 'center' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                This certificate ID does not exist in our records. It may be invalid, expired, or the URL may have been modified.
              </p>
              <p style={{ color: '#64748b', fontSize: '0.8rem' }}>
                If you believe this is an error, contact{' '}
                <a href="mailto:info@innobytes.in" style={{ color: '#6366f1' }}>info@innobytes.in</a>
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Link to="/login" style={{
          color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem',
          textDecoration: 'none', transition: 'color 0.2s',
        }}
          onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
          onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.3)'}
        >
          ⚡ HireStorm Platform — hire-storm.vercel.app
        </Link>
      </div>
    </div>
  );
}
