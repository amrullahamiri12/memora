import { isStaff } from './roles';
import { withPreviewQuery } from './studentView';

/** Primary app entry after sign-in (not the marketing landing at /home). */
export function getAppHomePath(user, inStudentPreview = false) {
  if (!user) return '/login';
  if (isStaff(user.role) && !inStudentPreview) return '/admin/dashboard';
  const path = '/dashboard';
  return inStudentPreview ? withPreviewQuery(path) : path;
}

/** Marketing landing: / for guests, /home for signed-in users. */
export function getMarketingHomePath(user) {
  return user ? '/home' : '/';
}
