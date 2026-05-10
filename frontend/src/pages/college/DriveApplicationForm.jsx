import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const BRANCHES = ['CSE', 'IT', 'E&TC', 'MECH', 'CIVIL', 'EE', 'INSTRU', 'AIDS', 'AIML', 'OTHER'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', 'Final Year'];

export default function DriveApplicationForm() {
  const { token } = useParams();
  const [drive, setDrive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', rollNo: '',
    branch: '', year: '', cgpa: '', class10: '', class12: '',
    linkedIn: '', portfolio: '',
    resumeUrl: '', skills: '', projects: '',
    resumeText: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API}/college/apply/${token}`);
        setDrive(data.drive);
      } catch (err) {
        setDrive(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await axios.post(`${API}/college/apply/${token}`, {
        student: {
          ...form,
          cgpa: parseFloat(form.cgpa) || null,
          class10: parseFloat(form.class10) || null,
          class12: parseFloat(form.class12) || null,
          skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        },
      });
      setResult(data);
      setSubmitted(true);
      toast.success('Application submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="drive-form-loading">
        <div className="drive-form-spinner" />
        <p>Loading application form...</p>
      </div>
    );
  }

  if (!drive) {
    return (
      <div className="drive-form-error">
        <span>❌</span>
        <h2>Form Not Found</h2>
        <p>This application link is invalid or has expired. Contact your college TPO.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="drive-form-success">
        <div className="drive-success-card">
          <div className="drive-success-icon">🎉</div>
          <h1>Application Submitted!</h1>
          <p>Your application has been received for <strong>{drive.title}</strong> at <strong>{drive.college?.name}</strong>.</p>

          {result?.atsScore !== null && result?.atsScore !== undefined && (
            <div className="drive-ats-result">
              <div className="ats-score-ring">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8"/>
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke={result.atsScore >= 70 ? '#22c55e' : result.atsScore >= 50 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="8"
                    strokeDasharray={`${(result.atsScore / 100) * 264} 264`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dasharray 1.5s ease' }}
                  />
                  <text x="50" y="55" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">
                    {result.atsScore}
                  </text>
                </svg>
              </div>
              <div className="ats-score-label">ATS Score</div>
              {result.atsAnalysis && (
                <p className="ats-analysis">{result.atsAnalysis}</p>
              )}
            </div>
          )}

          <div className="drive-success-next">
            <p>📧 You'll be notified at <strong>{form.email}</strong> about the shortlisting results.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="drive-form-page">
      {/* Header */}
      <div className="drive-form-header">
        <div className="drive-form-college-badge">
          <span>🎓</span>
          <div>
            <div className="drive-form-college-name">{drive.college?.name}</div>
            <div className="drive-form-university">{drive.college?.university} University</div>
          </div>
        </div>
        <h1 className="drive-form-title">{drive.title}</h1>
        {drive.jd && (
          <div className="drive-form-jd-summary">
            <span>💼 {drive.jd.role}</span>
            <span>💰 ₹{drive.jd.stipend?.toLocaleString()}/month</span>
            <span>⏱️ {drive.jd.duration}</span>
            <span>📊 Min CGPA: {drive.jd.minCGPA}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="drive-form-body">
        {/* Personal Info */}
        <div className="drive-form-section">
          <h2 className="drive-form-section-title">👤 Personal Information</h2>
          <div className="drive-form-grid">
            <div className="drive-form-field">
              <label>Full Name *</label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Your full name" />
            </div>
            <div className="drive-form-field">
              <label>Email Address *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="your@email.com" />
            </div>
            <div className="drive-form-field">
              <label>Phone Number *</label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} required placeholder="+91 XXXXX XXXXX" />
            </div>
            <div className="drive-form-field">
              <label>Roll Number</label>
              <input type="text" value={form.rollNo} onChange={e => set('rollNo', e.target.value)} placeholder="e.g. 21CO123" />
            </div>
          </div>
        </div>

        {/* Academic Info */}
        <div className="drive-form-section">
          <h2 className="drive-form-section-title">🎓 Academic Details</h2>
          <div className="drive-form-grid">
            <div className="drive-form-field">
              <label>Branch / Department *</label>
              <select value={form.branch} onChange={e => set('branch', e.target.value)} required>
                <option value="">Select Branch</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="drive-form-field">
              <label>Current Year *</label>
              <select value={form.year} onChange={e => set('year', e.target.value)} required>
                <option value="">Select Year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="drive-form-field">
              <label>CGPA (out of 10) *</label>
              <input type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={e => set('cgpa', e.target.value)} required placeholder="e.g. 8.75" />
            </div>
            <div className="drive-form-field">
              <label>10th Percentage *</label>
              <input type="number" step="0.01" min="0" max="100" value={form.class10} onChange={e => set('class10', e.target.value)} required placeholder="e.g. 87.60" />
            </div>
            <div className="drive-form-field">
              <label>12th Percentage *</label>
              <input type="number" step="0.01" min="0" max="100" value={form.class12} onChange={e => set('class12', e.target.value)} required placeholder="e.g. 82.40" />
            </div>
          </div>
        </div>

        {/* Professional Info */}
        <div className="drive-form-section">
          <h2 className="drive-form-section-title">💼 Professional Profile</h2>
          <div className="drive-form-grid">
            <div className="drive-form-field">
              <label>Resume URL (Google Drive / LinkedIn)</label>
              <input type="url" value={form.resumeUrl} onChange={e => set('resumeUrl', e.target.value)} placeholder="https://drive.google.com/..." />
            </div>
            <div className="drive-form-field">
              <label>LinkedIn Profile</label>
              <input type="url" value={form.linkedIn} onChange={e => set('linkedIn', e.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>
            <div className="drive-form-field">
              <label>Portfolio / GitHub</label>
              <input type="url" value={form.portfolio} onChange={e => set('portfolio', e.target.value)} placeholder="https://github.com/..." />
            </div>
            <div className="drive-form-field full-width">
              <label>Skills (comma separated) *</label>
              <input type="text" value={form.skills} onChange={e => set('skills', e.target.value)} required placeholder="Python, React, SQL, Machine Learning..." />
            </div>
            <div className="drive-form-field full-width">
              <label>Projects / Achievements</label>
              <textarea value={form.projects} onChange={e => set('projects', e.target.value)} rows={3} placeholder="Brief description of your notable projects..." />
            </div>
            <div className="drive-form-field full-width">
              <label>Resume Text / Summary (for ATS Scoring) *</label>
              <textarea value={form.resumeText} onChange={e => set('resumeText', e.target.value)} rows={5} required
                placeholder="Paste your resume content here for accurate ATS scoring. Include skills, experience, projects, and achievements..." />
              <small className="drive-form-hint">This text is used by our AI to score your profile. More detail = better score!</small>
            </div>
          </div>
        </div>

        <div className="drive-form-submit-section">
          <div className="drive-form-disclaimer">
            <span>🔒</span>
            <span>Your data is secure and will only be shared with the hiring team for this specific drive.</span>
          </div>
          <button type="submit" disabled={submitting} className="drive-form-submit-btn" id="drive-apply-submit">
            {submitting ? (
              <><span className="drive-form-spinner-sm" /> Submitting & Scoring...</>
            ) : (
              '🚀 Submit Application'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
