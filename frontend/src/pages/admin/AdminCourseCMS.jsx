import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../api/axios';
import { BookOpen, Plus, Edit, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, X, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_COURSE = {
  title: '', description: '', instructor: '', category: 'Technical',
  price: 0, isFree: false, skills: '', thumbnail: '',
  modules: [], skillBoostWeight: 0,
};

const EMPTY_MODULE = { title: '', order: 1, lessons: [] };
const EMPTY_LESSON = { title: '', type: 'VIDEO', content: '', duration: 30, order: 1 };

export default function AdminCourseCMS() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [form, setForm] = useState(EMPTY_COURSE);
  const [saving, setSaving] = useState(false);
  const [expandedModule, setExpandedModule] = useState(null);

  const fetchCourses = () => {
    api.get('/courses?all=true')
      .then(r => { setCourses(r.data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(fetchCourses, []);

  const openCreate = () => {
    setForm(EMPTY_COURSE);
    setEditCourse(null);
    setShowModal(true);
  };

  const openEdit = (course) => {
    setForm({
      ...course,
      price: course.price?.amount ?? 0,
      skills: Array.isArray(course.skills) ? course.skills.join(', ') : '',
      modules: course.modules || [],
    });
    setEditCourse(course._id);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title) return toast.error('Title is required');
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: form.isFree ? 0 : Number(form.price),
        skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      if (editCourse) {
        await api.put(`/courses/${editCourse}`, payload);
        toast.success('Course updated!');
      } else {
        await api.post('/courses', payload);
        toast.success('Course created!');
      }
      setShowModal(false);
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    try {
      await api.delete(`/courses/${id}`);
      toast.success('Deleted');
      fetchCourses();
    } catch { toast.error('Failed to delete'); }
  };

  const handleTogglePublish = async (id) => {
    try {
      const r = await api.patch(`/courses/${id}/publish`);
      toast.success(r.data.message);
      fetchCourses();
    } catch { toast.error('Failed to toggle publish'); }
  };

  // Module helpers
  const addModule = () => {
    setForm(p => ({
      ...p,
      modules: [...p.modules, { ...EMPTY_MODULE, order: p.modules.length + 1 }],
    }));
  };

  const updateModule = (idx, field, value) => {
    setForm(p => {
      const modules = [...p.modules];
      modules[idx] = { ...modules[idx], [field]: value };
      return { ...p, modules };
    });
  };

  const removeModule = (idx) => {
    setForm(p => ({ ...p, modules: p.modules.filter((_, i) => i !== idx) }));
  };

  const addLesson = (moduleIdx) => {
    setForm(p => {
      const modules = [...p.modules];
      modules[moduleIdx].lessons = [
        ...(modules[moduleIdx].lessons || []),
        { ...EMPTY_LESSON, order: (modules[moduleIdx].lessons?.length || 0) + 1 },
      ];
      return { ...p, modules };
    });
  };

  const updateLesson = (mIdx, lIdx, field, value) => {
    setForm(p => {
      const modules = [...p.modules];
      modules[mIdx].lessons[lIdx] = { ...modules[mIdx].lessons[lIdx], [field]: value };
      return { ...p, modules };
    });
  };

  const removeLesson = (mIdx, lIdx) => {
    setForm(p => {
      const modules = [...p.modules];
      modules[mIdx].lessons = modules[mIdx].lessons.filter((_, i) => i !== lIdx);
      return { ...p, modules };
    });
  };

  return (
    <AdminLayout>
      <div className="page">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Course CMS</h1>
            <p className="text-muted">Manage courses, pricing, and curriculum for the platform.</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> New Course
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Courses', value: courses.length, clr: 'var(--clr-primary)' },
            { label: 'Published', value: courses.filter(c => c.isPublished).length, clr: 'var(--clr-success)' },
            { label: 'Drafts', value: courses.filter(c => !c.isPublished).length, clr: 'var(--clr-warning)' },
            { label: 'Total Enrollments', value: courses.reduce((s, c) => s + (c.totalEnrollments || 0), 0), clr: 'var(--clr-accent)' },
          ].map(({ label, value, clr }) => (
            <div key={label} className="card stat-card">
              <div className="stat-label">{label}</div>
              <div className="stat-value" style={{ color: clr }}>{value}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: 400, borderRadius: 'var(--r-sm)' }} />
        ) : courses.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} style={{ marginBottom: 16, color: 'var(--clr-text-3)' }} />
            <h3>No Courses Yet</h3>
            <p className="text-muted">Create your first course to start offering content to students.</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreate}>Create Course</button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Enrollments</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c._id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{c.title}</div>
                      <div className="text-xs text-muted">{c.instructor || 'No instructor'}</div>
                    </td>
                    <td><span className="badge badge-gray">{c.category || 'N/A'}</span></td>
                    <td style={{ fontWeight: 600 }}>{c.isFree || c.price?.amount === 0 ? <span className="badge badge-green">FREE</span> : `₹${c.price?.amount?.toLocaleString()}`}</td>
                    <td>{c.totalEnrollments || 0}</td>
                    <td>
                      <button
                        className={`badge ${c.isPublished ? 'badge-green' : 'badge-yellow'}`}
                        style={{ cursor: 'pointer', border: 'none', background: 'none' }}
                        onClick={() => handleTogglePublish(c._id)}
                      >
                        {c.isPublished ? <><Eye size={11} /> Published</> : <><EyeOff size={11} /> Draft</>}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)} title="Edit">
                          <Edit size={14} style={{ color: 'var(--clr-primary)' }} />
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(c._id)} title="Delete">
                          <Trash2 size={14} style={{ color: 'var(--clr-danger)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ──────────────────────────────────────────── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto',
        }}>
          <div style={{
            background: 'var(--clr-surface)', borderRadius: 'var(--r-md)', width: '100%', maxWidth: 760,
            border: '1px solid var(--clr-border)', boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px', borderBottom: '1px solid var(--clr-border)' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.2rem' }}>{editCourse ? 'Edit Course' : 'Create New Course'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Basic Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Course Title *</label>
                    <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g., Full Stack Development Bootcamp" required />
                  </div>
                  <div className="form-group">
                    <label>Instructor Name</label>
                    <input type="text" value={form.instructor} onChange={e => setForm(p => ({ ...p, instructor: e.target.value }))} placeholder="e.g., Rahul Sharma" />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                      {['Technical', 'Soft Skills', 'Design', 'Management'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Description</label>
                    <textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What will students learn in this course?" />
                  </div>
                  <div className="form-group">
                    <label>Skills (comma separated)</label>
                    <input type="text" value={form.skills} onChange={e => setForm(p => ({ ...p, skills: e.target.value }))} placeholder="React, Node.js, MongoDB" />
                  </div>
                  <div className="form-group">
                    <label>Thumbnail URL</label>
                    <input type="url" value={form.thumbnail} onChange={e => setForm(p => ({ ...p, thumbnail: e.target.value }))} placeholder="https://..." />
                  </div>
                  <div className="form-group">
                    <label>Price (₹)</label>
                    <input type="number" min="0" value={form.price} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value), isFree: Number(e.target.value) === 0 }))} disabled={form.isFree} />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 24 }}>
                    <input type="checkbox" id="isFree" checked={form.isFree} onChange={e => setForm(p => ({ ...p, isFree: e.target.checked, price: e.target.checked ? 0 : p.price }))} />
                    <label htmlFor="isFree" style={{ cursor: 'pointer', marginBottom: 0 }}>Free Course</label>
                  </div>
                </div>

                {/* Curriculum Builder */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Curriculum <span className="text-muted text-sm">({form.modules.length} modules)</span></h3>
                    <button type="button" className="btn btn-outline btn-sm" onClick={addModule}>
                      <Plus size={14} /> Add Module
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {form.modules.map((mod, mIdx) => (
                      <div key={mIdx} style={{ border: '1px solid var(--clr-border)', borderRadius: 'var(--r-sm)', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'var(--clr-surface-2)', cursor: 'pointer' }}
                          onClick={() => setExpandedModule(expandedModule === mIdx ? null : mIdx)}>
                          <GripVertical size={14} style={{ color: 'var(--clr-text-3)' }} />
                          <input
                            type="text"
                            value={mod.title}
                            onChange={e => { e.stopPropagation(); updateModule(mIdx, 'title', e.target.value); }}
                            onClick={e => e.stopPropagation()}
                            placeholder={`Module ${mIdx + 1}: Title`}
                            style={{ flex: 1, background: 'transparent', border: 'none', fontWeight: 600, color: 'var(--clr-text)', outline: 'none' }}
                          />
                          <span className="text-xs text-muted">{mod.lessons?.length || 0} lessons</span>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); removeModule(mIdx); }}>
                            <Trash2 size={13} style={{ color: 'var(--clr-danger)' }} />
                          </button>
                          {expandedModule === mIdx ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>

                        {expandedModule === mIdx && (
                          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {(mod.lessons || []).map((lesson, lIdx) => (
                              <div key={lIdx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px auto', gap: 8, alignItems: 'center', padding: '8px 10px', background: 'var(--clr-surface)', borderRadius: 6 }}>
                                <input type="text" placeholder="Lesson title" value={lesson.title}
                                  onChange={e => updateLesson(mIdx, lIdx, 'title', e.target.value)}
                                  style={{ border: '1px solid var(--clr-border)', borderRadius: 4, padding: '4px 8px', background: 'transparent', color: 'var(--clr-text)' }} />
                                <select value={lesson.type} onChange={e => updateLesson(mIdx, lIdx, 'type', e.target.value)}
                                  style={{ border: '1px solid var(--clr-border)', borderRadius: 4, padding: '4px 6px', background: 'var(--clr-surface)', color: 'var(--clr-text)', fontSize: '0.8rem' }}>
                                  {['VIDEO', 'QUIZ', 'READING', 'ASSIGNMENT'].map(t => <option key={t}>{t}</option>)}
                                </select>
                                <input type="number" placeholder="Mins" value={lesson.duration}
                                  onChange={e => updateLesson(mIdx, lIdx, 'duration', Number(e.target.value))}
                                  style={{ border: '1px solid var(--clr-border)', borderRadius: 4, padding: '4px 8px', background: 'transparent', color: 'var(--clr-text)', textAlign: 'center' }} />
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeLesson(mIdx, lIdx)}>
                                  <X size={12} style={{ color: 'var(--clr-danger)' }} />
                                </button>
                              </div>
                            ))}
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => addLesson(mIdx)} style={{ alignSelf: 'flex-start', gap: 6 }}>
                              <Plus size={13} /> Add Lesson
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {form.modules.length === 0 && (
                      <div style={{ padding: 20, textAlign: 'center', border: '1px dashed var(--clr-border)', borderRadius: 'var(--r-sm)' }}>
                        <p className="text-sm text-muted">No modules yet. Click "Add Module" to start building the curriculum.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px 28px', borderTop: '1px solid var(--clr-border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : editCourse ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
