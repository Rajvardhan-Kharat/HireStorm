import React, { useState } from 'react';
import CompanyLayout from '../../layouts/CompanyLayout';
import { Check, Star, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';

export default function CompanyPricing() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      name: 'Free',
      price: 0,
      tier: 'FREE',
      icon: <Star size={24} color="#6b7280" />,
      features: ['Basic Job Postings', 'Standard Support', 'Up to 50 Applicants/Job'],
      buttonText: 'Current Plan',
      isCurrent: user?.company?.subscription?.tier === 'FREE' || !user?.company?.subscription?.tier
    },
    {
      name: 'Growth',
      price: 4999,
      tier: 'GROWTH',
      icon: <Zap size={24} color="var(--clr-primary)" />,
      features: ['3 Top Listing Slots', 'Bulk Hiring Tools', 'Premium ATS', 'Candidate DB Access', 'Hackathon Hosting'],
      buttonText: 'Upgrade to Growth',
      isCurrent: user?.company?.subscription?.tier === 'GROWTH',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 14999,
      tier: 'ENTERPRISE',
      icon: <Star size={24} color="var(--clr-accent)" />,
      features: ['10 Top Listing Slots', 'Everything in Growth', 'Dedicated Account Manager', 'Custom API Integrations'],
      buttonText: 'Upgrade to Enterprise',
      isCurrent: user?.company?.subscription?.tier === 'ENTERPRISE'
    }
  ];

  const handleUpgrade = async (tier, price) => {
    if (price === 0) return;
    setLoading(true);
    try {
      const orderRes = await api.post('/payments/create-order', {
        type: 'COMPANY_TIER_UPGRADE',
        amount: price,
        metadata: { tier }
      });
      const { order, transactionId } = orderRes.data;

      toast.loading('Processing demo payment...', { id: 'payment' });
      const verifyRes = await api.post('/payments/verify', {
        razorpayOrderId: order.id,
        transactionId
      });

      if (verifyRes.data.success) {
        toast.success('Successfully upgraded plan!', { id: 'payment' });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error('Payment failed', { id: 'payment' });
      }
    } catch (err) {
      toast.error('Could not process payment', { id: 'payment' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <CompanyLayout>
      <div className="page" style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div className="page-header" style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Upgrade Your Hiring</h1>
          <p className="text-muted" style={{ fontSize: '1.1rem', maxWidth: 600, margin: '0 auto' }}>
            Choose the right plan for your company to unlock premium features and hire the best talent faster.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {plans.map((plan) => (
            <div key={plan.name} className="card" style={{ 
              padding: 30, 
              display: 'flex', 
              flexDirection: 'column',
              position: 'relative',
              border: plan.popular ? '2px solid var(--clr-primary)' : '1px solid var(--clr-border)',
              transform: plan.popular ? 'scale(1.02)' : 'none'
            }}>
              {plan.popular && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--clr-primary)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700 }}>
                  MOST POPULAR
                </div>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--clr-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {plan.icon}
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{plan.name}</h3>
              </div>

              <div style={{ marginBottom: 30 }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>₹{plan.price.toLocaleString()}</span>
                <span className="text-muted">/month</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px', flex: 1 }}>
                {plan.features.map((feature, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontSize: '0.95rem' }}>
                    <Check size={16} style={{ color: 'var(--clr-success)' }} />
                    {feature}
                  </li>
                ))}
              </ul>

              <button 
                className={`btn w-full ${plan.isCurrent ? 'btn-outline' : plan.popular ? 'btn-primary' : 'btn-outline'}`}
                disabled={plan.isCurrent || loading}
                onClick={() => handleUpgrade(plan.tier, plan.price)}
              >
                {plan.isCurrent ? 'Current Plan' : loading ? 'Processing...' : plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </CompanyLayout>
  );
}
