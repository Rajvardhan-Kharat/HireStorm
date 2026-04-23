import { useEffect, useState } from 'react';
import CompanyLayout from '../../layouts/CompanyLayout';
import api from '../../api/axios';
import { Users, Search, Mail, Code2 } from 'lucide-react';

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/applications/company?limit=100')
      .then(r => {
        const apps = r.data.data || [];
        // Deduplicate by applicant ID
        const seen = new Set();
        const unique = [];
        apps.forEach(a => {
          const key = a.applicant?._id;
          if (key && !seen.has(key)) { seen.add(key); unique.push({ ...a.applicant, lastStatus: a.status }); }
        });
        setCandidates(unique);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = candidates.filter(c => {
    const q = search.toLowerCase();
    return (
      `${c.profile?.firstName} ${c.profile?.lastName}`.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.skills?.some(s => s.toLowerCase().includes(q))
    );
  });

  return (
    <CompanyLayout>
      <div className="page">
        <div className="page-header-row">
          <div className="page-header" style={{ marginBottom:0 }}>
            <h1>Candidate Database</h1>
            <p className="text-muted">{candidates.length} unique candidates</p>
          </div>
        </div>

        <div className="search-wrap" style={{ marginBottom:20, maxWidth:400 }}>
          <Search size={15}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, email, or skill..."/>
        </div>

        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[1,2,3,4].map(i=>(
              <div key={i} className="card" style={{ display:'flex', gap:14 }}>
                <div className="skeleton skeleton-avatar"/>
                <div style={{ flex:1 }}><div className="skeleton skeleton-text w-3/4"/><div className="skeleton skeleton-text w-1/2"/></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={28} style={{ color:'var(--clr-text-3)' }}/></div>
            <h3>{search ? 'No matches found' : 'No candidates yet'}</h3>
            <p>{search ? 'Try different search terms' : 'Candidates will appear here once people apply to your listings'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Candidate</th><th>Education</th><th>Skills</th><th>Last Status</th></tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c._id}>
                    <td>
                      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                        <div className="avatar avatar-sm">{c.profile?.firstName?.[0]}{c.profile?.lastName?.[0]}</div>
                        <div>
                          <div style={{ fontWeight:600 }}>{c.profile?.firstName} {c.profile?.lastName}</div>
                          <div style={{ display:'flex', alignItems:'center', gap:4 }} className="text-xs text-dimmed">
                            <Mail size={10}/>{c.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm text-muted">
                      {c.profile?.institution || '—'}<br/>
                      <span className="text-dimmed" style={{ fontSize:'0.72rem' }}>{c.profile?.degree}</span>
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                        {c.skills?.slice(0,3).map(s=><span key={s} className="chip" style={{ gap:4 }}><Code2 size={10}/>{s}</span>)}
                        {c.skills?.length>3 && <span className="chip">+{c.skills.length-3}</span>}
                        {!c.skills?.length && <span className="text-dimmed text-xs">—</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${c.lastStatus==='SHORTLISTED'?'badge-green':c.lastStatus==='REJECTED'?'badge-red':c.lastStatus==='OFFER'?'badge-yellow':'badge-blue'}`}>
                        {c.lastStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </CompanyLayout>
  );
}
