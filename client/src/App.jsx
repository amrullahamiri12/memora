import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import Landing from './pages/Landing';
import GuestSetupPage from './pages/GuestSetupPage';

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
    return <Navigate to="/admin" replace />;
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

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
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
          <Route
            path="/admin"
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
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
