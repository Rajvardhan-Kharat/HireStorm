import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  TrendingUp, TrendingDown, IndianRupee, Users, Building,
  BookOpen, Star, CreditCard, Zap, Award, CheckCircle2, XCircle, Clock,
} from 'lucide-react';

const STREAM_META = {
  PRO_SUBSCRIPTION:    { label: 'Student PRO', color: '#a78bfa', icon: <Star size={14}/> },
  COMPANY_PRO_SUBSCRIPTION: { label: 'Company PRO', color: '#8b5cf6', icon: <Star size={14}/> },
  COMPANY_TIER_UPGRADE:{ label: 'Company Plans', color: '#3b82f6', icon: <Building size={14}/> },
  HACKATHON_ENTRY:     { label: 'Hackathon Fees', color: '#f59e0b', icon: <Zap size={14}/> },
  LISTING_PIN:         { label: 'Listing Boost', color: '#06b6d4', icon: <Award size={14}/> },
  HACKATHON_SPONSOR:   { label: 'Sponsorships', color: '#ec4899', icon: <TrendingUp size={14}/> },
};

export default function AdminRevenue() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/revenue')
      .then(r => { setData(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <AdminLayout>
      <div className="loading-screen"><div className="spinner" style={{ width: 36, height: 36 }} /></div>
    </AdminLayout>
  );

  const totalRev = data?.totalRevenue || 0;
  const streams  = Object.entries(data?.byType || {}).map(([type, amount]) => ({
    type, amount,
    meta: STREAM_META[type] || { label: type, color: '#6b7280', icon: <CreditCard size={14}/> },
    pct: totalRev ? Math.round((amount / totalRev) * 100) : 0,
  })).sort((a, b) => b.amount - a.amount);

  const kpis = [
    {
      icon: <IndianRupee size={20}/>, label: 'Total Revenue',
      value: `₹${(totalRev).toLocaleString('en-IN')}`,
      sub: 'All time', clr: '#22c55e', bg: 'rgba(34,197,94,0.12)',
    },
    {
      icon: <TrendingUp size={20}/>, label: 'This Month (MRR)',
      value: `₹${(data?.mrr || 0).toLocaleString('en-IN')}`,
      sub: (() => {
        const g = data?.mrrGrowth || 0;
        return g >= 0 ? `▲ ${g}% vs last month` : `▼ ${Math.abs(g)}% vs last month`;
      })(),
      subClr: (data?.mrrGrowth || 0) >= 0 ? '#22c55e' : '#ef4444',
      clr: '#3b82f6', bg: 'rgba(59,130,246,0.12)',
    },
    {
      icon: <CreditCard size={20}/>, label: 'Transactions',
      value: data?.totalTransactions || 0,
      sub: 'Successful', clr: '#a78bfa', bg: 'rgba(167,139,250,0.12)',
    },
    {
      icon: <Star size={20}/>, label: 'PRO Students',
      value: data?.proStudents || 0,
      sub: 'Active subscribers', clr: '#f59e0b', bg: 'rgba(245,158,11,0.12)',
    },
    {
      icon: <Star size={20}/>, label: 'PRO Companies',
      value: data?.proCompanies || 0,
      sub: 'Active subscribers', clr: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',
    },
    {
      icon: <Building size={20}/>, label: 'Paid Companies',
      value: data?.paidCompanies || 0,
      sub: 'Starter / Growth / Enterprise', clr: '#06b6d4', bg: 'rgba(6,182,212,0.12)',
    },
    {
      icon: <BookOpen size={20}/>, label: 'Active Internships',
      value: data?.activeInternships || 0,
      sub: 'Currently running', clr: '#ec4899', bg: 'rgba(236,72,153,0.12)',
    },
  ];

  return (
    <AdminLayout>
      <div className="page">
        <div className="page-header">
          <h1>Revenue Dashboard</h1>
          <p className="text-muted">Platform earnings, MRR trends, and stream breakdown</p>
        </div>

        {/* KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
          {kpis.map(({ icon, label, value, sub, subClr, clr, bg }) => (
            <div key={label} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span className="text-sm text-muted">{label}</span>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: clr }}>
                  {icon}
                </div>
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, letterSpacing: '-0.04em', color: clr }}>{value}</div>
              <div style={{ fontSize: '0.75rem', marginTop: 5, color: subClr || 'var(--clr-text-3)' }}>{sub}</div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom: 32 }}>
          {/* Monthly Trend Chart */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Monthly Revenue Trend</h3>
            {data?.monthlyTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.monthlyTrend} barSize={28}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f7ef8" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: 'var(--clr-text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--clr-text-3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="url(#revenueGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><TrendingUp size={40} /><p>No data yet</p></div>
            )}
          </div>

          {/* Revenue by Stream */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Revenue by Stream</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {streams.length === 0 ? (
                <div className="empty-state"><p>No revenue yet</p></div>
              ) : streams.map(({ type, amount, meta, pct }) => (
                <div key={type}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ color: meta.color }}>{meta.icon}</div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{meta.label}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                      ₹{amount.toLocaleString('en-IN')}
                      <span className="text-muted" style={{ fontWeight: 400, marginLeft: 4 }}>({pct}%)</span>
                    </div>
                  </div>
                  <div style={{ height: 6, background: 'var(--clr-surface-2)', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: meta.color, borderRadius: 6, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Companies + Recent Txns */}
        <div className="grid-2" style={{ marginBottom: 32 }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--clr-border)' }}>
              <h3 style={{ fontWeight: 700 }}>Top Paying Companies</h3>
            </div>
            {!data?.topCompanies?.length ? (
              <div className="empty-state" style={{ padding: 32 }}><Building size={32} /><p>No company revenue yet</p></div>
            ) : (
              <div className="table-wrap" style={{ borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Revenue</th>
                      <th>Txns</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topCompanies.map((c, i) => (
                      <tr key={c.name}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(79,126,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--clr-primary)' }}>
                              {i + 1}
                            </div>
                            <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{c.name}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--clr-success)' }}>₹{c.total.toLocaleString('en-IN')}</td>
                        <td className="text-muted">{c.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--clr-border)' }}>
              <h3 style={{ fontWeight: 700 }}>Recent Transactions</h3>
            </div>
            {!data?.recentTransactions?.length ? (
              <div className="empty-state" style={{ padding: 32 }}><CreditCard size={32} /><p>No transactions yet</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {data.recentTransactions.slice(0, 10).map(tx => (
                  <div key={tx._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid var(--clr-border)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        {tx.user?.profile?.firstName} {tx.user?.profile?.lastName || (tx.company?.name || 'Unknown')}
                      </div>
                      <div className="text-xs text-muted">{(tx.type || '').replace(/_/g, ' ')}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--clr-success)', fontSize: '0.9rem' }}>₹{(tx.amount || 0).toLocaleString('en-IN')}</div>
                      <div className="text-xs text-muted">{new Date(tx.createdAt).toLocaleDateString('en-IN')}</div>
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
