import { api as defaultApi } from './api';
import { isGuestUser } from './guest';
import { isStaff } from './roles';
import { deriveEnrollmentQuota, enrollmentLimitApplies, formatEnrollmentLimitError } from './enrollmentQuota';
import { enableStudentView, isStudentViewActive, withPreviewQuery } from './studentView';

export const START_SUBJECT_ERRORS = {
  INVALID_SUBJECT: 'INVALID_SUBJECT',
  ENROLLMENT_LIMIT: 'ENROLLMENT_LIMIT',
  EMAIL_UNVERIFIED: 'EMAIL_UNVERIFIED',
  STAFF_NO_PREVIEW: 'STAFF_NO_PREVIEW',
};

/**
 * One-click subject entry: guest session (if needed), enroll, return navigation path.
 * @returns {Promise<{ ok: true, path: string, subject: object } | { ok: false, code: string, message: string, path?: string }>}
 */
export async function startSubjectAsGuest(subjectId, options = {}) {
  const {
    user = null,
    continueAsGuest,
    api = defaultApi,
    catalog = null,
    enablePreviewForStaff = true,
  } = options;

  if (!subjectId || typeof subjectId !== 'string') {
    return {
      ok: false,
      code: START_SUBJECT_ERRORS.INVALID_SUBJECT,
      message: 'Subject not found.',
    };
  }

  let catalogRows = catalog;
  if (!catalogRows) {
    catalogRows = await api('/subjects/catalog');
  }
  const subject = catalogRows.find((s) => s.id === subjectId);
  if (!subject) {
    return {
      ok: false,
      code: START_SUBJECT_ERRORS.INVALID_SUBJECT,
      message: 'Subject not found.',
    };
  }

  let currentUser = user;
  if (!currentUser) {
    if (!continueAsGuest) {
      throw new Error('continueAsGuest is required when user is not signed in');
    }
    currentUser = await continueAsGuest();
  }

  if (isStaff(currentUser.role) && !isStudentViewActive()) {
    if (enablePreviewForStaff) {
      enableStudentView();
    } else {
      return {
        ok: false,
        code: START_SUBJECT_ERRORS.STAFF_NO_PREVIEW,
        message: 'Enable learner view from the admin menu to study subjects.',
        path: '/admin/dashboard',
      };
    }
  }

  if (
    !isGuestUser(currentUser) &&
    !isStaff(currentUser.role) &&
    currentUser.emailVerified === false
  ) {
    return {
      ok: false,
      code: START_SUBJECT_ERRORS.EMAIL_UNVERIFIED,
      message: 'Verify your email before studying.',
      path: '/verify-email',
    };
  }

  const enrolled = await api('/subjects');
  const alreadyEnrolled = enrolled.some((s) => s.id === subjectId);

  if (!alreadyEnrolled) {
    if (enrollmentLimitApplies(currentUser)) {
      const quota = deriveEnrollmentQuota(enrolled, currentUser);
      if (!quota.canEnrollMore) {
        return {
          ok: false,
          code: START_SUBJECT_ERRORS.ENROLLMENT_LIMIT,
          message: formatEnrollmentLimitError(currentUser),
          path: '/dashboard',
        };
      }
    }
    await api('/subjects/enroll', {
      method: 'POST',
      body: JSON.stringify({ subjectIds: [subjectId] }),
    });
  }

  let path = `/subjects/${subjectId}`;
  if (isStaff(currentUser.role) && isStudentViewActive()) {
    path = withPreviewQuery(path);
  }
  return { ok: true, path, subject };
}
