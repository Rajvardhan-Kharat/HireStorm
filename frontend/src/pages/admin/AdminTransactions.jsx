import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../api/axios';
import {
  CreditCard, CheckCircle2, XCircle, Clock, TrendingUp,
  Users, Briefcase, Code2, BookOpen, Building, IndianRupee,
  ArrowUpRight, Info,
} from 'lucide-react';

const REVENUE_STREAMS = [
  {
    icon: <Building size={20} />,
    name: 'Company Subscriptions',
    desc: 'Free → Growth (₹4,999/mo) → Enterprise (₹14,999/mo)',
    model: 'Recurring monthly SaaS — companies pay to post more jobs, access candidate DB, and host hackathons.',
    color: 'var(--clr-primary)',
    type: 'COMPANY_TIER_UPGRADE',
  },
  {
    icon: <Briefcase size={20} />,
    name: 'Listing Boosts',
    desc: '₹499/listing · Sponsored for 7 days',
    model: 'Companies boost a job listing to appear at the top of search results with a "Sponsored" badge.',
    color: 'var(--clr-accent)',
    type: 'LISTING_BOOST',
  },
  {
    icon: <Code2 size={20} />,
    name: 'Hackathon Hosting Fee',
    desc: '₹9,999/event · Company co-hosts a hackathon',
    model: 'Companies pay to co-host a hackathon through HireStorm. Platform manages logistics, registrations, and prizes.',
    color: '#f59e0b',
    type: 'HACKATHON_HOSTING',
  },
  {
    icon: <BookOpen size={20} />,
    name: 'Course Purchases',
    desc: 'Per-course or subscription · Revenue shared',
    model: '70% revenue to course instructor/company, 30% retained by HireStorm platform. Free courses drive traffic.',
    color: 'var(--clr-success)',
    type: 'COURSE_PURCHASE',
  },
  {
    icon: <Users size={20} />,
    name: 'Student PRO Subscription',
    desc: '₹299/month · Profile boost + analytics',
    model: 'Students upgrade to PRO for profile highlighting, analytics, early access to listings, and priority support.',
    color: '#a78bfa',
    type: 'STUDENT_PRO',
  },
  {
    icon: <TrendingUp size={20} />,
    name: 'Campus Connect Badge',
    desc: '₹2,499/month · Verified campus partner',
    model: 'Companies pay for a verified campus placement partnership badge, giving access to campus talent pools.',
    color: '#ec4899',
    type: 'CAMPUS_CONNECT',
  },
];

