import { useEffect, useState } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import api from '../../api/axios';
import { BookOpen, Clock, Star, PlayCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function Courses() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL');

  useEffect(() => {
    api.get('/courses?limit=30')
      .then(r => { setCourses(r.data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const enrolledIds = user?.coursesEnrolled?.map(e => e.toString()) || [];
  const enrolled   = courses.filter(c => enrolledIds.includes(c._id?.toString()));
  const available  = courses.filter(c => !enrolledIds.includes(c._id?.toString()));
  const displayed  = tab === 'ALL' ? courses : tab === 'ENROLLED' ? enrolled : available;

  return (
    <StudentLayout>
      <div className="page">
        <div className="page-header-row">
          <div className="page-header" style={{ marginBottom:0 }}>
            <h1>Courses</h1>
            <p className="text-muted">Skill-up with curated learning paths</p>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <div style={{ textAlign:'center', padding:'8px 16px', background:'var(--clr-surface)', border:'1px solid var(--clr-border)', borderRadius:'var(--r-sm)' }}>
              <div style={{ fontWeight:800, fontSize:'1.2rem', color:'var(--clr-success)', letterSpacing:'-0.03em' }}>{enrolled.length}</div>
              <div className="text-xs text-dimmed">Enrolled</div>
            </div>
            <div style={{ textAlign:'center', padding:'8px 16px', background:'var(--clr-surface)', border:'1px solid var(--clr-border)', borderRadius:'var(--r-sm)' }}>
              <div style={{ fontWeight:800, fontSize:'1.2rem', color:'var(--clr-primary)', letterSpacing:'-0.03em' }}>{courses.length}</div>
              <div className="text-xs text-dimmed">Available</div>
            </div>
          </div>
        </div>

        <div className="tabs">
          {[
            { key:'ALL',      label:`All Courses (${courses.length})` },
            { key:'ENROLLED', label:`My Courses (${enrolled.length})` },
            { key:'BROWSE',   label:`Explore (${available.length})` },
          ].map(({ key, label }) => (
            <button key={key} className={`tab-btn ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>

        {loading ? (
          <div className="grid-3">{[1,2,3,4,5,6].map(i=><div key={i} className="skeleton skeleton-card"/>)}</div>
        ) : displayed.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><BookOpen size={28} style={{ color:'var(--clr-text-3)' }}/></div>
            <h3>{tab === 'ENROLLED' ? "You haven't enrolled yet" : "No courses found"}</h3>
            <p>{tab === 'ENROLLED' ? 'Browse available courses to start learning' : 'Check back soon for new content'}</p>
            {tab === 'ENROLLED' && <button className="btn btn-primary" onClick={() => setTab('ALL')}>Browse Courses</button>}
          </div>
        ) : (
          <div className="grid-3">
            {displayed.map(course => {
              const isEnrolled = enrolledIds.includes(course._id?.toString());
              return (
                <Link key={course._id} to={`/courses/${course.slug || course._id}`} style={{ textDecoration:'none' }}>
                  <div className="card card-hover card-clickable" style={{ height:'100%', display:'flex', flexDirection:'column' }}>
                    {course.thumbnail && (
                      <div style={{ margin:'-24px -24px 16px', borderRadius:'var(--r-md) var(--r-md) 0 0', overflow:'hidden', height:130, background:'var(--clr-surface-2)' }}>
                        <img src={course.thumbnail} alt={course.title} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                      </div>
                    )}
                    {!course.thumbnail && (
                      <div style={{ margin:'-24px -24px 16px', borderRadius:'var(--r-md) var(--r-md) 0 0', height:100,
                        background:`linear-gradient(135deg, var(--clr-primary-dim), var(--clr-accent-dim))`,
                        display:'flex', alignItems:'center', justifyContent:'center'
                      }}>
                        <BookOpen size={32} style={{ color:'var(--clr-primary)', opacity:0.6 }}/>
                      </div>
                    )}

                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                      <div style={{ flex:1 }}>
                        <h3 style={{ fontWeight:700, fontSize:'0.92rem', marginBottom:4, lineHeight:1.3 }}>{course.title}</h3>
                        {course.instructor && <div className="text-xs text-dimmed">{course.instructor}</div>}
                      </div>
                    </div>

                    <p className="text-sm text-muted" style={{ lineHeight:1.6, flex:1, marginBottom:14 }}>
                      {course.description?.slice(0,80)}{course.description?.length>80?'…':''}
                    </p>

                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div style={{ display:'flex', gap:10 }}>
                        {course.duration && (
                          <span className="text-xs text-dimmed" style={{ display:'flex', alignItems:'center', gap:3 }}>
                            <Clock size={11}/>{course.duration}
                          </span>
                        )}
                        {course.rating && (
                          <span className="text-xs text-dimmed" style={{ display:'flex', alignItems:'center', gap:3 }}>
                            <Star size={11} style={{ color:'var(--clr-warning)' }}/>{course.rating}
                          </span>
                        )}
                      </div>
                      {isEnrolled ? (
                        <span className="badge badge-green" style={{ gap:4 }}><CheckCircle2 size={11}/>Enrolled</span>
                      ) : (
                        <div style={{ display:'flex', alignItems:'center', gap:4 }} className="text-xs" style={{ color:'var(--clr-primary)', fontWeight:600 }}>
                          Enroll <ArrowRight size={11}/>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
