import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStudentPreview } from '../hooks/useStudentPreview';
import { getAppHomePath } from '../utils/appHome';
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
  const inStudentPreview = staff && studentPreview;

  const appHomePath = getAppHomePath(user, inStudentPreview);
  const appHomeLabel = staff && !inStudentPreview ? 'Admin' : 'Dashboard';

  const menuLinks = user
    ? [
        { to: appHomePath, label: appHomeLabel },
        ...(!staff || inStudentPreview
          ? [
              {
                to: inStudentPreview ? withPreviewQuery('/profile') : '/profile',
                label: 'Profile',
              },
            ]
          : []),
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

  return {
    user,
    staff,
    inStudentPreview,
    menuLinks,
    handleLogout,
    enterStudentPreview,
    showLearnerView: staff && !inStudentPreview,
  };
}
