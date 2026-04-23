import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './context/SocketContext';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';

// ── Auth ─────────────────────────────────────────────────────────────
import Login    from './pages/auth/Login';
import Register from './pages/auth/Register';

// ── Student ───────────────────────────────────────────────────────────
import StudentDashboard from './pages/student/Dashboard';
import Listings         from './pages/student/Listings';
import ListingDetail    from './pages/student/ListingDetail';
import MyApplications   from './pages/student/MyApplications';
import Profile          from './pages/student/Profile';
import Hackathons       from './pages/student/Hackathons';
import HackathonDetail  from './pages/student/HackathonDetail';
import HackathonSubmit  from './pages/student/HackathonSubmit';
import AcceptInvite     from './pages/student/AcceptInvite';
import FinalExam        from './pages/student/FinalExam';
import Courses          from './pages/student/Courses';
import Notifications    from './pages/student/Notifications';
import ILMDashboard     from './pages/student/ILMDashboard';
import DailyLog         from './pages/student/DailyLog';
import WorkBreakdown    from './pages/student/WorkBreakdown';
import Certificate      from './pages/student/Certificate';
import TeamManagement   from './pages/student/TeamManagement';
import Subscription     from './pages/student/Subscription';

// ── Company ───────────────────────────────────────────────────────────
import CompanyDashboard from './pages/company/CompanyDashboard';
import CompanyListings  from './pages/company/CompanyListings';
import CreateListing    from './pages/company/CreateListing';
import Applicants       from './pages/company/Applicants';
import Candidates       from './pages/company/Candidates';
import CompanySettings  from './pages/company/CompanySettings';
import CompanyPricing   from './pages/company/CompanyPricing';
import CompanyHackathons from './pages/company/CompanyHackathons';
import CompanyCreateHackathon from './pages/company/CompanyCreateHackathon';
import CompanyAnalytics from './pages/company/CompanyAnalytics';

// ── Admin ─────────────────────────────────────────────────────────────
import AdminDashboard       from './pages/admin/AdminDashboard';
import AdminUsers           from './pages/admin/AdminUsers';
import AdminCompanies       from './pages/admin/AdminCompanies';
import AdminILM             from './pages/admin/AdminILM';
import AdminHackathons       from './pages/admin/AdminHackathons';
import AdminHackathonReview  from './pages/admin/AdminHackathonReview';
import AdminCreateHackathon  from './pages/admin/AdminCreateHackathon';
import AdminTransactions     from './pages/admin/AdminTransactions';
import AdminCourseCMS        from './pages/admin/AdminCourseCMS';
import CourseDetail          from './pages/student/CourseDetail';

