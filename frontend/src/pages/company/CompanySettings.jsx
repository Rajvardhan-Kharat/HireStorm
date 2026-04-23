import { useEffect, useState } from 'react';
import CompanyLayout from '../../layouts/CompanyLayout';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { Building2, Save, Globe, Mail, Phone } from 'lucide-react';

export default function CompanySettings() {
  const { user } = useAuthStore();
  const [form, setForm] = useState({ name:'', industry:'', website:'', description:'', email:'', phone:'' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/auth/me')
      .then(r => {
        const c = r.data.user?.company || {};
        setForm({
          name:        c.name        || '',
          industry:    c.industry    || '',
          website:     c.website     || '',
          description: c.description || '',
          email:       c.email       || r.data.user?.email || '',
          phone:       c.phone       || '',
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/company', form);
      toast.success('Company profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Could not save'); }
    finally { setSaving(false); }
  };

  return (
    <CompanyLayout>
      <div className="page page-sm">
        <div className="page-header">
          <h1>Company Settings</h1>
          <p className="text-muted">Manage your company profile and billing</p>
        </div>

        <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {/* Company Profile */}
          <div className="card">
            <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:24 }}>
              <div style={{
                width:60, height:60, borderRadius:'var(--r-md)',
                background:'linear-gradient(135deg, var(--clr-primary-dim), var(--clr-accent-dim))',
                border:'1.5px solid var(--clr-primary)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'1.4rem', fontWeight:800, color:'var(--clr-primary)'
              }}>
                {form.name?.[0] || <Building2 size={24}/>}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:'1.05rem' }}>{form.name || 'Your Company'}</div>
                <span className="badge badge-blue" style={{ marginTop:4 }}>{user?.role?.replace(/_/g,' ')}</span>
              </div>
            </div>

            <h3 style={{ fontWeight:700, marginBottom:16 }}>Company Information</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Company Name</label>
                  <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Your company name"/>
                </div>
                <div className="form-group">
                  <label>Industry</label>
                  <input value={form.industry} onChange={e=>setForm(p=>({...p,industry:e.target.value}))} placeholder="e.g. Technology, Finance"/>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Contact Email</label>
                  <div className="input-with-icon"><Mail size={14}/>
                    <input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="hr@yourcompany.com"/>
                  </div>
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <div className="input-with-icon"><Phone size={14}/>
                    <input value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="+91 9999999999"/>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Website</label>
                <div className="input-with-icon"><Globe size={14}/>
                  <input value={form.website} onChange={e=>setForm(p=>({...p,website:e.target.value}))} placeholder="https://yourcompany.com"/>
                </div>
              </div>
              <div className="form-group">
                <label>About the Company</label>
                <textarea rows={4} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Tell students about your company culture, vision, and what makes you a great place to work..."/>
              </div>
            </div>
          </div>

          {/* Billing Info */}
          <div className="card">
            <h3 style={{ fontWeight:700, marginBottom:6 }}>Billing & Verification</h3>
            <p className="text-sm text-muted" style={{ marginBottom:16 }}>Company verification helps build trust with candidates</p>
            <div style={{ display:'flex', gap:12, padding:'14px 16px', background:'var(--clr-surface-2)', border:'1px solid var(--clr-border)', borderRadius:'var(--r-sm)' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, marginBottom:2 }}>Verification Status</div>
                <div className="text-sm text-muted">Verified companies get a ✓ badge on all listings</div>
              </div>
              <span className={`badge ${user?.company?.isVerified ? 'badge-green' : 'badge-yellow'}`}>
                {user?.company?.isVerified ? '✓ Verified' : 'Pending'}
              </span>
            </div>
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving || loading}>
              {saving ? <span className="spinner"/> : <><Save size={14}/> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </CompanyLayout>
  );
}
