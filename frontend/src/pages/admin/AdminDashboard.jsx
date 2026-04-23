import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../api/axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, Building, Code2, Star, IndianRupee, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => { setData(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout><div className="loading-screen"><div className="spinner" style={{width:36,height:36}}/></div></AdminLayout>;

  const stats = [
    { icon: <Users size={22}/>, label: 'Total Users', value: data?.totalUsers?.toLocaleString(), clr:'#3b82f6', bg:'rgba(59,130,246,0.15)' },
    { icon: <Building size={22}/>, label: 'Companies', value: data?.totalCompanies?.toLocaleString(), clr:'#8b5cf6', bg:'rgba(139,92,246,0.15)' },
    { icon: <Code2 size={22}/>, label: 'Hackathons', value: data?.totalHackathons?.toLocaleString(), clr:'#f59e0b', bg:'rgba(245,158,11,0.15)' },
    { icon: <Star size={22}/>, label: 'Active Internships', value: data?.activeInternships?.toLocaleString(), clr:'#22c55e', bg:'rgba(34,197,94,0.15)' },
    { icon: <IndianRupee size={22}/>, label: 'Total Revenue', value: `₹${(data?.revenue || 0).toLocaleString()}`, clr:'#06b6d4', bg:'rgba(6,182,212,0.15)' },
  ];

  // Build revenue chart data from transactions
  const txByType = {};
  data?.recentTransactions?.forEach(tx => {
    txByType[tx.type] = (txByType[tx.type] || 0) + (tx.amount || 0);
  });
  const chartData = Object.entries(txByType).map(([name, value]) => ({ name: name.replace(/_/g,' '), value }));

  return (
    <AdminLayout>
      <div className="page">
        <div className="page-header">
          <h1>Platform Overview</h1>
          <p className="text-muted">Real-time metrics and operational health</p>
        </div>

        <div className="grid-4" style={{ marginBottom: 32 }}>
          {stats.map(({ icon, label, value, clr, bg }) => (
            <div key={label} className="card stat-card">
              <div className="stat-icon" style={{ background: bg, color: clr }}>{icon}</div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid-2">
          <div className="card">
            <h3 style={{ fontWeight:700, marginBottom: 20 }}>Revenue by Category</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" />
                  <XAxis dataKey="name" tick={{ fill:'var(--clr-text-3)', fontSize:11 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'var(--clr-text-3)', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`}/>
                  <Tooltip contentStyle={{ background:'var(--clr-surface)', border:'1px solid var(--clr-border)', borderRadius:'var(--radius-sm)' }} formatter={v => `₹${v}`}/>
                  <Bar dataKey="value" fill="var(--clr-primary)" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="empty-state"><TrendingUp size={40}/><p>No transactions yet</p></div>}
          </div>

          <div className="card">
            <h3 style={{ fontWeight:700, marginBottom: 20 }}>Recent Transactions</h3>
            {data?.recentTransactions?.length === 0 ? (
              <div className="empty-state"><p>No transactions</p></div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {data?.recentTransactions?.slice(0,8).map(tx => (
                  <div key={tx._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--clr-border)' }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:'0.85rem' }}>{tx.user?.profile?.firstName} {tx.user?.profile?.lastName}</div>
                      <div className="text-xs text-muted">{tx.type?.replace(/_/g,' ')}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontWeight:700, color:'var(--clr-success)' }}>₹{tx.amount?.toLocaleString()}</div>
                      <span className={`badge ${tx.status === 'SUCCESS' ? 'badge-green' : 'badge-yellow'}`}>{tx.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
