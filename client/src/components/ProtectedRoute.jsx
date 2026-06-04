import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isStaff } from '../utils/roles';
import { isStudentViewActive } from '../utils/studentView';
import Spinner from './ui/Spinner';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/** Study app routes — staff need "Preview as student" enabled. */
export function StudentViewRoute({ children }) {
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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isStaff(user.role) && !preview) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

export function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isStaff(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;

  if (user) {
    return <Navigate to={isStaff(user.role) ? '/admin' : '/dashboard'} replace />;
  }

  return children;
}
