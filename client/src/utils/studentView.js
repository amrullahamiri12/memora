const STORAGE_KEY = 'memora_student_view';
export const PREVIEW_PARAM = 'preview';

export function isStudentViewActive() {
  return sessionStorage.getItem(STORAGE_KEY) === '1';
}

export function hasPreviewQuery(searchParams) {
  return searchParams?.get(PREVIEW_PARAM) === '1';
}

/** Staff may use student routes when storage or ?preview=1 is set. */
export function isStaffStudentPreview(searchParams) {
  return isStudentViewActive() || hasPreviewQuery(searchParams);
}

/** If URL has ?preview=1, persist so refresh on routes without the query still works. */
export function syncPreviewFromSearchParams(searchParams) {
  if (!hasPreviewQuery(searchParams)) {
    return isStudentViewActive();
  }
  if (!isStudentViewActive()) {
    sessionStorage.setItem(STORAGE_KEY, '1');
    window.dispatchEvent(new Event('memora-student-view'));
  }
  return true;
}

export function enableStudentView() {
  sessionStorage.setItem(STORAGE_KEY, '1');
  window.dispatchEvent(new Event('memora-student-view'));
}

export function disableStudentView() {
  sessionStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('memora-student-view'));
}

export function withPreviewQuery(path) {
  const [pathname, search = ''] = path.split('?');
  const params = new URLSearchParams(search);
  params.set(PREVIEW_PARAM, '1');
  const q = params.toString();
  return q ? `${pathname}?${q}` : pathname;
}

export function stripPreviewQuery(pathname, search = '') {
  const params = new URLSearchParams(search);
  params.delete(PREVIEW_PARAM);
  const q = params.toString();
  return q ? `${pathname}?${q}` : pathname;
}
