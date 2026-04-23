import { useState } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { Zap, Check, Star, Shield, ArrowRight } from 'lucide-react';

const PLANS = [
  {
    id:    'free',
    name:  'Free',
    price: 0,
    desc:  'Get started with the basics',
    badge: null,
    features: [
      'Browse all listings',
      'Apply to internships & jobs',
      'Basic profile',
      'Hackathon participation',
      'Course enrollment',
    ],
    striked: [
      'Profile analytics',
      'Priority shortlisting',
      'Resume AI feedback',
      'Early access to listings',
    ],
    cta:   'Current Plan',
    color: 'var(--clr-text-3)',
  },
  {
    id:    'pro',
    name:  'PRO',
    price: 299,
    desc:  'For serious job seekers',
    badge: 'Most Popular',
    features: [
      'Everything in Free',
      '⚡ Profile highlights in listings',
      '📊 Profile view analytics',
      '🎯 Priority shortlisting badge',
      '🤖 AI resume feedback',
      '🔔 Early access to new listings',
      '💼 Unlimited applications',
    ],
    striked: [],
    cta:   'Upgrade to PRO',
    color: 'var(--clr-primary)',
  },
];

export default function Subscription() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const isPro = ['PRO_STUDENT', 'INTERN'].includes(user?.role);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/payments/create-order', { type: 'PRO_SUBSCRIPTION' });
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
        amount: data.order.amount,
        currency: 'INR',
        name: 'HireStorm PRO',
        description: 'Monthly PRO Subscription',
        order_id: data.order.id,
        handler: async (response) => {
          try {
            await api.post('/payments/verify', response);
            toast.success('🎉 Welcome to PRO! Refresh to see your benefits.');
            window.location.reload();
          } catch { toast.error('Payment verification failed. Contact support.'); }
        },
        prefill: { email: user?.email, name: `${user?.profile?.firstName} ${user?.profile?.lastName}` },
        theme: { color: '#4f7ef8' },
      };
      if (window.Razorpay) { new window.Razorpay(options).open(); }
      else {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => new window.Razorpay(options).open();
        document.body.appendChild(script);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not initiate payment');
    } finally { setLoading(false); }
  };

  return (
    <StudentLayout>
      <div className="page">
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', background:'var(--clr-primary-dim)', borderRadius:'var(--r-full)', marginBottom:16 }}>
            <Zap size={14} style={{ color:'var(--clr-primary)' }}/>
            <span style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--clr-primary)', letterSpacing:'0.05em' }}>UPGRADE YOUR CAREER</span>
          </div>
          <h1 style={{ fontSize:'2rem', fontWeight:900, letterSpacing:'-0.04em', marginBottom:12 }}>Choose your plan</h1>
          <p className="text-muted" style={{ maxWidth:480, margin:'0 auto' }}>
            HireStorm PRO gives you the competitive edge to land your dream internship faster
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, maxWidth:780, margin:'0 auto' }}>
          {PLANS.map(plan => (
            <div key={plan.id} style={{
              background:'var(--clr-surface)',
              border: plan.id === 'pro'
                ? '2px solid var(--clr-primary)'
                : '1px solid var(--clr-border)',
              borderRadius:'var(--r-lg)',
              padding:'32px 28px',
              position:'relative',
              transition:'transform 0.2s',
            }}>
              {plan.badge && (
                <div style={{
                  position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)',
                  background:'linear-gradient(90deg,var(--clr-primary),var(--clr-accent))',
                  padding:'4px 18px', borderRadius:'var(--r-full)',
                  fontSize:'0.7rem', fontWeight:700, color:'#fff', whiteSpace:'nowrap'
                }}>{plan.badge}</div>
              )}

              <div style={{ marginBottom:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  {plan.id === 'pro' && <Star size={16} style={{ color:'var(--clr-primary)' }}/>}
                  <span style={{ fontWeight:800, fontSize:'1.15rem' }}>{plan.name}</span>
                </div>
                <div style={{ marginBottom:8 }}>
                  <span style={{ fontSize:'2.4rem', fontWeight:900, letterSpacing:'-0.05em', color: plan.color }}>
                    {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                  </span>
                  {plan.price > 0 && <span className="text-muted" style={{ fontSize:'0.85rem' }}>/month</span>}
                </div>
                <p className="text-sm text-muted">{plan.desc}</p>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                    <Check size={14} style={{ color:'var(--clr-success)', flexShrink:0, marginTop:2 }}/>
                    <span style={{ fontSize:'0.875rem', color:'var(--clr-text-2)', lineHeight:1.5 }}>{f}</span>
                  </div>
                ))}
                {plan.striked.map(f => (
                  <div key={f} style={{ display:'flex', gap:8, alignItems:'flex-start', opacity:0.4 }}>
                    <div style={{ width:14, height:14, flexShrink:0, marginTop:2 }}/>
                    <span style={{ fontSize:'0.875rem', color:'var(--clr-text-3)', textDecoration:'line-through', lineHeight:1.5 }}>{f}</span>
                  </div>
                ))}
              </div>

              {plan.id === 'free' ? (
                <div className="btn w-full" style={{
                  background:'var(--clr-surface-2)', color:'var(--clr-text-3)',
                  border:'1px solid var(--clr-border)', justifyContent:'center', cursor:'default'
                }}>
                  {isPro ? 'Included in PRO' : 'Current Plan'}
                </div>
              ) : isPro ? (
                <div className="btn btn-primary w-full" style={{ justifyContent:'center', gap:8, cursor:'default' }}>
                  <Shield size={14}/> PRO Active
                </div>
              ) : (
                <button className="btn btn-primary btn-lg w-full" style={{ justifyContent:'center' }} onClick={handleUpgrade} disabled={loading}>
                  {loading ? <span className="spinner"/> : <>{plan.cta} <ArrowRight size={14}/></>}
                </button>
              )}
            </div>
          ))}
        </div>

        <div style={{ textAlign:'center', marginTop:32 }}>
          <p className="text-sm text-dimmed">🔒 Secure payment via Razorpay · Cancel anytime · No hidden fees</p>
        </div>
      </div>
    </StudentLayout>
  );
}
