import React, { useEffect, useState } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import api from '../../api/axios';
import { Award, Download, Link as LinkIcon, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Certificate() {
  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.get('/ilm/my')
      .then(r => { setInternship(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <StudentLayout><div className="skeleton" style={{ height: 400 }} /></StudentLayout>;
  if (!internship) return <StudentLayout><div className="empty-state">No active internship found.</div></StudentLayout>;

  const { certificate } = internship;

  const handleShareLinkedIn = async () => {
    try {
      await api.post('/ilm/certificate/share-linkedin');
      toast.success('Shared successfully on LinkedIn!');
      setInternship(p => ({ ...p, certificate: { ...p.certificate, linkedinShared: true } }));
    } catch {
      toast.error('Could not share on LinkedIn. Ensure account is linked.');
    }
  };

  return (
    <StudentLayout>
      <div className="page" style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <div className="page-header">
          <h1>My Certificate</h1>
          <p className="text-muted">View, download, and share your official internship certificate.</p>
        </div>

        {!certificate?.isGenerated ? (
          <div className="empty-state">
            <Award size={48} className="text-muted" style={{ marginBottom: 16 }} />
            <h3>Certificate Not Available Yet</h3>
            <p className="text-muted">You must complete your 90-day WBS and pass the final exam to unlock your certificate.</p>
            
            <div style={{ marginTop: 24, padding: 16, background: 'rgba(239, 68, 68, 0.05)', border: '1px dashed var(--clr-danger)', borderRadius: 8 }}>
              <p className="text-xs text-muted" style={{ marginBottom: 12 }}>DEV MODE: Bypass 90-day restriction and force generate certificate for testing.</p>
              <button 
                className="btn" 
                style={{ background: 'var(--clr-danger)', color: 'white', margin: '0 auto', gap: 6 }}
                disabled={generating}
                onClick={async () => {
                  setGenerating(true);
                  try {
                    await api.post('/ilm/certificate/dev-generate');
                    toast.success('Certificate auto-generated for testing!');
                    window.location.reload();
                  } catch (err) {
                    toast.error('Failed to generate test certificate');
                    setGenerating(false);
                  }
                }}
              >
                {generating ? <span className="spinner" /> : 'Force Generate Certificate'}
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 40, border: '1px solid var(--clr-success)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', color: 'var(--clr-success)', marginBottom: 24 }}>
              <Award size={40} />
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>Certificate of Completion</h2>
            <p className="text-muted" style={{ marginBottom: 32, fontSize: '1.1rem' }}>
              ID: {certificate.certificateId} <br/>
              Issued: {new Date(certificate.issuedAt).toLocaleDateString()}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 300, margin: '0 auto' }}>
              <a href={certificate.certificateUrl} target="_blank" rel="noreferrer" style={{ width: '100%' }}>
                <button className="btn btn-primary w-full" style={{ justifyContent: 'center', gap: 8 }}>
                  <Download size={18} /> Download PDF
                </button>
              </a>

              <button 
                className="btn w-full" 
                style={{ justifyContent: 'center', gap: 8, background: '#0a66c2', color: '#fff', borderColor: '#0a66c2' }}
                onClick={handleShareLinkedIn}
                disabled={certificate.linkedinShared}
              >
                <LinkIcon size={18} /> {certificate.linkedinShared ? 'Shared on LinkedIn' : 'Add to LinkedIn Profile'}
              </button>

              <button className="btn btn-outline w-full" style={{ justifyContent: 'center', gap: 8 }} onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/verify/${certificate.certificateId}`);
                toast.success('Verification link copied!');
              }}>
                <Share2 size={18} /> Copy Verification Link
              </button>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
