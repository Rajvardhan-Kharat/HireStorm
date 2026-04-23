import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  MapPin, Clock, IndianRupee, Wifi, Calendar, Users,
  Briefcase, ArrowLeft, Building2, CheckCircle2, ExternalLink
} from 'lucide-react';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => {
    api.get(`/listings/${id}`)
      .then(r => { setListing(r.data.data); setLoading(false); })
      .catch(() => { toast.error('Listing not found'); navigate('/listings'); });
  }, [id]);

  const handleApply = async () => {
    setApplying(true);
    try {
      await api.post('/applications', { listing: id, coverLetter });
      setApplied(true);
      setShowModal(false);
      toast.success('Application submitted! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not apply. Try again.');
    } finally { setApplying(false); }
  };

  if (loading) return (
    <StudentLayout>
      <div className="page">
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div className="skeleton" style={{ height:32, width:'40%' }}/>
          <div className="skeleton" style={{ height:200, borderRadius:'var(--r-md)' }}/>
          <div className="skeleton" style={{ height:300, borderRadius:'var(--r-md)' }}/>
        </div>
      </div>
    </StudentLayout>
  );
  if (!listing) return null;

  const typeColor = listing.type === 'INTERNSHIP' ? 'badge-blue' : listing.type === 'JOB' ? 'badge-green' : 'badge-yellow';
  const deadlinePassed = listing.applicationDeadline && new Date(listing.applicationDeadline) < new Date();

  return (
    <StudentLayout>
      <div className="page">
        <button className="btn btn-ghost btn-sm" style={{ marginBottom:20, gap:6 }} onClick={() => navigate(-1)}>
          <ArrowLeft size={15}/> Back to listings
        </button>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:24, alignItems:'start' }}>
          {/* Main Content */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {/* Header Card */}
            <div className="card animate-fade-up">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16, marginBottom:20 }}>
                <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
                  <div style={{
                    width:56, height:56, borderRadius:'var(--r-sm)',
                    background:'var(--clr-surface-2)', border:'1px solid var(--clr-border)',
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0
                  }}>
                    {listing.company?.logo
                      ? <img src={listing.company.logo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'var(--r-sm)' }}/>
                      : <Building2 size={24} style={{ color:'var(--clr-text-3)' }}/>}
                  </div>
                  <div>
                    <h1 style={{ fontSize:'1.4rem', fontWeight:800, letterSpacing:'-0.02em', marginBottom:4 }}>{listing.title}</h1>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontWeight:600, color:'var(--clr-text-2)' }}>{listing.company?.name}</span>
                      {listing.company?.isVerified && <span className="badge badge-blue">✓ Verified</span>}
                    </div>
                  </div>
                </div>
                <span className={`badge ${typeColor}`} style={{ fontSize:'0.8rem', padding:'5px 12px' }}>{listing.type}</span>
              </div>

              <div style={{ display:'flex', flexWrap:'wrap', gap:20 }}>
                {listing.location && (
                  <div style={{ display:'flex', alignItems:'center', gap:7 }} className="text-sm text-muted">
                    <MapPin size={14}/> {listing.location}{listing.isRemote && ' · Remote OK'}
                  </div>
                )}
                {listing.isRemote && (
                  <div style={{ display:'flex', alignItems:'center', gap:7 }} className="text-sm" style={{ color:'var(--clr-success)' }}>
                    <Wifi size={14}/> 100% Remote
                  </div>
                )}
                {listing.stipend?.amount > 0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:7 }} className="text-sm text-muted">
                    <IndianRupee size={14}/> ₹{listing.stipend.amount.toLocaleString()}/{listing.stipend.period || 'month'}
                  </div>
                )}
                {listing.duration && (
                  <div style={{ display:'flex', alignItems:'center', gap:7 }} className="text-sm text-muted">
                    <Clock size={14}/> {listing.duration}
                  </div>
                )}
                {listing.applicationsCount !== undefined && (
                  <div style={{ display:'flex', alignItems:'center', gap:7 }} className="text-sm text-muted">
                    <Users size={14}/> {listing.applicationsCount} applicants
                  </div>
                )}
                {listing.applicationDeadline && (
                  <div style={{ display:'flex', alignItems:'center', gap:7 }} className="text-sm text-muted">
                    <Calendar size={14}/> Closes {new Date(listing.applicationDeadline).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                  </div>
                )}
              </div>

              {/* Skills */}
              {listing.skillsRequired?.length > 0 && (
                <div style={{ marginTop:20 }}>
                  <div style={{ fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--clr-text-3)', marginBottom:10 }}>Required Skills</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {listing.skillsRequired.map(s => <span key={s} className="tag active" style={{ cursor:'default' }}>{s}</span>)}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {listing.description && (
              <div className="card animate-fade-up" style={{ animationDelay:'0.05s' }}>
                <h3 style={{ fontWeight:700, marginBottom:16 }}>About this role</h3>
                <div style={{ color:'var(--clr-text-2)', lineHeight:1.8, fontSize:'0.9rem', whiteSpace:'pre-wrap' }}>
                  {listing.description}
                </div>
              </div>
            )}

            {/* Perks */}
            {listing.perks?.length > 0 && (
              <div className="card animate-fade-up" style={{ animationDelay:'0.1s' }}>
                <h3 style={{ fontWeight:700, marginBottom:16 }}>Perks & Benefits</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {listing.perks.map(p => (
                    <div key={p} style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <CheckCircle2 size={15} style={{ color:'var(--clr-success)', flexShrink:0 }}/>
                      <span style={{ fontSize:'0.9rem', color:'var(--clr-text-2)' }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky CTA Panel */}
          <div style={{ position:'sticky', top:24 }}>
            <div className="card animate-fade-up" style={{ animationDelay:'0.1s' }}>
              <div style={{ textAlign:'center', marginBottom:20 }}>
                {applied ? (
                  <>
                    <div style={{ width:56, height:56, background:'var(--clr-success-dim)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                      <CheckCircle2 size={28} style={{ color:'var(--clr-success)' }}/>
                    </div>
                    <div style={{ fontWeight:700, color:'var(--clr-success)', marginBottom:4 }}>Application Submitted!</div>
                    <div className="text-sm text-muted">You'll hear back soon</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight:700, fontSize:'1rem', marginBottom:4 }}>Ready to apply?</div>
                    <div className="text-sm text-muted" style={{ marginBottom:20 }}>
                      {deadlinePassed ? '⚠️ Deadline passed' : `${listing.applicationsCount || 0} people have applied`}
                    </div>
                    <button
                      className="btn btn-primary btn-lg w-full"
                      onClick={() => setShowModal(true)}
                      disabled={deadlinePassed}
                    >
                      <Briefcase size={16}/> Apply Now
                    </button>
                  </>
                )}
              </div>

              <div style={{ borderTop:'1px solid var(--clr-border)', paddingTop:16 }}>
                <div className="form-group" style={{ gap:8 }}>
                  {listing.applicationDeadline && (
                    <div style={{ display:'flex', justifyContent:'space-between' }} className="text-sm">
                      <span className="text-dimmed">Deadline</span>
                      <span className="font-semibold">{new Date(listing.applicationDeadline).toLocaleDateString('en-IN')}</span>
                    </div>
                  )}
                  {listing.stipend?.amount > 0 && (
                    <div style={{ display:'flex', justifyContent:'space-between' }} className="text-sm">
                      <span className="text-dimmed">Stipend</span>
                      <span className="font-semibold" style={{ color:'var(--clr-success)' }}>₹{listing.stipend.amount.toLocaleString()}/mo</span>
                    </div>
                  )}
                  {listing.openings && (
                    <div style={{ display:'flex', justifyContent:'space-between' }} className="text-sm">
                      <span className="text-dimmed">Openings</span>
                      <span className="font-semibold">{listing.openings}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {listing.company && (
              <div className="card" style={{ marginTop:16 }}>
                <h4 style={{ fontWeight:700, marginBottom:14, fontSize:'0.9rem' }}>About the Company</h4>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <div className="avatar avatar-sm" style={{ background:'var(--clr-primary-dim)', color:'var(--clr-primary)', borderRadius:'var(--r-xs)' }}>
                    {listing.company.name?.[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{listing.company.name}</div>
                    <div className="text-xs text-dimmed">{listing.company.industry}</div>
                  </div>
                </div>
                {listing.company.website && (
                  <a href={listing.company.website} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm w-full">
                    <ExternalLink size={13}/> Visit Website
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Apply for {listing.title}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div style={{ marginBottom:16 }}>
              <div className="form-group">
                <label>Cover Letter <span className="text-dimmed">(optional)</span></label>
                <textarea
                  rows={6}
                  placeholder="Tell the company why you're a great fit for this role..."
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value)}
                />
                <div className="form-hint">{coverLetter.length}/1000 characters</div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleApply} disabled={applying}>
                {applying ? <span className="spinner"/> : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
