import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute, StudentViewRoute, AdminRoute, GuestRoute } from './components/ProtectedRoute';
import { useStudentPreview } from './hooks/useStudentPreview';
import { isStaff } from './utils/roles';
import Spinner from './components/ui/Spinner';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import SubjectPage from './pages/SubjectPage';
import StudyPage from './pages/StudyPage';
import PracticePage from './pages/PracticePage';
import FlashcardsPage from './pages/FlashcardsPage';
import ProfilePage from './pages/ProfilePage';
import AccountPage from './pages/AccountPage';
import AdminFlashcards from './pages/admin/AdminFlashcards';
import AdminSubjects from './pages/admin/AdminSubjects';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminReportsLearners from './pages/admin/AdminReportsLearners';
import AdminReportsContent from './pages/admin/AdminReportsContent';
import Landing from './pages/Landing';
import { isGuestUser } from './utils/guest';
import GuestSetupPage from './pages/GuestSetupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import SeoManager from './components/SeoManager';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function Home() {
  const { user, loading } = useAuth();
  const preview = useStudentPreview();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!user) return <Landing />;
  if (isStaff(user.role) && !preview) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (isGuestUser(user)) {
    return <Navigate to="/guest/setup" replace />;
  }
  if (user.emailVerified === false) {
    return <Navigate to="/verify-email" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

function DashboardRoute() {
  return (
    <StudentViewRoute>
      <Dashboard />
    </StudentViewRoute>
  );
}

function AppRoutes() {
  return (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <GuestRoute>
                <ForgotPasswordPage />
              </GuestRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <GuestRoute>
                <ResetPasswordPage />
              </GuestRoute>
            }
          />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/dashboard" element={<DashboardRoute />} />
          <Route
            path="/guest/setup"
            element={
              <StudentViewRoute>
                <GuestSetupPage />
              </StudentViewRoute>
            }
          />
          <Route
            path="/subjects/:id"
            element={
              <StudentViewRoute>
                <SubjectPage />
              </StudentViewRoute>
            }
          />
          <Route
            path="/study/:topicId"
            element={
              <StudentViewRoute>
                <StudyPage />
              </StudentViewRoute>
            }
          />
          <Route
            path="/practice/:topicId"
            element={
              <StudentViewRoute>
                <PracticePage />
              </StudentViewRoute>
            }
          />
          <Route
            path="/flashcards/:topicId"
            element={
              <StudentViewRoute>
                <FlashcardsPage />
              </StudentViewRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <StudentViewRoute>
                <ProfilePage />
              </StudentViewRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route
            path="/admin/reports"
            element={<Navigate to="/admin/dashboard" replace />}
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/reports/learners"
            element={
              <AdminRoute>
                <AdminReportsLearners />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/reports/content"
            element={
              <AdminRoute>
                <AdminReportsContent />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/cards"
            element={
              <AdminRoute>
                <AdminFlashcards />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/subjects"
            element={
              <AdminRoute>
                <AdminSubjects />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
        </Routes>
  );
}

export default function App() {
  const inner = (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <SeoManager />
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );

  if (!googleClientId) return inner;
  return <GoogleOAuthProvider clientId={googleClientId}>{inner}</GoogleOAuthProvider>;
}
