const STORAGE_KEY = 'memora_student_view';

export function isStudentViewActive() {
  return sessionStorage.getItem(STORAGE_KEY) === '1';
}

export function enableStudentView() {
  sessionStorage.setItem(STORAGE_KEY, '1');
}

export function disableStudentView() {
  sessionStorage.removeItem(STORAGE_KEY);
}

/** Regular users always; staff only when preview mode is on. */
export function canAccessStudentApp(user) {
  if (!user) return false;
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') return true;
  return isStudentViewActive();
}
