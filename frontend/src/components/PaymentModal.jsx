/**
 * PaymentModal — reusable payment checkout UI for all company payment flows.
 * Simulates UPI / Card / NetBanking. On success calls onSuccess(transactionId).
 *
 * Usage:
 *   <PaymentModal
 *     open={true}
 *     amount={9999}
 *     description="Hackathon Hosting Fee"
 *     itemName="InnoHack 2025"
 *     type="HACKATHON_SPONSOR"          // transaction type
 *     metadata={{ ... }}
 *     onSuccess={() => { /* proceed */ }}
 *     onClose={() => setShowPayment(false)}
 *   />
 */
import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  X, CreditCard, Smartphone, Building2,
  CheckCircle2, Lock, IndianRupee, Loader2,
} from 'lucide-react';

const BANKS = [
  'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
  'Kotak Mahindra Bank', 'Bank of Baroda', 'Punjab National Bank', 'Yes Bank',
];

const METHOD_TABS = [
  { id: 'upi',    label: 'UPI',          icon: <Smartphone size={15}/> },
  { id: 'card',   label: 'Card',         icon: <CreditCard size={15}/> },
  { id: 'netbanking', label: 'Net Banking', icon: <Building2 size={15}/> },
];

function formatCard(v) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(v) {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
}

export default function PaymentModal({ open, amount, description, itemName, type, metadata, onSuccess, onClose }) {
  const [method, setMethod] = useState('upi');
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  // UPI
  const [upiId, setUpiId] = useState('');
  // Card
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  // NetBanking
  const [bank, setBank] = useState('');

  if (!open) return null;

  const canPay = () => {
    if (method === 'upi')        return upiId.includes('@');
    if (method === 'card')       return card.number.replace(/\s/g, '').length === 16 && card.expiry.length === 5 && card.cvv.length >= 3 && card.name;
    if (method === 'netbanking') return !!bank;
    return false;
  };

  const handlePay = async () => {
    if (!canPay()) { toast.error('Please fill in all payment details'); return; }
    setPaying(true);
    try {
      // Simulate 1.5s processing delay
      await new Promise(r => setTimeout(r, 1500));

      // Record transaction in DB
      await api.post('/payments/create-order', {
        type,
        amount,
        metadata: { ...metadata, paymentMethod: method, description },
      });

      setPaid(true);
      setTimeout(() => {
        onSuccess?.();
      }, 1800);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Please try again.');
      setPaying(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => !paying && !paid && onClose?.()}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}
      >
        {/* Modal */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 460,
            background: 'var(--clr-surface)',
            borderRadius: 'var(--r-lg)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            overflow: 'hidden',
            animation: 'fadeUp 0.22s ease',
          }}
        >
          {/* ── Success screen ── */}
          {paid ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(34,197,94,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <CheckCircle2 size={36} style={{ color: '#22c55e' }}/>
              </div>
              <h2 style={{ fontWeight: 800, marginBottom: 8 }}>Payment Successful!</h2>
              <p className="text-muted text-sm">
                ₹{amount.toLocaleString('en-IN')} paid for <strong>{itemName}</strong>
              </p>
              <p className="text-xs text-muted" style={{ marginTop: 12 }}>Redirecting...</p>
            </div>
          ) : (
            <>
              {/* ── Header ── */}
              <div style={{
                padding: '18px 24px',
                background: 'linear-gradient(135deg, var(--clr-primary), #6d28d9)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              }}>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 600, marginBottom: 4 }}>
                    SECURE CHECKOUT
                  </div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>{description}</div>
                  <div style={{ color: '#fff', fontWeight: 900, fontSize: '1.8rem', letterSpacing: '-0.04em', marginTop: 2 }}>
                    ₹{amount.toLocaleString('en-IN')}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#fff' }}
                >
                  <X size={16}/>
                </button>
              </div>

              {/* ── Item label ── */}
              <div style={{
                padding: '10px 24px',
                background: 'var(--clr-surface-2)',
                borderBottom: '1px solid var(--clr-border)',
                fontSize: '0.82rem',
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span className="text-muted">For: <strong style={{ color: 'var(--clr-text)' }}>{itemName}</strong></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--clr-success)', fontSize: '0.75rem', fontWeight: 600 }}>
                  <Lock size={10}/> 256-bit SSL
                </span>
              </div>

              <div style={{ padding: '20px 24px' }}>
                {/* ── Method tabs ── */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  {METHOD_TABS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      style={{
                        flex: 1, padding: '8px 4px', borderRadius: 'var(--r-sm)',
                        border: `2px solid ${method === m.id ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                        background: method === m.id ? 'rgba(79,126,248,0.1)' : 'transparent',
                        color: method === m.id ? 'var(--clr-primary)' : 'var(--clr-text-2)',
                        fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        transition: 'all 0.15s',
                      }}
                    >
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>

                {/* ── UPI ── */}
                {method === 'upi' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{
                      background: 'var(--clr-surface-2)', borderRadius: 'var(--r-md)',
                      padding: 20, textAlign: 'center', border: '1px dashed var(--clr-border)',
                    }}>
                      {/* QR code placeholder */}
                      <div style={{
                        width: 120, height: 120, margin: '0 auto 12px',
                        background: 'linear-gradient(135deg, #1e1e2e, #2a2a3e)',
                        borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid var(--clr-border)',
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, padding: 8 }}>
                          {Array.from({ length: 49 }, (_, i) => (
                            <div key={i} style={{
                              width: 10, height: 10, borderRadius: 1,
                              background: Math.random() > 0.5 ? 'var(--clr-primary)' : 'transparent',
                            }}/>
                          ))}
                        </div>
                      </div>
                      <div className="text-xs text-muted">Scan with any UPI app</div>
                      <div className="text-xs text-muted" style={{ marginTop: 4 }}>or</div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Enter UPI ID</label>
                      <input
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                        placeholder="yourname@upi"
                        autoFocus
                      />
                      {upiId && !upiId.includes('@') && (
                        <div className="form-hint" style={{ color: 'var(--clr-error)' }}>Enter a valid UPI ID (e.g. name@okaxis)</div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Card ── */}
                {method === 'card' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Card Number</label>
                      <input
                        value={card.number}
                        onChange={e => setCard(p => ({ ...p, number: formatCard(e.target.value) }))}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        autoFocus
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Expiry</label>
                        <input
                          value={card.expiry}
                          onChange={e => setCard(p => ({ ...p, expiry: formatExpiry(e.target.value) }))}
                          placeholder="MM/YY"
                          maxLength={5}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>CVV</label>
                        <input
                          value={card.cvv}
                          onChange={e => setCard(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                          placeholder="•••"
                          type="password"
                          maxLength={4}
                        />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Name on Card</label>
                      <input
                        value={card.name}
                        onChange={e => setCard(p => ({ ...p, name: e.target.value }))}
                        placeholder="VIKRAM NAIR"
                      />
                    </div>
                  </div>
                )}

                {/* ── Net Banking ── */}
                {method === 'netbanking' && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                      {BANKS.slice(0, 6).map(b => (
                        <button
                          key={b}
                          onClick={() => setBank(b)}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 'var(--r-sm)',
                            border: `2px solid ${bank === b ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                            background: bank === b ? 'rgba(79,126,248,0.1)' : 'transparent',
                            cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                            color: bank === b ? 'var(--clr-primary)' : 'var(--clr-text-2)',
                            textAlign: 'left', transition: 'all 0.15s',
                          }}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Or select another bank</label>
                      <select value={bank} onChange={e => setBank(e.target.value)}>
                        <option value="">— Choose bank —</option>
                        {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* ── Pay button ── */}
                <button
                  className="btn btn-primary w-full"
                  onClick={handlePay}
                  disabled={paying || !canPay()}
                  style={{ marginTop: 24, gap: 8, fontSize: '1rem', padding: '13px 20px' }}
                >
                  {paying
                    ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }}/> Processing...</>
                    : <><Lock size={14}/> Pay ₹{amount.toLocaleString('en-IN')}</>
                  }
                </button>

                <p className="text-xs text-muted" style={{ textAlign: 'center', marginTop: 12 }}>
                  🔒 This is a simulated payment — no real money is charged
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
