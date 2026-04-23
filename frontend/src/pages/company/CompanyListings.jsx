import { useEffect, useState } from 'react';
import CompanyLayout from '../../layouts/CompanyLayout';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Eye, Pause, Play, Briefcase, MapPin, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CompanyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = () => {
    api.get('/listings/my?limit=50')
      .then(r => { setListings(r.data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(fetchListings, []);

  const toggleActive = async (id, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await api.put(`/listings/${id}`, { status: newStatus });
      setListings(ls => ls.map(l => l._id === id ? { ...l, status: newStatus } : l));
      toast.success(newStatus === 'PAUSED' ? 'Listing paused' : 'Listing activated');
    } catch { toast.error('Action failed'); }
  };

  return (
    <CompanyLayout>
      <div className="page">
        <div className="page-header-row">
          <div className="page-header" style={{ marginBottom:0 }}>
            <h1>Manage Listings</h1>
            <p className="text-muted">{listings.length} total listings</p>
          </div>
          <Link to="/company/listings/new">
            <button className="btn btn-primary"><Plus size={15}/> Post New Job</button>
          </Link>
        </div>

        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[1,2,3].map(i=><div key={i} className="skeleton" style={{ height:90, borderRadius:'var(--r-sm)' }}/>)}
          </div>
        ) : listings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Briefcase size={28} style={{ color:'var(--clr-text-3)' }}/></div>
            <h3>No listings yet</h3>
            <p>Post your first internship or job opening to start attracting candidates</p>
            <Link to="/company/listings/new"><button className="btn btn-primary">Post First Listing</button></Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Deadline</th>
                  <th>Applicants</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map(l => (
                  <tr key={l._id}>
                    <td>
                      <div style={{ fontWeight:600 }}>{l.title}</div>
                      {l.isPinned && <span className="badge badge-yellow" style={{ marginTop:4 }}>⭐ Featured</span>}
                    </td>
                    <td><span className={`badge ${l.type==='INTERNSHIP'?'badge-blue':l.type==='JOB'?'badge-green':'badge-yellow'}`}>{l.type}</span></td>
                    <td className="text-muted text-sm">{l.isRemote ? '🌐 Remote' : l.location || '—'}</td>
                    <td className="text-sm text-muted">
                      {l.applicationDeadline ? new Date(l.applicationDeadline).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ fontWeight:700 }}>{l.applicationsCount || 0}</td>
                    <td>
                      <span className={`badge ${l.status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}`}>
                        {l.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <Link to={`/company/listings/${l._id}/applicants`}>
                          <button className="btn btn-ghost btn-sm" title="View Applicants"><Eye size={13}/></button>
                        </Link>
                        <button
                          className="btn btn-ghost btn-sm"
                          title={l.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                          onClick={() => toggleActive(l._id, l.status)}
                        >
                          {l.status === 'ACTIVE' ? <Pause size={13}/> : <Play size={13}/>}
                        </button>
                      </div>
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
