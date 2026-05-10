import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';   // ← configured instance with auto token-refresh
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const API = '';   // base URL already set on the axios instance

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    DRAFT: ['grey','📝'], JD_SENT: ['blue','📨'], APPLICATIONS_OPEN: ['green','✅'],
    SHORTLISTING: ['orange','🔍'], SHORTLISTED: ['teal','🎯'], FURTHER_ROUNDS: ['purple','🔄'],
    COMPLETED: ['dark','🏁'], CANCELLED: ['red','❌'],
  };
  const [color, icon] = map[status] || ['grey','❓'];
  return (
    <span className={`admin-campus-status status-${color}`}>
      {icon} {status?.replace(/_/g, ' ')}
    </span>
  );
};

// ─── Create Drive Modal ───────────────────────────────────────────────────────
function CreateDriveModal({ colleges, onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    collegeId: '', title: '', description: '',
    driveDate: '', venue: '', mode: 'OFFLINE',
    jd: {
      role: '', skills: '', stipend: '', duration: '3 months',
      eligibility: '', minCGPA: 6.0, eligibleDisciplines: [], description: '',
    },
    shortlistingCriteria: { minATSScore: 60, minCGPA: 6.0, minClass10: 60, minClass12: 60, slots: 30 },
  });

  const selectedCollege = colleges.find(c => c._id === form.collegeId);
  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const setJD = (field, val) => setForm(f => ({ ...f, jd: { ...f.jd, [field]: val } }));
  const setCriteria = (field, val) => setForm(f => ({ ...f, shortlistingCriteria: { ...f.shortlistingCriteria, [field]: val } }));

  const toggleDiscipline = (disc) => setForm(f => {
    const cur = f.jd.eligibleDisciplines;
    return { ...f, jd: { ...f.jd, eligibleDisciplines: cur.includes(disc) ? cur.filter(d => d !== disc) : [...cur, disc] } };
  });

  const handleCreate = async () => {
    if (!form.collegeId) return toast.error('Please select a college');
    if (!form.title) return toast.error('Drive title is required');
    if (!form.jd.role) return toast.error('Role is required');
    if (form.jd.eligibleDisciplines.length === 0) return toast.error('Select at least one eligible discipline');
    setSaving(true);
    try {
      const payload = {
        ...form,
        jd: {
          ...form.jd,
          stipend: Number(form.jd.stipend),
          minCGPA: Number(form.jd.minCGPA),
          skills: typeof form.jd.skills === 'string'
            ? form.jd.skills.split(',').map(s => s.trim()).filter(Boolean)
            : form.jd.skills,
        },
      };
      const { data } = await axios.post(`/college/admin/drives`, payload);
      toast.success('Drive created & JD sent to college!');
      onCreated(data.drive);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create drive');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box modal-lg">
        <div className="modal-header">
          <h2>🏫 Create Campus Drive</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-steps">
          {['Drive Info', 'Job Description', 'Shortlisting Criteria'].map((s, i) => (
            <div key={s} className={`modal-step ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}>
              <div className="modal-step-num">{step > i + 1 ? '✓' : i + 1}</div>
              <span>{s}</span>
            </div>
          ))}
        </div>

        <div className="modal-body">
          {step === 1 && (
            <div className="modal-step-content">
              <div className="form-row">
                <div className="form-field">
                  <label>College *</label>
                  <select value={form.collegeId} onChange={e => { set('collegeId', e.target.value); setJD('eligibleDisciplines', []); }} required>
                    <option value="">Select College</option>
                    {colleges.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code}) — {c.city}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Drive Mode</label>
                  <select value={form.mode} onChange={e => set('mode', e.target.value)}>
                    <option value="OFFLINE">Offline (On-Campus)</option>
                    <option value="ONLINE">Online</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label>Drive Title *</label>
                <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Summer Internship Drive 2025 – PICT" />
              </div>
              <div className="form-field">
                <label>Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Brief about the drive..." />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Drive Date</label>
                  <input type="date" value={form.driveDate} onChange={e => set('driveDate', e.target.value)} />
                </div>
                <div className="form-field">
                  <label>Venue</label>
                  <input type="text" value={form.venue} onChange={e => set('venue', e.target.value)} placeholder="Main Auditorium, PICT" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="modal-step-content">
              <div className="form-row">
                <div className="form-field">
                  <label>Role / Position *</label>
                  <input type="text" value={form.jd.role} onChange={e => setJD('role', e.target.value)} placeholder="Software Developer Intern" />
                </div>
                <div className="form-field">
                  <label>Stipend (₹/month)</label>
                  <input type="number" value={form.jd.stipend} onChange={e => setJD('stipend', e.target.value)} placeholder="10000" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Duration</label>
                  <select value={form.jd.duration} onChange={e => setJD('duration', e.target.value)}>
                    <option value="1 month">1 Month</option>
                    <option value="2 months">2 Months</option>
                    <option value="3 months">3 Months</option>
                    <option value="6 months">6 Months</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Min CGPA</label>
                  <input type="number" step="0.1" min="0" max="10" value={form.jd.minCGPA} onChange={e => setJD('minCGPA', e.target.value)} />
                </div>
              </div>
              <div className="form-field">
                <label>Required Skills (comma separated)</label>
                <input type="text" value={form.jd.skills} onChange={e => setJD('skills', e.target.value)} placeholder="Python, React, SQL..." />
              </div>

              {/* ── Dynamic Discipline Picker ─────────────────────── */}
              <div className="form-field">
                <label>
                  Eligible Disciplines *&nbsp;
                  <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    — {form.jd.eligibleDisciplines.length} of {selectedCollege?.disciplines?.length ?? 0} selected
                  </span>
                </label>
                {!selectedCollege ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>← Go back and select a college first</p>
                ) : (selectedCollege.disciplines?.length > 0) ? (
                  <div className="discipline-picker">
                    <button type="button" className="btn btn-ghost discipline-select-all" onClick={() =>
                      setJD('eligibleDisciplines',
                        form.jd.eligibleDisciplines.length === selectedCollege.disciplines.length
                          ? [] : [...selectedCollege.disciplines])}>
                      {form.jd.eligibleDisciplines.length === selectedCollege.disciplines.length ? '☑ Deselect All' : '☐ Select All'}
                    </button>
                    <div className="discipline-grid">
                      {selectedCollege.disciplines.map(disc => (
                        <label key={disc} className={`discipline-chip ${form.jd.eligibleDisciplines.includes(disc) ? 'selected' : ''}`}>
                          <input type="checkbox" checked={form.jd.eligibleDisciplines.includes(disc)} onChange={() => toggleDiscipline(disc)} style={{ display: 'none' }} />
                          {disc}
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No disciplines listed for this college</p>
                )}
              </div>

              <div className="form-field">
                <label>Eligibility Criteria (text summary)</label>
                <input type="text" value={form.jd.eligibility} onChange={e => setJD('eligibility', e.target.value)} placeholder="Open to CSE / IT final year students with CGPA ≥ 7.0" />
              </div>
              <div className="form-field">
                <label>Detailed Job Description</label>
                <textarea value={form.jd.description} onChange={e => setJD('description', e.target.value)} rows={4} placeholder="Detailed role responsibilities..." />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="modal-step-content">
              <p className="modal-hint">Set minimum thresholds for automatic shortlisting.</p>
              <div className="form-row">
                <div className="form-field">
                  <label>Minimum ATS Score (0–100)</label>
                  <input type="number" min="0" max="100" value={form.shortlistingCriteria.minATSScore} onChange={e => setCriteria('minATSScore', Number(e.target.value))} />
                </div>
                <div className="form-field">
                  <label>Minimum CGPA</label>
                  <input type="number" step="0.1" min="0" max="10" value={form.shortlistingCriteria.minCGPA} onChange={e => setCriteria('minCGPA', Number(e.target.value))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Minimum 10th %</label>
                  <input type="number" min="0" max="100" value={form.shortlistingCriteria.minClass10} onChange={e => setCriteria('minClass10', Number(e.target.value))} />
                </div>
                <div className="form-field">
                  <label>Minimum 12th %</label>
                  <input type="number" min="0" max="100" value={form.shortlistingCriteria.minClass12} onChange={e => setCriteria('minClass12', Number(e.target.value))} />
                </div>
              </div>
              <div className="form-field">
                <label>Max Slots</label>
                <input type="number" min="1" value={form.shortlistingCriteria.slots} onChange={e => setCriteria('slots', Number(e.target.value))} />
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step > 1 && <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>← Back</button>}
          {step < 3 ? (
            <button className="btn btn-primary" onClick={() => setStep(s => s + 1)} disabled={!form.collegeId && step === 1}>Next →</button>
          ) : (
            <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
              {saving ? 'Creating...' : '🚀 Create Drive & Send JD'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Drive Detail Modal ───────────────────────────────────────────────────────
function DriveDetailModal({ drive, onClose, onRefresh }) {
  const [apps, setApps] = useState([]);
  const [tab, setTab] = useState('info');
  const [shortlisting, setShortlisting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === 'applications') fetchApps();
  }, [tab]);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/college/admin/drives/${drive._id}/applications`);
      setApps(data.applications || []);
    } catch { toast.error('Failed to load applications'); }
    finally { setLoading(false); }
  };

  const handleShortlist = async () => {
    setShortlisting(true);
    try {
      const { data } = await axios.post(`/college/admin/drives/${drive._id}/shortlist`, {});
      toast.success(data.message);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Shortlisting failed');
    } finally {
      setShortlisting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.put(`/college/admin/drives/${drive._id}`, { status: newStatus });
      toast.success('Status updated');
      onRefresh();
    } catch { toast.error('Failed to update status'); }
  };

  const handleSelectStudent = async (appId) => {
    const startDate = prompt('Internship start date (YYYY-MM-DD):');
    const endDate   = prompt('Internship end date (YYYY-MM-DD):');
    if (!startDate || !endDate) return;
    try {
      await axios.post(
        `/college/admin/applications/${appId}/select`,
        { startDate, endDate, stipend: { amount: drive.jd?.stipend || 10000, currency: 'INR' } }
      );
      toast.success('Internship offer sent!');
      fetchApps();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to select student');
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box modal-xl">
        <div className="modal-header">
          <div>
            <h2>{drive.title}</h2>
            <div className="modal-sub">{drive.college?.name} • {drive.college?.city}</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          {['info','applications'].map(t => (
            <button key={t} className={`modal-tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t === 'info' ? '📋 Drive Info' : '👥 Applications'}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {tab === 'info' && (
            <div className="drive-detail-info">
              <div className="drive-info-row">
                <div className="drive-info-label">Status</div>
                <div className="drive-info-val">
                  <StatusBadge status={drive.status} />
                  <select
                    className="status-change-select"
                    defaultValue={drive.status}
                    onChange={e => handleStatusChange(e.target.value)}
                  >
                    {['DRAFT','JD_SENT','APPLICATIONS_OPEN','SHORTLISTING','SHORTLISTED','FURTHER_ROUNDS','COMPLETED','CANCELLED'].map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="drive-info-row">
                <div className="drive-info-label">Drive Date</div>
                <div className="drive-info-val">{drive.driveDate ? new Date(drive.driveDate).toLocaleDateString('en-IN') : 'TBD'}</div>
              </div>
              <div className="drive-info-row">
                <div className="drive-info-label">Applicants / Shortlisted / Selected</div>
                <div className="drive-info-val">
                  <strong>{drive.totalApplicants || 0}</strong> / <strong>{drive.totalShortlisted || 0}</strong> / <strong>{drive.totalSelected || 0}</strong>
                </div>
              </div>
              {drive.applicationFormUrl && (
                <div className="drive-info-row">
                  <div className="drive-info-label">Form URL</div>
                  <div className="drive-info-val form-url-row">
                    <code>{drive.applicationFormUrl}</code>
                    <button onClick={() => { navigator.clipboard.writeText(drive.applicationFormUrl); toast.success('Copied!'); }}>📋</button>
                  </div>
                </div>
              )}
              {drive.jd && (
                <div className="drive-jd-box">
                  <h3>📄 Job Description</h3>
                  <div className="jd-tags">
                    <span>💼 {drive.jd.role}</span>
                    <span>💰 ₹{drive.jd.stipend?.toLocaleString()}/mo</span>
                    <span>⏱️ {drive.jd.duration}</span>
                    <span>📊 Min CGPA: {drive.jd.minCGPA}</span>
                  </div>
                  {drive.jd.skills?.length > 0 && (
                    <div className="jd-skills">
                      {drive.jd.skills.map(s => <span key={s} className="skill-chip">{s}</span>)}
                    </div>
                  )}
                </div>
              )}
              <div className="drive-actions">
                <button className="btn btn-warning" onClick={handleShortlist} disabled={shortlisting}>
                  {shortlisting ? 'Running...' : '⚡ Run Auto-Shortlisting'}
                </button>
              </div>
            </div>
          )}

          {tab === 'applications' && (
            <div className="drive-apps-panel">
              {loading ? <div className="college-loading">Loading...</div> : (
                apps.length === 0 ? (
                  <div className="college-empty-state"><span>📭</span><p>No applications yet.</p></div>
                ) : (
                  <div className="college-table-wrap">
                    <table className="college-table">
                      <thead>
                        <tr>
                          <th>#</th><th>Name</th><th>Email</th><th>Branch</th>
                          <th>CGPA</th><th>ATS</th><th>Overall</th><th>Status</th><th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apps.map((app, i) => (
                          <tr key={app._id}>
                            <td>{i + 1}</td>
                            <td>{app.student.name}</td>
                            <td>{app.student.email}</td>
                            <td>{app.student.branch}</td>
                            <td>{app.student.cgpa?.toFixed(2)}</td>
                            <td>
                              <span className={`score-pill ${app.atsScore >= 70 ? 'high' : app.atsScore >= 50 ? 'mid' : 'low'}`}>
                                {app.atsScore ?? '—'}
                              </span>
                            </td>
                            <td><strong>{app.overallScore ?? '—'}</strong></td>
                            <td><StatusBadge status={app.status} /></td>
                            <td>
                              {['SHORTLISTED','ROUND_2','ROUND_3'].includes(app.status) && (
                                <button className="btn-select-intern" onClick={() => handleSelectStudent(app._id)}>
                                  🏆 Select
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Campus Page ───────────────────────────────────────────────────
export default function AdminCampusDrives() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [colleges, setColleges] = useState([]);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDrive, setShowCreateDrive] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [filterCollege, setFilterCollege] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [colRes, driveRes] = await Promise.all([
        axios.get(`/college/admin/list`),
        axios.get(`/college/admin/drives`),
      ]);
      setColleges(colRes.data.colleges || []);
      setDrives(driveRes.data.drives || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredDrives = drives.filter(d => {
    if (filterCollege && d.college?._id !== filterCollege) return false;
    if (filterStatus && d.status !== filterStatus) return false;
    return true;
  });

  const totalApplicants = drives.reduce((s, d) => s + (d.totalApplicants || 0), 0);
  const totalShortlisted = drives.reduce((s, d) => s + (d.totalShortlisted || 0), 0);
  const totalSelected = drives.reduce((s, d) => s + (d.totalSelected || 0), 0);

  return (
    <div className="admin-campus-page">
      <div className="admin-campus-header">
        <div>
          <h1>🏫 Campus Hiring Drives</h1>
          <p>Manage college drives, JDs, applications, and internship offers</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateDrive(true)}>
          + New Drive
        </button>
      </div>

      {/* Stats */}
      <div className="admin-campus-stats">
        {[
          { label: 'Colleges', value: colleges.length, icon: '🏫', color: 'blue' },
          { label: 'Total Drives', value: drives.length, icon: '📋', color: 'purple' },
          { label: 'Applicants', value: totalApplicants, icon: '📄', color: 'orange' },
          { label: 'Shortlisted', value: totalShortlisted, icon: '✅', color: 'teal' },
          { label: 'Selected', value: totalSelected, icon: '🏆', color: 'green' },
        ].map(s => (
          <div key={s.label} className={`admin-campus-stat stat-${s.color}`}>
            <span className="admin-campus-stat-icon">{s.icon}</span>
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Colleges overview */}
      <div className="admin-campus-section">
        <h2>Registered Colleges</h2>
        <div className="admin-colleges-grid">
          {colleges.map(col => (
            <div key={col._id} className="admin-college-chip">
              <div className="admin-college-chip-code">{col.code}</div>
              <div className="admin-college-chip-name">{col.name}</div>
              <div className={`admin-college-chip-uni uni-${col.university.toLowerCase()}`}>{col.university}</div>
              <div className="admin-college-chip-stats">
                {col.totalDrives} drives • {col.totalSelected} selected
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drives table */}
      <div className="admin-campus-section">
        <div className="admin-campus-drives-header">
          <h2>All Drives</h2>
          <div className="admin-campus-filters">
            <select value={filterCollege} onChange={e => setFilterCollege(e.target.value)}>
              <option value="">All Colleges</option>
              {colleges.map(c => <option key={c._id} value={c._id}>{c.code}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              {['DRAFT','JD_SENT','APPLICATIONS_OPEN','SHORTLISTING','SHORTLISTED','FURTHER_ROUNDS','COMPLETED','CANCELLED'].map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="college-loading">Loading drives...</div>
        ) : filteredDrives.length === 0 ? (
          <div className="college-empty-state">
            <span>📭</span><p>No drives found. Create one above!</p>
          </div>
        ) : (
          <div className="admin-drives-table-wrap">
            <table className="college-table">
              <thead>
                <tr>
                  <th>College</th><th>Drive</th><th>Date</th><th>Status</th>
                  <th>Applied</th><th>Shortlisted</th><th>Selected</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrives.map(drive => (
                  <tr key={drive._id} className="college-table-row">
                    <td>
                      <div className="drive-college-cell">
                        <span className="drive-college-code">{drive.college?.code}</span>
                        <span className="drive-college-city">{drive.college?.city}</span>
                      </div>
                    </td>
                    <td className="drive-title-cell">{drive.title}</td>
                    <td>{drive.driveDate ? new Date(drive.driveDate).toLocaleDateString('en-IN') : '—'}</td>
                    <td><StatusBadge status={drive.status} /></td>
                    <td>{drive.totalApplicants || 0}</td>
                    <td>{drive.totalShortlisted || 0}</td>
                    <td>{drive.totalSelected || 0}</td>
                    <td>
                      <button className="btn-view" onClick={() => setSelectedDrive(drive)}>View →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateDrive && (
        <CreateDriveModal
          colleges={colleges}
          onClose={() => setShowCreateDrive(false)}
          onCreated={() => fetchAll()}
        />
      )}
      {selectedDrive && (
        <DriveDetailModal
          drive={selectedDrive}
          onClose={() => setSelectedDrive(null)}
          onRefresh={fetchAll}
        />
      )}
    </div>
  );
}
