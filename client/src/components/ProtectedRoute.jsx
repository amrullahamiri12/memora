import { Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { isStaff } from '../utils/roles';
import { isGuestUser } from '../utils/guest';
import { useStudentPreview } from '../hooks/useStudentPreview';
import Spinner from './ui/Spinner';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/** Study app routes — staff need preview enabled (?preview=1 or prior opt-in). */
export function StudentViewRoute({ children }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const preview = useStudentPreview();

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

  if (!isGuestUser(user) && user.emailVerified === false) {
    return <Navigate to="/verify-email" replace />;
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
    let to = '/dashboard';
    if (isStaff(user.role)) to = '/admin';
    else if (isGuestUser(user)) to = '/guest/setup';
    else if (user.emailVerified === false) to = '/verify-email';
    return <Navigate to={to} replace />;
  }

  return children;
}
