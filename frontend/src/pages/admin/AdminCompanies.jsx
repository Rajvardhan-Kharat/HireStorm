import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Building2, CheckCircle2, XCircle, Globe, Mail } from 'lucide-react';

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('PENDING');
  const [rejectModal, setRejectModal] = useState(null);
  const [reason, setReason] = useState('');
  const [acting, setActing] = useState('');

  useEffect(() => {
    api.get('/admin/companies?limit=50')
      .then(r => { setCompanies(r.data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const verify = async (id, action) => {
    setActing(id);
    try {
      await api.put(`/admin/companies/${id}/verify`, { action, rejectReason: reason });
      setCompanies(prev => prev.map(c => c._id===id ? { ...c, isVerified: action==='APPROVE', verificationStatus: action==='APPROVE'?'APPROVED':'REJECTED' } : c));
      if (rejectModal) { setRejectModal(null); setReason(''); }
      toast.success(action==='APPROVE' ? '✅ Company approved' : '❌ Company rejected');
    } catch { toast.error('Action failed'); }
    finally { setActing(''); }
  };

  const filtered = companies.filter(c => {
    if (tab === 'PENDING') return !c.isVerified && c.verificationStatus !== 'REJECTED';
    if (tab === 'VERIFIED') return c.isVerified;
    return c.verificationStatus === 'REJECTED';
  });

  return (
    <AdminLayout>
      <div className="page">
        <div className="page-header">
          <h1>Company Verification</h1>
          <p className="text-muted">Review and approve company registrations</p>
        </div>

        <div className="tabs">
          {[
            { key:'PENDING',  label:`Pending (${companies.filter(c=>!c.isVerified&&c.verificationStatus!=='REJECTED').length})` },
            { key:'VERIFIED', label:`Verified (${companies.filter(c=>c.isVerified).length})` },
            { key:'REJECTED', label:`Rejected (${companies.filter(c=>c.verificationStatus==='REJECTED').length})` },
          ].map(({ key, label }) => (
            <button key={key} className={`tab-btn ${tab===key?'active':''}`} onClick={()=>setTab(key)}>{label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[1,2,3].map(i=><div key={i} className="skeleton" style={{ height:100, borderRadius:'var(--r-sm)' }}/>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Building2 size={28} style={{ color:'var(--clr-text-3)' }}/></div>
            <h3>No {tab.toLowerCase()} companies</h3>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {filtered.map(c => (
              <div key={c._id} className="card" style={{ display:'flex', gap:16, alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap' }}>
                <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                  <div style={{
                    width:48, height:48, borderRadius:'var(--r-sm)',
                    background:'var(--clr-primary-dim)', border:'1px solid var(--clr-border)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontWeight:800, color:'var(--clr-primary)', fontSize:'1.1rem', flexShrink:0
                  }}>{c.name?.[0]}</div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'0.95rem', marginBottom:3 }}>{c.name}</div>
                    <div className="text-sm text-muted" style={{ marginBottom:6 }}>{c.industry}</div>
                    <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                      {c.email && <span style={{ display:'flex', gap:4, alignItems:'center' }} className="text-xs text-dimmed"><Mail size={11}/>{c.email}</span>}
                      {c.website && <a href={c.website} target="_blank" rel="noreferrer" style={{ display:'flex', gap:4, alignItems:'center' }} className="text-xs"><Globe size={11}/>Website</a>}
                    </div>
                    {c.description && <p className="text-sm text-muted" style={{ marginTop:8, maxWidth:500 }}>{c.description?.slice(0,120)}{c.description?.length>120?'…':''}</p>}
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  {tab === 'PENDING' && (
                    <>
                      <button className="btn btn-success btn-sm" disabled={acting===c._id} onClick={() => verify(c._id,'APPROVE')}>
                        <CheckCircle2 size={13}/> Approve
                      </button>
                      <button className="btn btn-danger btn-sm" disabled={acting===c._id} onClick={() => setRejectModal(c)}>
                        <XCircle size={13}/> Reject
                      </button>
                    </>
                  )}
                  {tab === 'VERIFIED' && <span className="badge badge-green">✓ Verified</span>}
                  {tab === 'REJECTED' && <span className="badge badge-red">Rejected</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {rejectModal && (
          <div className="modal-overlay" onClick={() => setRejectModal(null)}>
            <div className="modal modal-sm" onClick={e=>e.stopPropagation()}>
              <div className="modal-header">
                <h2>Reject Company</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setRejectModal(null)}>✕</button>
              </div>
              <p className="text-sm text-muted" style={{ marginBottom:16 }}>
                Rejecting <strong>{rejectModal.name}</strong>. Optionally provide a reason:
              </p>
              <div className="form-group">
                <label>Reason (optional)</label>
                <textarea rows={3} value={reason} onChange={e=>setReason(e.target.value)} placeholder="e.g. Incomplete information, unverifiable documents..."/>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setRejectModal(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => verify(rejectModal._id, 'REJECT')} disabled={acting===rejectModal._id}>
                  {acting===rejectModal._id ? <span className="spinner"/> : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
