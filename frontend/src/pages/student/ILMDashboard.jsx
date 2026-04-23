import { useEffect, useState } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function ILMDashboard() {
  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/ilm/my').then(r => { setInternship(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <StudentLayout><div className="loading-screen"><div className="spinner" style={{width:36,height:36}}/></div></StudentLayout>;
  if (!internship) return (
    <StudentLayout>
      <div className="page" style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
        <div className="empty-state">
          <h3>No Active Internship</h3>
          <p className="text-muted">You do not have an active internship. Accept an offer from your dashboard to unlock the ILM portal!</p>
          <button className="btn btn-primary" onClick={() => window.location.href = '/dashboard'} style={{ marginTop: 16 }}>Go to Dashboard</button>
        </div>
      </div>
    </StudentLayout>
  );

  const { status, startDate, endDate, mentor, stipend, continuousAssessmentScore, assessmentThreshold,
    isExamUnlocked, exam, certificate, dailyLogs, monthlyReviews, wbs } = internship;

  const progressDays = Math.floor((new Date() - new Date(startDate)) / (24*60*60*1000));
  const totalDays = 90;
  const progress = Math.min(100, Math.round((progressDays / totalDays) * 100));

  const completedWeeks = wbs?.filter(w => w.tasks.every(t => t.status === 'DONE')).length || 0;

  return (
    <StudentLayout>
      <div className="page">
        <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1>My Internship</h1>
            <p className="text-muted">90-Day Lifecycle Program</p>
          </div>
          <span className={`badge ${status === 'ACTIVE' ? 'badge-green' : status === 'COMPLETED' ? 'badge-blue' : 'badge-yellow'}`} style={{fontSize:'0.85rem', padding:'6px 14px'}}>{status}</span>
        </div>

        {/* Progress Bar */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight:600 }}>Internship Progress</span>
            <span className="text-sm text-muted">Day {progressDays} of {totalDays}</span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width:`${progress}%` }}/></div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop: 8 }}>
            <span className="text-xs text-muted">{new Date(startDate).toDateString()}</span>
            <span className="text-xs text-muted">{progress}% Complete</span>
            <span className="text-xs text-muted">{new Date(endDate).toDateString()}</span>
          </div>
        </div>

        <div className="grid-4" style={{ marginBottom: 24 }}>
          {[
            { label: 'Daily Logs', value: dailyLogs?.filter(l => l.status === 'SUBMITTED').length || 0, total: progressDays, clr: 'var(--clr-primary)' },
            { label: 'WBS Weeks Done', value: completedWeeks, total: 13, clr: 'var(--clr-success)' },
            { label: 'CA Score', value: `${Math.round(continuousAssessmentScore || 0)}%`, total: `${assessmentThreshold}% min`, clr: 'var(--clr-warning)' },
            { label: 'Stipend', value: `₹${stipend?.amount?.toLocaleString()}`, total: '/month', clr: 'var(--clr-accent)' },
          ].map(({ label, value, total, clr }) => (
            <div key={label} className="card stat-card">
              <div className="stat-label">{label}</div>
              <div className="stat-value" style={{ color: clr }}>{value}</div>
              <div className="stat-sub">{total}</div>
            </div>
          ))}
        </div>

        <div className="grid-2">
          {/* Mentor Card */}
          <div className="card">
            <h3 style={{ fontWeight:700, marginBottom:16 }}>Your Mentor</h3>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:48, height:48, borderRadius:'50%', background:'var(--clr-primary-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'var(--clr-primary)', fontSize:18 }}>
                {mentor?.profile?.firstName?.[0]}{mentor?.profile?.lastName?.[0]}
              </div>
              <div>
                <div style={{ fontWeight:600 }}>{mentor?.profile?.firstName} {mentor?.profile?.lastName}</div>
                <div className="text-sm text-muted">{mentor?.email}</div>
              </div>
            </div>
          </div>

          {/* Monthly Reviews */}
          <div className="card">
            <h3 style={{ fontWeight:700, marginBottom:16 }}>Monthly Reviews</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[1,2,3].map(month => {
                const review = monthlyReviews?.find(r => r.month === month);
                return (
                  <div key={month} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--clr-border)' }}>
                    <span style={{ fontWeight:600 }}>Month {month}</span>
                    {review?.status === 'COMPLETED'
                      ? <span className="badge badge-green">Score: {review.totalScore}/100</span>
                      : <span className="badge badge-gray">Pending</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Exam / Certificate */}
        {(isExamUnlocked || certificate?.isGenerated) && (
          <div className="card" style={{ marginTop: 24, borderColor: certificate?.isGenerated ? 'rgba(34,197,94,0.4)' : 'rgba(59,130,246,0.4)' }}>
            {certificate?.isGenerated ? (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:'1.1rem', marginBottom:4 }}>🏆 Certificate Ready!</div>
                  <div className="text-sm text-muted">Certificate ID: {certificate.certificateId}</div>
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <a href={certificate.certificateUrl} target="_blank" rel="noreferrer"><button className="btn btn-primary">Download PDF</button></a>
                  {!certificate.linkedinShared && (
                    <button className="btn btn-outline" onClick={async () => {
                      try { await api.post('/ilm/certificate/share-linkedin'); toast.success('Shared on LinkedIn!'); }
                      catch { toast.error('LinkedIn sharing failed. Connect LinkedIn first.'); }
                    }}>Share on LinkedIn</button>
                  )}
                  {certificate.linkedinShared && <span className="badge badge-blue">✓ Shared on LinkedIn</span>}
                </div>
              </div>
            ) : isExamUnlocked && !exam?.attemptedAt ? (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:'1.1rem', marginBottom:4 }}>🎓 Final Exam Unlocked</div>
                  <div className="text-sm text-muted">Pass score: 70% | One attempt allowed</div>
                </div>
                <a href="/ilm/exam"><button className="btn btn-primary">Start Exam</button></a>
              </div>
            ) : exam?.attemptedAt && !exam?.isPassed ? (
              <div><span className="badge badge-red">Exam Not Passed — Score: {exam.score}%</span></div>
            ) : null}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
