import { useAuth } from '../context/AuthContext';
import { usesLearnerEnrollment } from '../utils/enrollmentQuota';
import { useStudentPreview } from './useStudentPreview';

/** Reactive learner-enrollment mode (learners, guests, staff in learner preview). */
export function useLearnerEnrollment() {
  const { user } = useAuth();
  const studentPreview = useStudentPreview();
  return usesLearnerEnrollment(user, studentPreview);
}
