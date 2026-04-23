import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Users, Search, Mail, Shield, UserX, ChevronDown } from 'lucide-react';

const ROLES = ['STUDENT','PRO_STUDENT','INTERN','COMPANY_ADMIN','COMPANY_HR','PLATFORM_ADMIN','SUPER_ADMIN'];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit:20, ...(search && { search }) });
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.data || []);
      setTotal(data.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, search]);

  const updateRole = async (userId, role) => {
    setUpdating(userId);
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role } : u));
      toast.success('Role updated');
    } catch { toast.error('Failed to update role'); }
    finally { setUpdating(''); }
  };

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

  const roleBadge = (role) => {
    const map = {
      SUPER_ADMIN:'badge-red', PLATFORM_ADMIN:'badge-red',
      COMPANY_ADMIN:'badge-purple', COMPANY_HR:'badge-purple',
      INTERN:'badge-green', PRO_STUDENT:'badge-blue', STUDENT:'badge-gray',
    };
    return map[role] || 'badge-gray';
  };

  return (
    <AdminLayout>
      <div className="page">
        <div className="page-header-row">
          <div className="page-header" style={{ marginBottom:0 }}>
            <h1>User Management</h1>
            <p className="text-muted">{total.toLocaleString()} total users</p>
          </div>
        </div>

        <div className="search-wrap" style={{ maxWidth:420, marginBottom:20 }}>
          <Search size={15}/>
          <input value={search} onChange={handleSearch} placeholder="Search by name or email..."/>
        </div>

        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[1,2,3,4,5].map(i=><div key={i} className="skeleton" style={{ height:60, borderRadius:'var(--r-sm)' }}/>)}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                        <div className="avatar avatar-sm">{u.profile?.firstName?.[0]}{u.profile?.lastName?.[0]}</div>
                        <div style={{ fontWeight:600 }}>{u.profile?.firstName} {u.profile?.lastName}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:5 }} className="text-sm text-muted">
                        <Mail size={12}/>{u.email}
                      </div>
                    </td>
                    <td><span className={`badge ${roleBadge(u.role)}`}>{u.role?.replace(/_/g,' ')}</span></td>
                    <td className="text-sm text-muted">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={e => updateRole(u._id, e.target.value)}
                        disabled={updating === u._id}
                        style={{ width:'auto', fontSize:'0.78rem', padding:'5px 8px' }}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 20 && (
          <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:24 }}>
            <button className="btn btn-ghost btn-sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
            <span className="text-sm text-muted" style={{ display:'flex', alignItems:'center' }}>Page {page} of {Math.ceil(total/20)}</span>
            <button className="btn btn-ghost btn-sm" disabled={page>=Math.ceil(total/20)} onClick={()=>setPage(p=>p+1)}>Next →</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
