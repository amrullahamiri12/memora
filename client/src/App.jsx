import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute, StudentViewRoute, AdminRoute, GuestRoute } from './components/ProtectedRoute';
import { isStaff } from './utils/roles';
import { isStudentViewActive } from './utils/studentView';
import Spinner from './components/ui/Spinner';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SubjectPage from './pages/SubjectPage';
import StudyPage from './pages/StudyPage';
import PracticePage from './pages/PracticePage';
import FlashcardsPage from './pages/FlashcardsPage';
import ProfilePage from './pages/ProfilePage';
import AccountPage from './pages/AccountPage';
import AdminFlashcards from './pages/admin/AdminFlashcards';
import AdminSubjects from './pages/admin/AdminSubjects';
import AdminUsers from './pages/admin/AdminUsers';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (isStaff(user.role) && !isStudentViewActive()) {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

function DashboardRoute() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [preview, setPreview] = useState(isStudentViewActive);

  useEffect(() => {
    const sync = () => setPreview(isStudentViewActive());
    window.addEventListener('memora-student-view', sync);
    return () => window.removeEventListener('memora-student-view', sync);
  }, []);

  useEffect(() => {
    if (!loading && user && isStaff(user.role) && !preview) {
      navigate('/admin', { replace: true });
    }
  }, [loading, user, preview, navigate]);

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (isStaff(user.role) && !preview) {
    return <Navigate to="/admin" replace />;
  }
  return <Dashboard />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
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
