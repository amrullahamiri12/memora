const { isStaff } = require('./roles');

const LEARNER_VIEW_HEADER = 'x-learner-view';

function isLearnerViewRequest(headers = {}) {
  const value =
    headers[LEARNER_VIEW_HEADER] ??
    headers[LEARNER_VIEW_HEADER.toLowerCase()] ??
    headers['X-Learner-View'];
  return String(value || '').trim() === '1';
}

/** Staff in learner view use enrolled subjects like learners. */
function shouldRestrictToEnrolledSubjects(user, learnerView) {
  if (!user) return false;
  if (!isStaff(user.role)) return true;
  return Boolean(learnerView);
}

module.exports = {
  LEARNER_VIEW_HEADER,
  isLearnerViewRequest,
  shouldRestrictToEnrolledSubjects,
};
