import React, { useState } from 'react';
import CompanyLayout from '../../layouts/CompanyLayout';
import { Check, Star, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import PaymentModal from '../../components/PaymentModal';

export default function CompanyPricing() {
  const { user } = useAuthStore();
  const [showPayment, setShowPayment] = useState(false);
  const [activePlan, setActivePlan] = useState(null);

  const plans = [
    {
      name: 'Free',
      price: 0,
      tier: 'FREE',
      icon: <Star size={24} color="#6b7280" />,
      features: ['3 Job Postings/month', 'Standard Support', 'Up to 50 Applicants/Job', 'Basic Dashboard'],
      buttonText: 'Current Plan',
      isCurrent: user?.company?.subscription?.tier === 'FREE' || !user?.company?.subscription?.tier,
    },
    {
      name: 'Starter',
      price: 4999,
      tier: 'STARTER',
      icon: <Zap size={24} color="#22c55e" />,
      features: ['5 Top Listing Slots', 'Premium ATS', 'Up to 500 Applicants/Job', 'Analytics Dashboard'],
      buttonText: 'Upgrade to Starter',
      isCurrent: user?.company?.subscription?.tier === 'STARTER',
    },
    {
      name: 'Growth',
      price: 9999,
      tier: 'GROWTH',
      icon: <Zap size={24} color="var(--clr-primary)" />,
      features: ['10 Top Listing Slots', 'Bulk Hiring Tools', 'Premium ATS', 'Candidate DB Access', 'Hackathon Co-hosting'],
      buttonText: 'Upgrade to Growth',
      isCurrent: user?.company?.subscription?.tier === 'GROWTH',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 24999,
      tier: 'ENTERPRISE',
      icon: <Star size={24} color="var(--clr-accent)" />,
      features: ['Unlimited Listing Slots', 'Everything in Growth', 'Dedicated Account Manager', 'Custom API Integrations', 'White-label Reports'],
      buttonText: 'Upgrade to Enterprise',
      isCurrent: user?.company?.subscription?.tier === 'ENTERPRISE',
    },
  ];

  const handleUpgrade = (plan) => {
    if (plan.price === 0 || plan.isCurrent) return;
    setActivePlan(plan);
    setShowPayment(true);
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
              transform: plan.popular ? 'scale(1.02)' : 'none',
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
                disabled={plan.isCurrent || plan.price === 0}
                onClick={() => handleUpgrade(plan)}
              >
                {plan.isCurrent ? 'Current Plan' : plan.buttonText}
              </button>
            </div>
          ))}
      </div>

        {/* Company PRO Add-on */}
        <div style={{ marginTop: 60, padding: 30, background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.02))', border: '1px solid var(--clr-primary)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Star size={28} color="#8b5cf6" fill="#8b5cf6" />
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: '#8b5cf6' }}>Company PRO Add-on</h2>
            </div>
            <p style={{ fontSize: '1.05rem', margin: 0, maxWidth: 600 }}>
              Supercharge your hiring with Company PRO. Unlock verified badges, priority support, and advanced candidate filtering.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>₹15,000</div>
              <div className="text-muted" style={{ fontSize: '0.9rem' }}>One-time / Lifetime</div>
            </div>
            {user?.company?.isPro ? (
              <button className="btn btn-outline" disabled style={{ color: '#8b5cf6', borderColor: '#8b5cf6' }}>
                <Check size={18} style={{ marginRight: 6 }} /> PRO Active
              </button>
            ) : (
              <button 
                className="btn" 
                style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '12px 24px', fontSize: '1rem' }}
                onClick={() => {
                  setActivePlan({ name: 'Company PRO', price: 15000, type: 'COMPANY_PRO_SUBSCRIPTION', metadata: {} });
                  setShowPayment(true);
                }}
              >
                Get Company PRO
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment modal — opens when a paid plan is selected */}
      {activePlan && (
        <PaymentModal
          open={showPayment}
          amount={activePlan.price}
          description={`HireStorm ${activePlan.name}`}
          itemName={activePlan.name}
          type={activePlan.type || "COMPANY_TIER_UPGRADE"}
          metadata={activePlan.metadata || { tier: activePlan.tier }}
          onSuccess={() => {
            setShowPayment(false);
            toast.success(`✅ Upgraded to ${activePlan.name}! Refreshing...`);
            setTimeout(() => window.location.reload(), 1500);
          }}
          onClose={() => {
            setShowPayment(false);
            setActivePlan(null);
          }}
        />
      )}
    </CompanyLayout>
  );
}
