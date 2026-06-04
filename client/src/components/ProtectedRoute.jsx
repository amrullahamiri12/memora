import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isStaff } from '../utils/roles';
import Spinner from './ui/Spinner';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;

  if (!user) {
    return <Navigate to="/login" replace />;
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
