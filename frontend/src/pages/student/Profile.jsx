import { useEffect, useState } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { User, Mail, Link2, GitFork, Globe, Plus, X, Save, Edit3, Code2 } from 'lucide-react';

export default function Profile() {
  const { user, setAuth, accessToken } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editSection, setEditSection] = useState(null);
  const [form, setForm] = useState({});
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    api.get('/auth/me')
      .then(r => {
        const u = r.data.user;
        setProfile(u);
        setForm({
          firstName:   u.profile?.firstName || '',
          lastName:    u.profile?.lastName  || '',
          bio:         u.profile?.bio       || '',
          phone:       u.profile?.phone     || '',
          linkedin:    u.profile?.linkedin  || '',
          github:      u.profile?.github    || '',
          portfolio:   u.profile?.portfolio || '',
          institution: u.profile?.institution || '',
          degree:      u.profile?.degree    || '',
          skills:      u.skills             || [],
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', {
        profile: {
          firstName: form.firstName, lastName: form.lastName,
          bio: form.bio, phone: form.phone,
          linkedin: form.linkedin, github: form.github,
          portfolio: form.portfolio, institution: form.institution, degree: form.degree,
        },
        skills: form.skills,
      });
      setProfile(data.user);
      setAuth(data.user, accessToken);
      setEditSection(null);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save');
    } finally { setSaving(false); }
  };

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !form.skills.includes(s)) {
      setForm(p => ({ ...p, skills: [...p.skills, s] }));
      setNewSkill('');
    }
  };
  const removeSkill = (s) => setForm(p => ({ ...p, skills: p.skills.filter(x => x !== s) }));

  const completeness = () => {
    const fields = [form.firstName, form.lastName, form.bio, form.linkedin, form.institution, form.degree];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  if (loading) return (
    <StudentLayout>
      <div className="page">
        <div style={{ display:'flex', gap:24 }}>
          <div className="skeleton" style={{ width:280, height:400, borderRadius:'var(--r-md)' }}/>
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:16 }}>
            <div className="skeleton" style={{ height:120, borderRadius:'var(--r-md)' }}/>
            <div className="skeleton" style={{ height:200, borderRadius:'var(--r-md)' }}/>
          </div>
        </div>
      </div>
    </StudentLayout>
  );

  const initials = [form.firstName?.[0], form.lastName?.[0]].filter(Boolean).join('').toUpperCase();
  const pct = completeness();

  return (
    <StudentLayout>
      <div className="page">
        <div className="page-header-row">
          <div className="page-header" style={{ marginBottom:0 }}>
            <h1>My Profile</h1>
            <p className="text-muted">Manage your professional information</p>
          </div>
          {editSection && (
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-ghost" onClick={() => setEditSection(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
                {saving ? <span className="spinner"/> : <><Save size={14}/> Save Changes</>}
              </button>
            </div>
          )}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:24, alignItems:'start' }}>
          {/* Left Column */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Avatar Card */}
            <div className="card" style={{ textAlign:'center' }}>
              <div style={{
                width:80, height:80, borderRadius:'50%',
                background:'linear-gradient(135deg, var(--clr-primary-dim), var(--clr-accent-dim))',
                border:'3px solid var(--clr-primary)',
                display:'flex', alignItems:'center', justifyContent:'center',
                margin:'0 auto 14px',
                fontSize:'1.6rem', fontWeight:800, color:'var(--clr-primary)'
              }}>{initials || <User size={32}/>}</div>
              <div style={{ fontWeight:800, fontSize:'1.05rem' }}>{form.firstName} {form.lastName}</div>
              <div className="text-sm text-muted" style={{ marginBottom:12 }}>{profile?.email}</div>
              <span className="badge badge-blue">{profile?.role?.replace(/_/g, ' ')}</span>
            </div>

            {/* Completeness */}
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontWeight:700, fontSize:'0.82rem' }}>Profile Strength</span>
                <span style={{ fontWeight:800, color: pct >= 80 ? 'var(--clr-success)' : 'var(--clr-primary)' }}>{pct}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width:`${pct}%` }}/>
              </div>
              <div className="text-xs text-dimmed" style={{ marginTop:8 }}>
                {pct < 100 ? 'Complete your profile to stand out to companies' : '🎉 Profile complete!'}
              </div>
            </div>

            {/* Social Links */}
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <h4 style={{ fontWeight:700, fontSize:'0.9rem' }}>Links</h4>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditSection('links')}><Edit3 size={13}/></button>
              </div>
              {editSection === 'links' ? (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {[
                    { key:'linkedin', placeholder:'LinkedIn URL', icon:<Link2 size={13}/> },
                    { key:'github',   placeholder:'GitHub URL',   icon:<GitFork size={13}/> },
                    { key:'portfolio',placeholder:'Portfolio URL',icon:<Globe size={13}/> },
                  ].map(({ key, placeholder, icon }) => (
                    <div key={key} className="form-group">
                      <div className="input-with-icon">{icon}
                        <input value={form[key]} onChange={e => setForm(p=>({...p,[key]:e.target.value}))} placeholder={placeholder}/>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {[
                    { url:form.linkedin, icon:<Link2 size={14}/>, label:'LinkedIn' },
                    { url:form.github,   icon:<GitFork size={14}/>,  label:'GitHub' },
                    { url:form.portfolio,icon:<Globe size={14}/>,    label:'Portfolio' },
                  ].map(({ url, icon, label }) => url ? (
                    <a key={label} href={url} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.82rem', color:'var(--clr-primary)' }}>
                      {icon}{label}
                    </a>
                  ) : (
                    <div key={label} style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.82rem' }} className="text-dimmed">
                      {icon}{label} <span style={{ marginLeft:'auto' }}>—</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* About */}
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <h3 style={{ fontWeight:700 }}>Personal Info</h3>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditSection('info')}><Edit3 size={13}/></button>
              </div>
              {editSection === 'info' ? (
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <div className="form-row">
                    <div className="form-group"><label>First Name</label><input value={form.firstName} onChange={e=>setForm(p=>({...p,firstName:e.target.value}))}/></div>
                    <div className="form-group"><label>Last Name</label><input value={form.lastName} onChange={e=>setForm(p=>({...p,lastName:e.target.value}))}/></div>
                  </div>
                  <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="+91 9999999999"/></div>
                  <div className="form-group"><label>Bio</label><textarea rows={4} value={form.bio} onChange={e=>setForm(p=>({...p,bio:e.target.value}))} placeholder="Tell companies about yourself..."/></div>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <div>
                    <div className="text-xs text-dimmed" style={{ marginBottom:3 }}>FULL NAME</div>
                    <div style={{ fontWeight:600 }}>{form.firstName} {form.lastName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-dimmed" style={{ marginBottom:3 }}>EMAIL</div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.9rem' }}><Mail size={13}/>{profile?.email}</div>
                  </div>
                  {form.bio && (
                    <div>
                      <div className="text-xs text-dimmed" style={{ marginBottom:3 }}>BIO</div>
                      <div className="text-sm text-muted" style={{ lineHeight:1.7 }}>{form.bio}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Education */}
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <h3 style={{ fontWeight:700 }}>Education</h3>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditSection('edu')}><Edit3 size={13}/></button>
              </div>
              {editSection === 'edu' ? (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <div className="form-group"><label>Institution</label><input value={form.institution} onChange={e=>setForm(p=>({...p,institution:e.target.value}))} placeholder="IIT Delhi, BITS Pilani..."/></div>
                  <div className="form-group"><label>Degree</label><input value={form.degree} onChange={e=>setForm(p=>({...p,degree:e.target.value}))} placeholder="B.Tech Computer Science"/></div>
                </div>
              ) : (
                <div>
                  {form.institution ? (
                    <div>
                      <div style={{ fontWeight:600 }}>{form.institution}</div>
                      <div className="text-sm text-muted">{form.degree}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-dimmed">No education info added yet</div>
                  )}
                </div>
              )}
            </div>

            {/* Skills */}
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <h3 style={{ fontWeight:700 }}>Skills</h3>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditSection('skills')}><Edit3 size={13}/></button>
              </div>
              {editSection === 'skills' ? (
                <div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:14 }}>
                    {form.skills.map(s => (
                      <span key={s} className="chip" style={{ gap:6 }}>
                        {s}
                        <button onClick={() => removeSkill(s)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--clr-text-3)', padding:0, display:'flex' }}><X size={12}/></button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <input
                      value={newSkill}
                      onChange={e => setNewSkill(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addSkill()}
                      placeholder="Add skill (e.g. React, Python)"
                      style={{ flex:1 }}
                    />
                    <button className="btn btn-outline btn-sm" onClick={addSkill}><Plus size={13}/></button>
                  </div>
                </div>
              ) : (
                form.skills.length > 0 ? (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {form.skills.map(s => <span key={s} className="tag active" style={{ cursor:'default' }}><Code2 size={11}/>{s}</span>)}
                  </div>
                ) : (
                  <div className="text-sm text-dimmed">No skills added yet</div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
