import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './context/SocketContext';
import { CollegeAuthProvider } from './context/CollegeAuthContext';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';

// ── Auth ─────────────────────────────────────────────────────────────
import Login          from './pages/auth/Login';
import Register       from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword  from './pages/auth/ResetPassword';

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
import CompanyDashboard       from './pages/company/CompanyDashboard';
import CompanyListings        from './pages/company/CompanyListings';
import CreateListing          from './pages/company/CreateListing';
import Applicants             from './pages/company/Applicants';
import Candidates             from './pages/company/Candidates';
import CompanySettings        from './pages/company/CompanySettings';
import CompanyPricing         from './pages/company/CompanyPricing';
import CompanyHackathons      from './pages/company/CompanyHackathons';
import CompanyCreateHackathon from './pages/company/CompanyCreateHackathon';
import CompanyAnalytics       from './pages/company/CompanyAnalytics';
import CompanyNotifications   from './pages/company/CompanyNotifications';
import CompanyCourses         from './pages/company/CompanyCourses';

// ── Admin ─────────────────────────────────────────────────────────────
import AdminDashboard        from './pages/admin/AdminDashboard';
import AdminUsers            from './pages/admin/AdminUsers';
import AdminCompanies        from './pages/admin/AdminCompanies';
import AdminILM              from './pages/admin/AdminILM';
import AdminHackathons       from './pages/admin/AdminHackathons';
import AdminHackathonReview  from './pages/admin/AdminHackathonReview';
import AdminCreateHackathon  from './pages/admin/AdminCreateHackathon';
import AdminTransactions     from './pages/admin/AdminTransactions';
import AdminRevenue          from './pages/admin/AdminRevenue';
import AdminCourseCMS        from './pages/admin/AdminCourseCMS';
import AdminCampusDrives     from './pages/admin/AdminCampusDrives';
import CourseDetail          from './pages/student/CourseDetail';

// ── College ───────────────────────────────────────────────────────────
import CollegeLogin         from './pages/college/CollegeLogin';
import CollegePortal        from './pages/college/CollegePortal';
import DriveApplicationForm from './pages/college/DriveApplicationForm';
import AITestPage           from './pages/AITestPage';

// ── Role Groups ────────────────────────────────────────────────────────
const STUDENT_ROLES  = ['STUDENT', 'PRO_STUDENT', 'INTERN'];
const COMPANY_ROLES  = ['COMPANY_ADMIN', 'COMPANY_HR'];
const ADMIN_ROLES    = ['PLATFORM_ADMIN', 'SUPER_ADMIN'];
const ALL_ROLES      = [...STUDENT_ROLES, ...COMPANY_ROLES, ...ADMIN_ROLES];

// ── Route Guards ──────────────────────────────────────────────────────
const getDefaultPath = (role) => {
  if (ADMIN_ROLES.includes(role))   return '/admin/dashboard';
  if (COMPANY_ROLES.includes(role)) return '/company/dashboard';
  return '/dashboard';
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultPath(user.role)} replace />;
  }
  return children;
};

