import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStudentPreview } from '../hooks/useStudentPreview';
import { isStaff } from '../utils/roles';
import {
  disableStudentView,
  enableStudentView,
  withPreviewQuery,
} from '../utils/studentView';

export function usePublicUserActions() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const studentPreview = useStudentPreview();
  const staff = isStaff(user?.role);

  const menuLinks = user
    ? staff
      ? [
          { to: '/admin/dashboard', label: 'Dashboard' },
          { to: '/account', label: 'Account' },
        ]
      : [
          { to: '/dashboard', label: 'Dashboard' },
          { to: '/profile', label: 'Profile' },
          { to: '/account', label: 'Account' },
        ]
    : [];

  const handleLogout = async () => {
    disableStudentView();
    await logout();
    navigate('/login');
  };

  const enterStudentPreview = () => {
    enableStudentView();
    navigate(withPreviewQuery('/dashboard'));
  };

  const exitStudentPreview = () => {
    disableStudentView();
    navigate('/admin/dashboard');
  };

  return {
    user,
    staff,
    menuLinks,
    handleLogout,
    enterStudentPreview,
    exitStudentPreview,
    showLearnerView: staff && !studentPreview,
    showExitLearnerView: staff && studentPreview,
  };
}
