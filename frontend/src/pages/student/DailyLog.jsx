import { useEffect, useState } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FileText, Clock, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

export default function DailyLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], workDone:'', blockers:'', hoursWorked:8 });
  const [showForm, setShowForm] = useState(false);

  const [hasInternship, setHasInternship] = useState(true);

  const fetchLogs = () => {
    api.get('/ilm/my').then(r => {
      const ilm = r.data.data;
      if (!ilm || (ilm.status !== 'ACTIVE' && ilm.status !== 'COMPLETED')) {
        setHasInternship(false);
      } else {
        setLogs(ilm.dailyLogs || []);
      }
      setLoading(false);
    }).catch(() => {
      setHasInternship(false);
      setLoading(false);
    });
  };
  useEffect(fetchLogs, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.workDone.trim()) { toast.error('Please describe what you worked on'); return; }
    setSubmitting(true);
    try {
      await api.post('/ilm/daily-log', {
        task:        form.workDone,   // backend field name
        workDone:    form.workDone,   // new field name
        blockers:    form.blockers,
        hoursWorked: form.hoursWorked,
        date:        form.date,
      });
      toast.success('Daily log submitted! ✅');
      setShowForm(false);
      setForm({ date: new Date().toISOString().split('T')[0], workDone:'', blockers:'', hoursWorked:8 });
      fetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit log');
    } finally { setSubmitting(false); }
  };

  const today = new Date().toISOString().split('T')[0];
  const submittedToday = logs.some(l => l.date?.split('T')[0] === today && l.status === 'SUBMITTED');

  return (
    <StudentLayout>
      {!hasInternship && !loading ? (
        <div className="page" style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
          <div className="empty-state">
            <Clock size={48} style={{ color: 'var(--clr-text-3)', marginBottom: 16 }} />
            <h3>No Active Internship</h3>
            <p className="text-muted">You do not have an active internship to submit logs for. Accept an offer first!</p>
            <button className="btn btn-primary" onClick={() => window.location.href = '/dashboard'} style={{ marginTop: 16 }}>Go to Dashboard</button>
          </div>
        </div>
      ) : (
      <div className="page page-sm">
        <div className="page-header-row">
          <div className="page-header" style={{ marginBottom:0 }}>
            <h1>Daily Log</h1>
            <p className="text-muted">Track your daily internship progress</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(s => !s)}
            disabled={submittedToday}
          >
            <FileText size={15}/>
            {submittedToday ? '✅ Submitted Today' : 'Submit Today\'s Log'}
          </button>
        </div>

        {/* Stats bar */}
        <div style={{ display:'flex', gap:12, marginBottom:24 }}>
          {[
            { label:'Submitted', value: logs.filter(l=>l.status==='SUBMITTED').length, clr:'var(--clr-success)' },
            { label:'Pending',   value: logs.filter(l=>l.status==='PENDING').length,   clr:'var(--clr-warning)' },
            { label:'Total',     value: logs.length,                                   clr:'var(--clr-primary)' },
          ].map(({ label, value, clr }) => (
            <div key={label} style={{
              flex:1, textAlign:'center', padding:'14px',
              background:'var(--clr-surface)', border:'1px solid var(--clr-border)', borderRadius:'var(--r-sm)'
            }}>
              <div style={{ fontSize:'1.6rem', fontWeight:900, color:clr, letterSpacing:'-0.04em' }}>{value}</div>
              <div className="text-xs text-dimmed" style={{ marginTop:2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Submit Form */}
        {showForm && !submittedToday && (
          <div className="card animate-fade-up" style={{ marginBottom:24, border:'1px solid rgba(79,126,248,0.3)' }}>
            <h3 style={{ fontWeight:700, marginBottom:20 }}>Submit Daily Log</h3>
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(p=>({...p,date:e.target.value}))} max={today}/>
                </div>
                <div className="form-group">
                  <label>Hours Worked</label>
                  <input type="number" min={1} max={14} value={form.hoursWorked} onChange={e => setForm(p=>({...p,hoursWorked:+e.target.value}))}/>
                </div>
              </div>
              <div className="form-group">
                <label>What did you work on today? *</label>
                <textarea
                  rows={5}
                  value={form.workDone}
                  onChange={e => setForm(p=>({...p,workDone:e.target.value}))}
                  placeholder="Describe the tasks you completed, what you learned, and your achievements today..."
                  required
                />
                <div className="form-hint">{form.workDone.length} characters</div>
              </div>
              <div className="form-group">
                <label>Blockers / Challenges <span className="text-dimmed">(optional)</span></label>
                <textarea
                  rows={3}
                  value={form.blockers}
                  onChange={e => setForm(p=>({...p,blockers:e.target.value}))}
                  placeholder="Any blockers, questions for your mentor, or challenges you faced..."
                />
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <span className="spinner"/> : <><CheckCircle2 size={14}/> Submit Log</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Logs List */}
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[1,2,3].map(i=><div key={i} className="skeleton" style={{ height:90, borderRadius:'var(--r-sm)' }}/>)}
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Clock size={28} style={{ color:'var(--clr-text-3)' }}/></div>
            <h3>No logs yet</h3>
            <p>Submit your first daily log to start tracking your internship progress</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[...logs].reverse().map(log => (
              <div key={log._id || log.date} style={{
                padding:'14px 18px',
                background:'var(--clr-surface)',
                border:'1px solid var(--clr-border)',
                borderRadius:'var(--r-sm)',
                display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:14, flexWrap:'wrap'
              }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:6 }}>
                    <span style={{ fontWeight:700, fontSize:'0.88rem' }}>
                      {new Date(log.date).toLocaleDateString('en-IN',{ weekday:'short', day:'numeric', month:'short' })}
                    </span>
                    <span className={`badge ${log.status==='SUBMITTED'?'badge-green':log.status==='REVIEWED'?'badge-blue':'badge-yellow'}`}>
                      {log.status}
                    </span>
                    {log.hoursWorked && (
                      <span className="text-xs text-dimmed" style={{ display:'flex', alignItems:'center', gap:3 }}>
                        <Clock size={11}/>{log.hoursWorked}h
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted" style={{ lineHeight:1.65 }}>
                    {log.workDone?.slice(0,150)}{log.workDone?.length>150?'…':''}
                  </p>
                  {log.blockers && (
                    <div style={{ marginTop:8, display:'flex', gap:6, alignItems:'flex-start' }}>
                      <AlertCircle size={13} style={{ color:'var(--clr-warning)', flexShrink:0, marginTop:2 }}/>
                      <span className="text-xs" style={{ color:'var(--clr-warning)' }}>{log.blockers}</span>
                    </div>
                  )}
                </div>
                {log.mentorScore !== undefined && (
                  <div style={{ textAlign:'center', padding:'8px 12px', background:'var(--clr-success-dim)', borderRadius:'var(--r-sm)' }}>
                    <div style={{ fontWeight:800, color:'var(--clr-success)' }}>{log.mentorScore}</div>
                    <div className="text-xs text-dimmed">Score</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      )}
    </StudentLayout>
  );
}