// ── Route Guards ──────────────────────────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const RedirectIfAuth = ({ children }) => {
  const { user } = useAuthStore();
  if (user) {
    if (['PLATFORM_ADMIN','SUPER_ADMIN'].includes(user.role)) return <Navigate to="/admin/dashboard" replace />;
    if (['COMPANY_ADMIN','COMPANY_HR'].includes(user.role))   return <Navigate to="/company/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Simple stub for routes not yet fully built (ILM sub-pages, etc.)
const ComingSoon = ({ title }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', flexDirection:'column', gap:16 }}>
    <div style={{ fontSize:'2rem' }}>🚧</div>
    <h2 style={{ fontWeight:800, fontSize:'1.3rem', color:'var(--clr-text)' }}>{title}</h2>
    <p style={{ color:'var(--clr-text-2)', fontSize:'0.9rem' }}>This feature is launching soon. Stay tuned!</p>
  </div>
);

// ── App ───────────────────────────────────────────────────────────────
export default function App() {
  const { theme } = useThemeStore();
  
  // Set initial theme on document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return (
    <BrowserRouter>
      <SocketProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--clr-surface)',
              color: 'var(--clr-text)',
              border: '1px solid var(--clr-border-2)',
              borderRadius: 'var(--r-sm)',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-sans)',
            },
          }}
        />
        <Routes>
          {/* ── Public ────────────────────────────────────────── */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login"    element={<RedirectIfAuth><Login    /></RedirectIfAuth>} />
          <Route path="/register" element={<RedirectIfAuth><Register /></RedirectIfAuth>} />
          <Route path="/verify/:certId" element={<ComingSoon title="Certificate Verification" />} />

          {/* ── Student ───────────────────────────────────────── */}
          <Route path="/dashboard"          element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
          <Route path="/listings"           element={<ProtectedRoute><Listings         /></ProtectedRoute>} />
          <Route path="/listings/:id"       element={<ProtectedRoute><ListingDetail    /></ProtectedRoute>} />
          <Route path="/my-applications"    element={<ProtectedRoute><MyApplications   /></ProtectedRoute>} />
          <Route path="/profile"            element={<ProtectedRoute><Profile          /></ProtectedRoute>} />
          <Route path="/profile/analytics"  element={<ProtectedRoute><Profile          /></ProtectedRoute>} />
          <Route path="/hackathons"         element={<ProtectedRoute><Hackathons       /></ProtectedRoute>} />
          <Route path="/hackathons/:slug"   element={<ProtectedRoute><HackathonDetail  /></ProtectedRoute>} />
          <Route path="/hackathons/:slug/team"   element={<ProtectedRoute><TeamManagement /></ProtectedRoute>} />
          <Route path="/hackathons/:slug/submit" element={<ProtectedRoute><HackathonSubmit /></ProtectedRoute>} />
          <Route path="/hackathons/:slug/accept-invite/:token" element={<ProtectedRoute><AcceptInvite /></ProtectedRoute>} />
          <Route path="/courses"            element={<ProtectedRoute><Courses          /></ProtectedRoute>} />
          <Route path="/courses/my"         element={<ProtectedRoute><Courses          /></ProtectedRoute>} />
          <Route path="/courses/:slug"      element={<ProtectedRoute><CourseDetail     /></ProtectedRoute>} />
          <Route path="/notifications"      element={<ProtectedRoute><Notifications    /></ProtectedRoute>} />
          <Route path="/settings/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />

          {/* ── ILM — accessible to STUDENT (offer pending) + INTERN (active) ── */}
          <Route path="/ilm"             element={<ProtectedRoute allowedRoles={['INTERN','STUDENT','PRO_STUDENT']}><ILMDashboard /></ProtectedRoute>} />
          <Route path="/ilm/daily-log"   element={<ProtectedRoute allowedRoles={['INTERN','STUDENT','PRO_STUDENT']}><DailyLog     /></ProtectedRoute>} />
          <Route path="/ilm/wbs"         element={<ProtectedRoute allowedRoles={['INTERN','STUDENT','PRO_STUDENT']}><WorkBreakdown /></ProtectedRoute>} />
          <Route path="/ilm/exam"        element={<ProtectedRoute allowedRoles={['INTERN','STUDENT','PRO_STUDENT']}><FinalExam     /></ProtectedRoute>} />
          <Route path="/ilm/certificate" element={<ProtectedRoute allowedRoles={['INTERN','STUDENT','PRO_STUDENT']}><Certificate   /></ProtectedRoute>} />

          {/* ── Company ───────────────────────────────────────── */}
          <Route path="/company/dashboard"               element={<ProtectedRoute allowedRoles={['COMPANY_ADMIN','COMPANY_HR']}><CompanyDashboard /></ProtectedRoute>} />
          <Route path="/company/listings"                element={<ProtectedRoute allowedRoles={['COMPANY_ADMIN','COMPANY_HR']}><CompanyListings  /></ProtectedRoute>} />
          <Route path="/company/listings/new"            element={<ProtectedRoute allowedRoles={['COMPANY_ADMIN','COMPANY_HR']}><CreateListing    /></ProtectedRoute>} />
          <Route path="/company/listings/:id/applicants" element={<ProtectedRoute allowedRoles={['COMPANY_ADMIN','COMPANY_HR']}><Applicants       /></ProtectedRoute>} />
          <Route path="/company/candidates"              element={<ProtectedRoute allowedRoles={['COMPANY_ADMIN','COMPANY_HR']}><Candidates       /></ProtectedRoute>} />
          <Route path="/company/hackathons"              element={<ProtectedRoute allowedRoles={['COMPANY_ADMIN','COMPANY_HR']}><CompanyHackathons /></ProtectedRoute>} />
          <Route path="/company/hackathons/new"          element={<ProtectedRoute allowedRoles={['COMPANY_ADMIN']}><CompanyCreateHackathon /></ProtectedRoute>} />
          <Route path="/company/analytics"               element={<ProtectedRoute allowedRoles={['COMPANY_ADMIN','COMPANY_HR']}><CompanyAnalytics /></ProtectedRoute>} />
          <Route path="/company/courses"                 element={<ProtectedRoute allowedRoles={['COMPANY_ADMIN','COMPANY_HR']}><Courses /></ProtectedRoute>} />
          <Route path="/company/pricing"                 element={<ProtectedRoute allowedRoles={['COMPANY_ADMIN']}><CompanyPricing /></ProtectedRoute>} />
          <Route path="/company/settings"                element={<ProtectedRoute allowedRoles={['COMPANY_ADMIN','COMPANY_HR']}><CompanySettings  /></ProtectedRoute>} />

          {/* ── Admin ─────────────────────────────────────────── */}
          <Route path="/admin/dashboard"    element={<ProtectedRoute allowedRoles={['PLATFORM_ADMIN','SUPER_ADMIN']}><AdminDashboard  /></ProtectedRoute>} />
          <Route path="/admin/users"        element={<ProtectedRoute allowedRoles={['PLATFORM_ADMIN','SUPER_ADMIN']}><AdminUsers      /></ProtectedRoute>} />
          <Route path="/admin/companies"    element={<ProtectedRoute allowedRoles={['PLATFORM_ADMIN','SUPER_ADMIN']}><AdminCompanies  /></ProtectedRoute>} />
          <Route path="/admin/hackathons"          element={<ProtectedRoute allowedRoles={['PLATFORM_ADMIN','SUPER_ADMIN']}><AdminHackathons /></ProtectedRoute>} />
          <Route path="/admin/hackathons/create"    element={<ProtectedRoute allowedRoles={['PLATFORM_ADMIN','SUPER_ADMIN']}><AdminCreateHackathon /></ProtectedRoute>} />
          <Route path="/admin/hackathons/:id/review" element={<ProtectedRoute allowedRoles={['PLATFORM_ADMIN','SUPER_ADMIN']}><AdminHackathonReview /></ProtectedRoute>} />
          <Route path="/admin/ilm"          element={<ProtectedRoute allowedRoles={['PLATFORM_ADMIN','SUPER_ADMIN']}><AdminILM        /></ProtectedRoute>} />
          <Route path="/admin/transactions" element={<ProtectedRoute allowedRoles={['PLATFORM_ADMIN','SUPER_ADMIN']}><AdminTransactions /></ProtectedRoute>} />
          <Route path="/admin/courses"      element={<ProtectedRoute allowedRoles={['PLATFORM_ADMIN','SUPER_ADMIN']}><AdminCourseCMS /></ProtectedRoute>} />

          {/* ── 404 ───────────────────────────────────────────── */}
          <Route path="*" element={
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:12 }}>
              <div style={{ fontSize:'3rem' }}>🌪</div>
              <h1 style={{ fontWeight:900, fontSize:'1.5rem' }}>404 — Page Not Found</h1>
              <p style={{ color:'var(--clr-text-2)' }}>This page doesn't exist.</p>
              <a href="/dashboard" className="btn btn-primary btn-sm" style={{ marginTop:8 }}>Go to Dashboard</a>
            </div>
          } />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
}
