import React, { useEffect, useState } from 'react';
import CompanyLayout from '../../layouts/CompanyLayout';
import api from '../../api/axios';
import {
  TrendingUp, Briefcase, Code2, BookOpen, Users, IndianRupee,
  ArrowUpRight, CreditCard, Star, CheckCircle2, Clock, Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Internshala-style revenue model explanation cards
const REVENUE_MODEL = [
  {
    icon: <Briefcase size={20} />,
    title: 'Job Listing Boost',
    price: '₹499 / listing',
    desc: 'Sponsor a job listing to appear at the top of search results with a "Featured" badge for 7 days.',
    color: 'var(--clr-primary)',
    cta: 'Boost a Listing',
    link: '/company/listings',
  },
  {
    icon: <Zap size={20} />,
    title: 'Company Subscription',
    price: '₹4,999–₹14,999/mo',
    desc: 'Upgrade from Free to Growth or Enterprise to unlock more job slots, candidate DB access, and hackathon hosting.',
    color: '#a78bfa',
    cta: 'Upgrade Plan',
    link: '/company/pricing',
  },
  {
    icon: <Code2 size={20} />,
    title: 'Hackathon Hosting',
    price: '₹9,999 / event',
    desc: 'Co-host a hackathon on HireStorm. Platform handles registrations, leaderboard, and talent pipeline automation.',
    color: '#f59e0b',
    cta: 'Host Hackathon',
    link: '/company/hackathons/new',
  },
  {
    icon: <BookOpen size={20} />,
    title: 'Course Revenue Share',
    price: '70% to you',
    desc: 'Publish sponsored or branded courses. You earn 70% of every enrollment fee — 30% goes to the platform.',
    color: 'var(--clr-success)',
    cta: 'Propose a Course',
    link: '/company/settings',
  },
  {
    icon: <Star size={20} />,
    title: 'Campus Connect',
    price: '₹2,499/month',
    desc: 'Get a verified "Campus Partner" badge and access campus talent pools for direct placement drives.',
    color: '#ec4899',
    cta: 'Get Badge',
    link: '/company/pricing',
  },
];

export default function CompanyAnalytics() {
  const [transactions, setTransactions] = useState([]);
  const [listings, setListings]         = useState([]);
  const [hackathons, setHackathons]     = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/transactions?limit=100').catch(() => ({ data: { data: [] } })),
      api.get('/company/listings').catch(() => ({ data: { data: [] } })),
      api.get('/hackathons/company/mine').catch(() => ({ data: { data: [] } })),
    ]).then(([txRes, lstRes, hackRes]) => {
      setTransactions(txRes.data.data || []);
      setListings(lstRes.data.data || []);
      setHackathons(hackRes.data.data || []);
      setLoading(false);
    });
  }, []);

  const myTxns    = transactions.filter(t => t.status === 'SUCCESS');
  const totalEarned = myTxns.reduce((s, t) => s + (t.amount || 0), 0);
  const totalApplicants = listings.reduce((s, l) => s + (l.applicationCount || 0), 0);
  const activeListings  = listings.filter(l => l.status === 'ACTIVE').length;

  return (
    <CompanyLayout>
      <div className="page">
        <div className="page-header">
          <h1>Analytics & Revenue</h1>
          <p className="text-muted">Track your hiring performance and platform spend. Discover how to get more ROI.</p>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Platform Spend', value: loading ? '...' : `₹${totalEarned.toLocaleString()}`, sub: 'All time', clr: 'var(--clr-primary)', icon: <IndianRupee size={18} /> },
            { label: 'Active Listings', value: loading ? '...' : activeListings, sub: `of ${listings.length} total`, clr: 'var(--clr-success)', icon: <Briefcase size={18} /> },
            { label: 'Total Applicants', value: loading ? '...' : totalApplicants, sub: 'All listings', clr: 'var(--clr-accent)', icon: <Users size={18} /> },
            { label: 'Hackathons Hosted', value: loading ? '...' : hackathons.length, sub: `${hackathons.filter(h => h.status !== 'DRAFT').length} live`, clr: '#f59e0b', icon: <Code2 size={18} /> },
          ].map(({ label, value, sub, clr, icon }) => (
            <div key={label} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span className="text-sm text-muted">{label}</span>
                <div style={{ color: clr }}>{icon}</div>
              </div>
              <div style={{ fontSize: '1.7rem', fontWeight: 900, color: clr, letterSpacing: '-0.04em' }}>{value}</div>
              <div className="text-xs text-muted" style={{ marginTop: 4 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Hiring Funnel */}
        <div className="card" style={{ marginBottom: 28, padding: 24 }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 20 }}>Hiring Funnel</h2>
          {listings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p className="text-muted text-sm">No listings yet.</p>
              <Link to="/company/listings/new" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Post a Job</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {listings.slice(0, 5).map(l => {
                const applicants = l.applicationCount || 0;
                return (
                  <div key={l._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: '0.88rem' }}>
                      <span style={{ fontWeight: 600 }}>{l.title}</span>
                      <div style={{ display: 'flex', gap: 12, color: 'var(--clr-text-2)' }}>
                        <span><Users size={12} style={{ display: 'inline', marginRight: 4 }} />{applicants} applicants</span>
                        <span className={`badge ${l.status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>{l.status}</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: 'var(--clr-surface-2)', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, applicants * 5)}%`, background: 'var(--clr-primary)', borderRadius: 6, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Spend Transactions */}
        {myTxns.length > 0 && (
          <div className="card" style={{ marginBottom: 28, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--clr-border)' }}>
              <h3 style={{ fontWeight: 700 }}>Your Transactions</h3>
            </div>
            <div className="table-wrap" style={{ borderRadius: 0 }}>
              <table>
                <thead><tr><th>Type</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  {myTxns.slice(0, 8).map(t => (
                    <tr key={t._id}>
                      <td><span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>{(t.type || '').replace(/_/g, ' ')}</span></td>
                      <td style={{ fontWeight: 700 }}>₹{(t.amount || 0).toLocaleString()}</td>
                      <td className="text-sm text-muted">{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                      <td><span className="badge badge-green"><CheckCircle2 size={10} /> Paid</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Revenue Model Section */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--clr-border)' }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.05rem' }}>Grow Your Hiring — Revenue Model</h2>
            <p className="text-sm text-muted">How to get maximum ROI from HireStorm (Internshala-style).</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 0 }}>
            {REVENUE_MODEL.map((item, i) => (
              <div key={item.title} style={{
                padding: 22,
                borderRight: '1px solid var(--clr-border)',
                borderBottom: '1px solid var(--clr-border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                    {item.icon}
                  </div>
                  <div style={{ fontWeight: 800, color: item.color, fontSize: '0.88rem' }}>{item.price}</div>
                </div>
                <div style={{ fontWeight: 700, marginBottom: 6, fontSize: '0.92rem' }}>{item.title}</div>
                <div className="text-sm text-muted" style={{ marginBottom: 14, lineHeight: 1.6 }}>{item.desc}</div>
                <Link to={item.link} className="btn btn-outline btn-sm" style={{ gap: 6, fontSize: '0.8rem' }}>
                  {item.cta} <ArrowUpRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CompanyLayout>
  );
}