const TYPE_COLORS = {
  COMPANY_TIER_UPGRADE: 'badge-blue',
  LISTING_BOOST:        'badge-yellow',
  HACKATHON_HOSTING:    'badge-orange',
  COURSE_PURCHASE:      'badge-green',
  STUDENT_PRO:          'badge-blue',
  CAMPUS_CONNECT:       'badge-blue',
  HACKATHON_REGISTRATION: 'badge-gray',
};

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStream, setActiveStream] = useState(null);

  useEffect(() => {
    api.get('/admin/transactions?limit=100')
      .then(r => { setTransactions(r.data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const successful = transactions.filter(t => t.status === 'SUCCESS');
  const totalRevenue = successful.reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalTxns    = transactions.length;
  const successRate  = totalTxns ? Math.round((successful.length / totalTxns) * 100) : 0;

  const revenueByType = REVENUE_STREAMS.map(stream => ({
    ...stream,
    total:  successful.filter(t => t.type === stream.type).reduce((s, t) => s + t.amount, 0),
    count:  successful.filter(t => t.type === stream.type).length,
  }));

  return (
    <AdminLayout>
      <div className="page">
        <div className="page-header">
          <h1>Revenue & Transactions</h1>
          <p className="text-muted">Platform earnings across all revenue streams — Internshala-style model.</p>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, sub: 'All time', clr: 'var(--clr-success)', icon: <IndianRupee size={20} /> },
            { label: 'Transactions', value: totalTxns, sub: 'All time', clr: 'var(--clr-primary)', icon: <CreditCard size={20} /> },
            { label: 'Success Rate', value: `${successRate}%`, sub: `${successful.length} successful`, clr: 'var(--clr-accent)', icon: <CheckCircle2 size={20} /> },
            { label: 'MRR (Est.)', value: `₹${Math.round(totalRevenue / 12).toLocaleString()}`, sub: 'Monthly avg', clr: '#a78bfa', icon: <TrendingUp size={20} /> },
          ].map(({ label, value, sub, clr, icon }) => (
            <div key={label} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span className="text-sm text-muted">{label}</span>
                <div style={{ color: clr }}>{icon}</div>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: clr, letterSpacing: '-0.04em' }}>{value}</div>
              <div className="text-xs text-muted" style={{ marginTop: 4 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Revenue Streams — Internshala Model */}
        <div className="card" style={{ marginBottom: 32, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--clr-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Platform Revenue Model</h2>
              <p className="text-sm text-muted">How HireStorm earns — modelled after Internshala, LinkedIn, and Indeed</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(79,126,248,0.1)', borderRadius: 20, fontSize: '0.78rem', color: 'var(--clr-primary)', fontWeight: 600 }}>
              <Info size={13} /> Click any stream for details
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
            {revenueByType.map((stream, i) => (
              <div
                key={stream.name}
                onClick={() => setActiveStream(activeStream === i ? null : i)}
                style={{
                  padding: 22, cursor: 'pointer',
                  borderRight: (i + 1) % 3 !== 0 ? '1px solid var(--clr-border)' : 'none',
                  borderBottom: i < 3 ? '1px solid var(--clr-border)' : 'none',
                  background: activeStream === i ? `${stream.color}08` : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${stream.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stream.color }}>
                    {stream.icon}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: stream.color }}>₹{stream.total.toLocaleString()}</div>
                    <div className="text-xs text-muted">{stream.count} txns</div>
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{stream.name}</div>
                <div className="text-xs text-muted">{stream.desc}</div>
                {activeStream === i && (
                  <div style={{ marginTop: 12, padding: 10, background: `${stream.color}10`, borderRadius: 6, fontSize: '0.8rem', color: 'var(--clr-text-2)', lineHeight: 1.6 }}>
                    {stream.model}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Bar Chart (visual) */}
        <div className="card" style={{ marginBottom: 32, padding: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Revenue by Stream</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {revenueByType.sort((a, b) => b.total - a.total).map(stream => {
              const pct = totalRevenue ? Math.round((stream.total / totalRevenue) * 100) : 0;
              return (
                <div key={stream.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ color: stream.color }}>{stream.icon}</div>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{stream.name}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>₹{stream.total.toLocaleString()} <span className="text-muted" style={{ fontWeight: 400 }}>({pct}%)</span></div>
                  </div>
                  <div style={{ height: 8, background: 'var(--clr-surface-2)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: stream.color, borderRadius: 8, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaction Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--clr-border)' }}>
            <h3 style={{ fontWeight: 700 }}>All Transactions</h3>
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: 200, borderRadius: 0 }} />
          ) : transactions.length === 0 ? (
            <div className="empty-state" style={{ padding: 48 }}>
              <CreditCard size={40} style={{ color: 'var(--clr-text-3)', marginBottom: 12 }} />
              <h3>No Transactions Yet</h3>
              <p className="text-muted">Payments will appear here as users make purchases.</p>
            </div>
          ) : (
            <div className="table-wrap" style={{ borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>User</th>
                    <th>Stream</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 50).map(t => (
                    <tr key={t._id}>
                      <td className="text-sm" style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--clr-text-2)' }}>
                        {t.razorpayOrderId?.slice(0, 20) || t._id?.slice(-8)}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{t.user?.profile?.firstName} {t.user?.profile?.lastName}</div>
                        {t.company && <div className="text-xs text-muted">{t.company.name}</div>}
                      </td>
                      <td>
                        <span className={`badge ${TYPE_COLORS[t.type] || 'badge-gray'}`} style={{ fontSize: '0.72rem' }}>
                          {(t.type || 'OTHER').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>₹{(t.amount || 0).toLocaleString()}</td>
                      <td className="text-sm text-muted">{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                      <td>
                        {t.status === 'SUCCESS'
                          ? <span className="badge badge-green"><CheckCircle2 size={11} /> Success</span>
                          : t.status === 'FAILED'
                          ? <span className="badge badge-red"><XCircle size={11} /> Failed</span>
                          : <span className="badge badge-yellow"><Clock size={11} /> Pending</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
