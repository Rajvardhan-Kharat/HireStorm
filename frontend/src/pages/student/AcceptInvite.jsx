import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import StudentLayout from '../../layouts/StudentLayout';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function AcceptInvite() {
  const { slug, token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Verifying invitation...');

  useEffect(() => {
    const processInvite = async () => {
      try {
        await api.post(`/hackathons/${slug}/teams/accept-invite/${token}`);
        setStatus('success');
        setMessage('You have successfully joined the team!');
        setTimeout(() => {
          navigate(`/hackathons/${slug}`);
        }, 3000);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Invalid or expired invitation token');
      }
    };
    processInvite();
  }, [slug, token, navigate]);

  return (
    <StudentLayout>
      <div className="page animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 440, width: '100%' }}>
          {status === 'loading' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <Loader2 className="spinner" size={40} style={{ color: 'var(--clr-primary)' }} />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{message}</h2>
              <p className="text-muted">Please wait while we add you to the team...</p>
            </div>
          )}

          {status === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <CheckCircle2 size={50} style={{ color: 'var(--clr-success)' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Invite Accepted!</h2>
              <p className="text-muted">{message}</p>
              <p className="text-xs text-dimmed">Redirecting to hackathon page...</p>
              <button className="btn btn-primary mt-4" onClick={() => navigate(`/hackathons/${slug}`)}>Go Now</button>
            </div>
          )}

          {status === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <XCircle size={50} style={{ color: 'var(--clr-danger)' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Invitation Failed</h2>
              <p className="text-muted">{message}</p>
              <button className="btn btn-outline mt-4" onClick={() => navigate(`/hackathons/${slug}`)}>Go to Hackathon</button>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
