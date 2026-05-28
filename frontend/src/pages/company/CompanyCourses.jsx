import { useEffect, useState } from 'react';
import CompanyLayout from '../../layouts/CompanyLayout';
import api from '../../api/axios';
import { BookOpen, Star, Users, Plus, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function CompanyCourses() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL');

  useEffect(() => {
    api.get('/courses?limit=50')
      .then(r => { setCourses(r.data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const companyId = user?.companyRef;
  const myCourses  = courses.filter(c => c.company?.toString() === companyId?.toString());
  const allCourses = tab === 'ALL' ? courses : myCourses;

  return (
    <CompanyLayout>
      <div className="page">
        {/* Header */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>Courses</h1>
            <p className="text-muted">View the course catalogue and manage courses created by your company</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ textAlign: 'center', padding: '8px 16px', background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 'var(--r-sm)' }}>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--clr-primary)', letterSpacing: '-0.03em' }}>{myCourses.length}</div>
              <div className="text-xs text-dimmed">Your Courses</div>
            </div>
            <div style={{ textAlign: 'center', padding: '8px 16px', background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 'var(--r-sm)' }}>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--clr-success)', letterSpacing: '-0.03em' }}>{courses.length}</div>
              <div className="text-xs text-dimmed">Total</div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/company/courses/new')}
              style={{ gap: 8, whiteSpace: 'nowrap' }}
            >
              <Plus size={16}/> Create Course
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {[
            { key: 'ALL',  label: `All Courses (${courses.length})` },
            { key: 'MINE', label: `My Company (${myCourses.length})` },
          ].map(({ key, label }) => (
            <button key={key} className={`tab-btn ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="grid-3">{[1,2,3,4,5,6].map(i => <div key={i} className="skeleton skeleton-card"/>)}</div>
        ) : allCourses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><BookOpen size={28} style={{ color: 'var(--clr-text-3)' }}/></div>
            <h3>{tab === 'MINE' ? 'No courses from your company yet' : 'No courses found'}</h3>
            <p>{tab === 'MINE' ? 'Your company hasn\'t published any courses. Ask your admin to create one.' : 'Check back soon.'}</p>
          </div>
        ) : (
          <div className="grid-3">
            {allCourses.map(course => {
              const isOwnCourse = course.company?.toString() === companyId?.toString();
              return (
                <div key={course._id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Thumbnail */}
                  {course.thumbnail ? (
                    <div style={{ margin: '-24px -24px 16px', borderRadius: 'var(--r-md) var(--r-md) 0 0', overflow: 'hidden', height: 120, background: 'var(--clr-surface-2)' }}>
                      <img src={course.thumbnail} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    </div>
                  ) : (
                    <div style={{
                      margin: '-24px -24px 16px', borderRadius: 'var(--r-md) var(--r-md) 0 0', height: 100,
                      background: `linear-gradient(135deg, var(--clr-primary-dim), var(--clr-accent-dim))`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
                    }}>
                      <BookOpen size={32} style={{ color: 'var(--clr-primary)', opacity: 0.6 }}/>
                      {isOwnCourse && (
                        <span style={{
                          position: 'absolute', top: 8, right: 8,
                          background: 'var(--clr-primary)', color: '#fff',
                          fontSize: '0.6rem', fontWeight: 800, padding: '2px 8px',
                          borderRadius: 999, letterSpacing: '0.04em'
                        }}>YOUR CO.</span>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 4, lineHeight: 1.3 }}>{course.title}</h3>
                    {course.instructor && <div className="text-xs text-dimmed" style={{ marginBottom: 6 }}>{course.instructor}</div>}
                    <p className="text-sm text-muted" style={{ lineHeight: 1.6, flex: 1, marginBottom: 12 }}>
                      {course.description?.slice(0, 80)}{course.description?.length > 80 ? '…' : ''}
                    </p>

                    {/* Meta */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ display: 'flex', gap: 10 }}>
                        {course.rating && (
                          <span className="text-xs text-dimmed" style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Star size={11} style={{ color: 'var(--clr-warning)' }}/>{course.rating}
                          </span>
                        )}
                        {course.totalEnrollments > 0 && (
                          <span className="text-xs text-dimmed" style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Users size={11}/> {course.totalEnrollments}
                          </span>
                        )}
                        {course.price?.amount === 0 || course.isFree
                          ? <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>Free</span>
                          : <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>₹{course.price?.amount}</span>
                        }
                      </div>
                      <span className={`badge ${course.isPublished ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: '0.65rem' }}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    {/* Action button */}
                    <Link to={`/courses/${course.slug || course._id}`} style={{ textDecoration: 'none' }}>
                      <button className="btn btn-outline w-full btn-sm" style={{ gap: 6 }}>
                        <Eye size={13}/> View Course
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CompanyLayout>
  );
}