const RedirectIfAuth = ({ children }) => {
  const { user } = useAuthStore();
  if (user) return <Navigate to={getDefaultPath(user.role)} replace />;
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
      <CollegeAuthProvider>
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
          <Route path="/"                      element={<Navigate to="/login" replace />} />
          <Route path="/login"                 element={<RedirectIfAuth><Login           /></RedirectIfAuth>} />
          <Route path="/register"              element={<RedirectIfAuth><Register        /></RedirectIfAuth>} />
          <Route path="/forgot-password"       element={<RedirectIfAuth><ForgotPassword  /></RedirectIfAuth>} />
          <Route path="/reset-password/:token" element={<RedirectIfAuth><ResetPassword   /></RedirectIfAuth>} />
          <Route path="/verify/:certId"        element={<ComingSoon title="Certificate Verification" />} />

          {/* ── College & Public Forms ──────────────────────── */}
          <Route path="/college/login"  element={<CollegeLogin />} />
          <Route path="/college/:slug"  element={<CollegePortal />} />
          <Route path="/apply/:token"   element={<DriveApplicationForm />} />
          <Route path="/ai-test/:token" element={<AITestPage />} />

          {/* ── Student-only ───────────────────────────────────── */}
          <Route path="/dashboard"             element={<ProtectedRoute allowedRoles={STUDENT_ROLES}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/my-applications"       element={<ProtectedRoute allowedRoles={STUDENT_ROLES}><MyApplications  /></ProtectedRoute>} />
          <Route path="/profile"               element={<ProtectedRoute allowedRoles={STUDENT_ROLES}><Profile         /></ProtectedRoute>} />
          <Route path="/profile/analytics"     element={<ProtectedRoute allowedRoles={STUDENT_ROLES}><Profile         /></ProtectedRoute>} />
          <Route path="/settings/subscription" element={<ProtectedRoute allowedRoles={['STUDENT','PRO_STUDENT']}><Subscription /></ProtectedRoute>} />

          {/* ── Shared (all logged-in users can browse) ─────────── */}
          <Route path="/listings"         element={<ProtectedRoute allowedRoles={ALL_ROLES}><Listings        /></ProtectedRoute>} />
          <Route path="/listings/:id"     element={<ProtectedRoute allowedRoles={ALL_ROLES}><ListingDetail   /></ProtectedRoute>} />
          <Route path="/hackathons"       element={<ProtectedRoute allowedRoles={ALL_ROLES}><Hackathons      /></ProtectedRoute>} />
          <Route path="/hackathons/:slug" element={<ProtectedRoute allowedRoles={ALL_ROLES}><HackathonDetail /></ProtectedRoute>} />
          <Route path="/hackathons/:slug/team"                 element={<ProtectedRoute allowedRoles={STUDENT_ROLES}><TeamManagement  /></ProtectedRoute>} />
          <Route path="/hackathons/:slug/submit"               element={<ProtectedRoute allowedRoles={STUDENT_ROLES}><HackathonSubmit /></ProtectedRoute>} />
          <Route path="/hackathons/:slug/accept-invite/:token" element={<ProtectedRoute allowedRoles={STUDENT_ROLES}><AcceptInvite    /></ProtectedRoute>} />
          <Route path="/courses"          element={<ProtectedRoute allowedRoles={ALL_ROLES}><Courses         /></ProtectedRoute>} />
          <Route path="/courses/my"       element={<ProtectedRoute allowedRoles={STUDENT_ROLES}><Courses     /></ProtectedRoute>} />
          <Route path="/courses/:slug"    element={<ProtectedRoute allowedRoles={ALL_ROLES}><CourseDetail    /></ProtectedRoute>} />
          <Route path="/notifications"    element={<ProtectedRoute allowedRoles={ALL_ROLES}><Notifications   /></ProtectedRoute>} />

          {/* ── ILM — STUDENT + PRO_STUDENT + INTERN ──────────── */}
          <Route path="/ilm"             element={<ProtectedRoute allowedRoles={STUDENT_ROLES}><ILMDashboard  /></ProtectedRoute>} />
          <Route path="/ilm/daily-log"   element={<ProtectedRoute allowedRoles={STUDENT_ROLES}><DailyLog      /></ProtectedRoute>} />
          <Route path="/ilm/wbs"         element={<ProtectedRoute allowedRoles={STUDENT_ROLES}><WorkBreakdown /></ProtectedRoute>} />
          <Route path="/ilm/exam"        element={<ProtectedRoute allowedRoles={STUDENT_ROLES}><FinalExam     /></ProtectedRoute>} />
          <Route path="/ilm/certificate" element={<ProtectedRoute allowedRoles={STUDENT_ROLES}><Certificate   /></ProtectedRoute>} />

          {/* ── Company ───────────────────────────────────────── */}
          <Route path="/company/dashboard"               element={<ProtectedRoute allowedRoles={COMPANY_ROLES}><CompanyDashboard       /></ProtectedRoute>} />
          <Route path="/company/listings"                element={<ProtectedRoute allowedRoles={COMPANY_ROLES}><CompanyListings         /></ProtectedRoute>} />
          <Route path="/company/listings/new"            element={<ProtectedRoute allowedRoles={COMPANY_ROLES}><CreateListing           /></ProtectedRoute>} />
          <Route path="/company/listings/:id/applicants" element={<ProtectedRoute allowedRoles={COMPANY_ROLES}><Applicants              /></ProtectedRoute>} />
          <Route path="/company/candidates"              element={<ProtectedRoute allowedRoles={COMPANY_ROLES}><Candidates              /></ProtectedRoute>} />
          <Route path="/company/hackathons"              element={<ProtectedRoute allowedRoles={COMPANY_ROLES}><CompanyHackathons        /></ProtectedRoute>} />
          <Route path="/company/hackathons/new"          element={<ProtectedRoute allowedRoles={['COMPANY_ADMIN']}><CompanyCreateHackathon /></ProtectedRoute>} />
          <Route path="/company/analytics"               element={<ProtectedRoute allowedRoles={COMPANY_ROLES}><CompanyAnalytics         /></ProtectedRoute>} />
          <Route path="/company/courses"                 element={<ProtectedRoute allowedRoles={COMPANY_ROLES}><CompanyCourses            /></ProtectedRoute>} />
          <Route path="/company/pricing"                 element={<ProtectedRoute allowedRoles={['COMPANY_ADMIN']}><CompanyPricing       /></ProtectedRoute>} />
          <Route path="/company/notifications"           element={<ProtectedRoute allowedRoles={COMPANY_ROLES}><CompanyNotifications     /></ProtectedRoute>} />
          <Route path="/company/settings"                element={<ProtectedRoute allowedRoles={COMPANY_ROLES}><CompanySettings           /></ProtectedRoute>} />

          {/* ── Admin ─────────────────────────────────────────── */}
          <Route path="/admin/dashboard"             element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminDashboard       /></ProtectedRoute>} />
          <Route path="/admin/users"                 element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminUsers           /></ProtectedRoute>} />
          <Route path="/admin/companies"             element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminCompanies       /></ProtectedRoute>} />
          <Route path="/admin/hackathons"            element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminHackathons      /></ProtectedRoute>} />
          <Route path="/admin/hackathons/create"     element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminCreateHackathon /></ProtectedRoute>} />
          <Route path="/admin/hackathons/:id/review" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminHackathonReview /></ProtectedRoute>} />
          <Route path="/admin/ilm"                   element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminILM             /></ProtectedRoute>} />
          <Route path="/admin/transactions"          element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminTransactions    /></ProtectedRoute>} />
          <Route path="/admin/revenue"               element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminRevenue         /></ProtectedRoute>} />
          <Route path="/admin/courses"               element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminCourseCMS       /></ProtectedRoute>} />
          <Route path="/admin/drives"                element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminCampusDrives    /></ProtectedRoute>} />

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
      </CollegeAuthProvider>
    </BrowserRouter>
  );
}
