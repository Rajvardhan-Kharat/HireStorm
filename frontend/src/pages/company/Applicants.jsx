import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CompanyLayout from '../../layouts/CompanyLayout';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Users, Mail, Code2, CheckCircle, XCircle, Clock } from 'lucide-react';

const STATUS_COLS = [
  { key:'APPLIED',     label:'Applied',     color:'badge-blue'   },
  { key:'SHORTLISTED', label:'Shortlisted', color:'badge-green'  },
  { key:'INTERVIEW',   label:'Interview',   color:'badge-purple' },
  { key:'OFFER',       label:'Offer',       color:'badge-yellow' },
  { key:'REJECTED',    label:'Rejected',    color:'badge-red'    },
];

export default function Applicants() {
  const { id } = useParams();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState('');

  useEffect(() => {
    api.get(`/applications/listing/${id}`)
      .then(r => { setApps(r.data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const updateStatus = async (appId, status) => {
    setUpdating(appId);
    try {
      await api.patch(`/applications/${appId}/status`, { status });
      setApps(prev => prev.map(a => a._id === appId ? { ...a, status } : a));
      if (selected?._id === appId) setSelected(s => ({ ...s, status }));
      toast.success(`Status updated to ${status}`);
    } catch { toast.error('Update failed'); }
    finally { setUpdating(''); }
  };

  return (
    <CompanyLayout>
      <div className="page">
        <div className="page-header-row">
          <div className="page-header" style={{ marginBottom:0 }}>
            <h1>Applicants</h1>
            <p className="text-muted">{apps.length} total applicants for this listing</p>
          </div>
        </div>

        {/* Pipeline Summary */}
        <div style={{ display:'flex', gap:10, overflowX:'auto', marginBottom:24 }}>
          {STATUS_COLS.map(({ key, label, color }) => (
            <div key={key} style={{
              flex:'0 0 auto', minWidth:110,
              padding:'12px 14px', textAlign:'center',
              background:'var(--clr-surface)', border:'1px solid var(--clr-border)', borderRadius:'var(--r-sm)'
            }}>
              <div style={{ fontWeight:900, fontSize:'1.5rem', letterSpacing:'-0.04em' }}>{apps.filter(a=>a.status===key).length}</div>
              <span className={`badge ${color}`} style={{ marginTop:4 }}>{label}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[1,2,3].map(i=><div key={i} className="skeleton" style={{ height:70, borderRadius:'var(--r-sm)' }}/>)}
          </div>
        ) : apps.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={28} style={{ color:'var(--clr-text-3)' }}/></div>
            <h3>No applicants yet</h3>
            <p>Applicants will appear here once people start applying</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap:20, alignItems:'start' }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Applicant</th><th>Skills</th><th>Applied</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {apps.map(app => (
                    <tr key={app._id} onClick={() => setSelected(selected?._id===app._id ? null : app)} style={{ cursor:'pointer' }}>
                      <td>
                        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                          <div className="avatar avatar-sm">{app.applicant?.profile?.firstName?.[0]}</div>
                          <div>
                            <div style={{ fontWeight:600 }}>{app.applicant?.profile?.firstName} {app.applicant?.profile?.lastName}</div>
                            <div className="text-xs text-dimmed" style={{ display:'flex', alignItems:'center', gap:3 }}>
                              <Mail size={10}/>{app.applicant?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                          {app.applicant?.skills?.slice(0,2).map(s=><span key={s} className="chip">{s}</span>)}
                          {app.applicant?.skills?.length > 2 && <span className="chip">+{app.applicant.skills.length-2}</span>}
                        </div>
                      </td>
                      <td className="text-sm text-muted">
                        {new Date(app.appliedAt||app.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td><span className={`badge ${STATUS_COLS.find(s=>s.key===app.status)?.color||'badge-gray'}`}>{app.status}</span></td>
                      <td>
                        <div style={{ display:'flex', gap:4 }}>
                          <button className="btn btn-ghost btn-xs" disabled={updating===app._id} onClick={(e)=>{e.stopPropagation();updateStatus(app._id,'SHORTLISTED');}}>
                            <CheckCircle size={12}/>
                          </button>
                          <button className="btn btn-ghost btn-xs" style={{ color:'var(--clr-danger)' }} disabled={updating===app._id} onClick={(e)=>{e.stopPropagation();updateStatus(app._id,'REJECTED');}}>
                            <XCircle size={12}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selected && (
              <div className="card animate-fade-up" style={{ position:'sticky', top:24 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <h3 style={{ fontWeight:700 }}>Applicant Profile</h3>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelected(null)}>✕</button>
                </div>
                <div style={{ textAlign:'center', marginBottom:20 }}>
                  <div className="avatar avatar-lg" style={{ margin:'0 auto 10px' }}>
                    {selected.applicant?.profile?.firstName?.[0]}{selected.applicant?.profile?.lastName?.[0]}
                  </div>
                  <div style={{ fontWeight:700, fontSize:'1rem' }}>{selected.applicant?.profile?.firstName} {selected.applicant?.profile?.lastName}</div>
                  <div className="text-sm text-muted">{selected.applicant?.email}</div>
                </div>
                {selected.applicant?.profile?.institution && (
                  <div style={{ marginBottom:12 }}>
                    <div className="text-xs text-dimmed" style={{ marginBottom:4 }}>INSTITUTION</div>
                    <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{selected.applicant.profile.institution}</div>
                    <div className="text-sm text-muted">{selected.applicant.profile.degree}</div>
                  </div>
                )}
                {selected.applicant?.skills?.length > 0 && (
                  <div style={{ marginBottom:12 }}>
                    <div className="text-xs text-dimmed" style={{ marginBottom:8 }}>SKILLS</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {selected.applicant.skills.map(s=><span key={s} className="chip">{s}</span>)}
                    </div>
                  </div>
                )}
                {selected.coverLetter && (
                  <div style={{ marginBottom:16 }}>
                    <div className="text-xs text-dimmed" style={{ marginBottom:6 }}>COVER LETTER</div>
                    <div className="text-sm text-muted" style={{ lineHeight:1.7, background:'var(--clr-surface-2)', padding:12, borderRadius:'var(--r-sm)' }}>
                      {selected.coverLetter}
                    </div>
                  </div>
                )}
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <div className="text-xs text-dimmed" style={{ marginBottom:4 }}>UPDATE STATUS</div>
                  {STATUS_COLS.map(({ key, label, color }) => (
                    <button key={key} className={`btn btn-sm w-full ${selected.status===key ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ justifyContent:'space-between' }}
                      onClick={() => updateStatus(selected._id, key)}
                      disabled={updating===selected._id}
                    >
                      <span className={`badge ${color}`}>{label}</span>
                      {selected.status === key && <CheckCircle size={13}/>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </CompanyLayout>
  );
}
