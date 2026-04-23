import { useEffect, useState } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import api from '../../api/axios';
import { Search, Filter, MapPin, Clock, IndianRupee, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';

const DOMAINS = ['Web Dev', 'Data Science', 'UI/UX', 'Mobile', 'AI/ML', 'DevOps', 'Blockchain', 'Cybersecurity'];

export default function Listings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', domain: '', isRemote: '', search: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12, ...Object.fromEntries(Object.entries(filter).filter(([,v]) => v)) });
      const { data } = await api.get(`/listings?${params}`);
      setListings(data.data);
      setTotal(data.total);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchListings(); }, [filter, page]);

  return (
    <StudentLayout>
      <div className="page">
        <div className="page-header">
          <h1>Browse Opportunities</h1>
          <p className="text-muted">Find the perfect internship or job</p>
        </div>

        {/* Search + Filters */}
        <div className="card" style={{ marginBottom: 24, display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ flex:1, minWidth: 220, position:'relative' }}>
            <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--clr-text-3)' }}/>
            <input style={{ paddingLeft: 36 }} placeholder="Search by title or skill..." value={filter.search} onChange={e => setFilter(p => ({ ...p, search: e.target.value }))}/>
          </div>
          <select style={{ width: 'auto', minWidth: 140 }} value={filter.type} onChange={e => setFilter(p => ({ ...p, type: e.target.value }))}>
            <option value="">All Types</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="JOB">Full Time</option>
            <option value="PART_TIME">Part Time</option>
          </select>
          <select style={{ width:'auto', minWidth: 140 }} value={filter.domain} onChange={e => setFilter(p => ({ ...p, domain: e.target.value }))}>
            <option value="">All Domains</option>
            {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.85rem', cursor:'pointer', whiteSpace:'nowrap' }}>
            <input type="checkbox" style={{ width:'auto' }} checked={filter.isRemote === 'true'} onChange={e => setFilter(p => ({ ...p, isRemote: e.target.checked ? 'true' : '' }))}/> Remote only
          </label>
        </div>

        <div style={{ marginBottom: 16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <p className="text-sm text-muted">{total} results found</p>
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding: 60 }}><div className="spinner" style={{ width:32, height:32 }}/></div>
        ) : listings.length === 0 ? (
          <div className="empty-state"><Search size={48}/><p>No listings found matching your criteria</p></div>
        ) : (
          <div className="grid-3">
            {listings.map(listing => (
              <Link to={`/listings/${listing._id}`} key={listing._id} style={{ textDecoration:'none' }}>
                <div className="card" style={{ cursor:'pointer', height:'100%' }}>
                  {listing.isPinned && <div style={{ marginBottom: 12 }}><span className="badge badge-yellow">⭐ Featured</span></div>}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize:'0.95rem', marginBottom: 4 }}>{listing.title}</div>
                      <div style={{ display:'flex', alignItems:'center', gap: 6 }}>
                        {listing.company?.logo && <img src={listing.company.logo} alt="" style={{ width:18, height:18, borderRadius:4, objectFit:'cover' }}/>}
                        <span className="text-sm text-muted">{listing.company?.name}</span>
                        {listing.company?.isVerified && <span style={{ color:'var(--clr-primary)', fontSize:12 }}>✓</span>}
                      </div>
                    </div>
                    <span className={`badge ${listing.type === 'INTERNSHIP' ? 'badge-blue' : listing.type === 'JOB' ? 'badge-green' : 'badge-yellow'}`}>{listing.type}</span>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap: 8, marginBottom: 12 }}>
                    {listing.skillsRequired?.slice(0, 3).map(skill => <span key={skill} className="badge badge-gray">{skill}</span>)}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap: 6, marginBottom: 16 }}>
                    {listing.location && <div style={{ display:'flex', alignItems:'center', gap: 6 }} className="text-sm text-muted"><MapPin size={13}/>{listing.location}{listing.isRemote && ' · Remote'}</div>}
                    {listing.stipend?.amount > 0 && <div style={{ display:'flex', alignItems:'center', gap: 6 }} className="text-sm text-muted"><IndianRupee size={13}/>₹{listing.stipend.amount?.toLocaleString()}/{listing.stipend.period || 'month'}</div>}
                    {listing.duration && <div style={{ display:'flex', alignItems:'center', gap: 6 }} className="text-sm text-muted"><Clock size={13}/>{listing.duration}</div>}
                    {listing.isRemote && <div style={{ display:'flex', alignItems:'center', gap: 6 }} className="text-sm" style={{ color:'var(--clr-success)' }}><Wifi size={13}/>100% Remote</div>}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span className="text-xs text-dimmed">{listing.applicationsCount} applicants</span>
                    {listing.applicationDeadline && <span className="text-xs text-dimmed">Closes {new Date(listing.applicationDeadline).toLocaleDateString()}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 12 && (
          <div style={{ display:'flex', justifyContent:'center', gap: 8, marginTop: 32 }}>
            <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span className="text-sm text-muted" style={{ display:'flex', alignItems:'center' }}>Page {page} of {Math.ceil(total/12)}</span>
            <button className="btn btn-ghost btn-sm" disabled={page >= Math.ceil(total/12)} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
