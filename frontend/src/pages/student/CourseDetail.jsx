import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import CompanyLayout from '../../layouts/CompanyLayout';
import useAuthStore from '../../store/authStore';
import { PlayCircle, Clock, Award, Star, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function CourseDetail() {
  const { slug } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  // Since we might not have a backend route for getting a single course by slug yet,
  // we can mock the data or try to fetch it. Let's mock it for the demo if it fails.
  useEffect(() => {
    api.get(`/courses`) // or /courses/:slug if implemented
      .then(res => {
        // Find from all courses if no specific route
        const found = res.data.data?.find(c => c.slug === slug || c._id === slug);
        if (found) setCourse(found);
        else setCourse(getMockCourse(slug));
      })
      .catch(() => setCourse(getMockCourse(slug)))
      .finally(() => setLoading(false));
  }, [slug]);

  const getMockCourse = (id) => ({
    _id: id,
    title: 'Advanced Full-Stack Engineering',
    description: 'Master React, Node.js, MongoDB and system design. Build production-ready applications with microservices and AWS deployment.',
    instructor: 'HireStorm Academy',
    duration: '12 Weeks',
    level: 'Advanced',
    price: 4999,
    modules: [
      { title: 'React Performance & Internals', duration: '2 Hours' },
      { title: 'Node.js Microservices Architecture', duration: '3.5 Hours' },
      { title: 'Advanced MongoDB Aggregations', duration: '2 Hours' },
      { title: 'AWS Deployment & CI/CD', duration: '4 Hours' }
    ]
  });

  const handleEnroll = async () => {
    if (course.price === 0) {
      toast.success('Successfully enrolled!');
      return;
    }
    
    setEnrolling(true);
    try {
      const orderRes = await api.post('/payments/create-order', {
        type: 'COURSE_PURCHASE',
        amount: course.price,
        metadata: { courseId: course._id }
      });
      const { order, transactionId } = orderRes.data;

      toast.loading('Processing demo payment...', { id: 'course_pay' });
      const verifyRes = await api.post('/payments/verify', {
        razorpayOrderId: order.id,
        transactionId
      });

      if (verifyRes.data.success) {
        toast.success('Course purchased successfully!', { id: 'course_pay' });
      } else {
        toast.error('Payment failed', { id: 'course_pay' });
      }
    } catch (err) {
      toast.error('Could not process payment', { id: 'course_pay' });
    } finally {
      setEnrolling(false);
    }
  };

  const isCompany = ['COMPANY_ADMIN', 'COMPANY_HR'].includes(user?.role);
  const Layout = isCompany ? CompanyLayout : StudentLayout;

  if (loading) return <Layout><div className="skeleton" style={{ height: 400 }} /></Layout>;

  return (
    <Layout>
      <div className="page" style={{ maxWidth: 800, margin: '0 auto' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
          ← Back to Courses
        </button>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ background: 'var(--clr-primary)', color: '#fff', padding: '40px 30px' }}>
            <span className="badge badge-yellow" style={{ marginBottom: 16 }}>{course.level}</span>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 12 }}>{course.title}</h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.5, maxWidth: 600 }}>{course.description}</p>
            
            <div style={{ display: 'flex', gap: 24, marginTop: 24, fontSize: '0.9rem', opacity: 0.8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={16} /> {course.duration}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Award size={16} /> Certificate Included</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Star size={16} /> 4.8/5 Rating</span>
            </div>
          </div>

          <div style={{ padding: 30 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, paddingBottom: 20, borderBottom: '1px solid var(--clr-border)' }}>
              <div>
                <div className="text-muted text-sm">Instructor</div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{course.instructor}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{course.price === 0 ? 'Free' : `₹${course.price.toLocaleString()}`}</div>
                <button className="btn btn-primary" onClick={handleEnroll} disabled={enrolling}>
                  {enrolling ? 'Processing...' : isCompany ? 'Buy for Team' : 'Enroll Now'}
                </button>
              </div>
            </div>

            <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={18} /> Course Syllabus
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {course.modules?.map((mod, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 16, background: 'var(--clr-surface-2)', borderRadius: 'var(--r-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <PlayCircle size={18} style={{ color: 'var(--clr-text-3)' }} />
                    <span style={{ fontWeight: 600 }}>{i + 1}. {mod.title}</span>
                  </div>
                  <span className="text-muted text-sm">{mod.duration}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
