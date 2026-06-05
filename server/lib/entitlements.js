const { isGuestEmail } = require('./guestIdentity');

/**
 * Plan entitlements — the single source of truth for what each tier can do.
 * FREE intentionally preserves today's behavior so introducing plans changes
 * nothing for existing users until a paid plan is granted.
 *
 * Use Infinity for "unlimited" numeric limits.
 */
const PLAN_LIMITS = {
  FREE: {
    maxActiveSubjects: 5,
    canCreateDecks: false,
    maxOwnedDecks: 0,
    aiMonthlyQuota: 0,
    analytics: false,
  },
  PLUS: {
    maxActiveSubjects: Infinity,
    canCreateDecks: true,
    maxOwnedDecks: Infinity,
    aiMonthlyQuota: 200,
    analytics: true,
  },
};

// Guests get a tighter active-subject cap regardless of plan (conversion nudge).
const GUEST_MAX_ACTIVE_SUBJECTS = 3;

const PAID_PLANS = ['PLUS'];

function normalizePlan(plan) {
  return PLAN_LIMITS[plan] ? plan : 'FREE';
}

function planOf(userOrPlan) {
  if (typeof userOrPlan === 'string') return normalizePlan(userOrPlan);
  return normalizePlan(userOrPlan?.plan);
}

/** Resolve the full entitlement set for a user, bare plan string, or email. */
function entitlementsFor(userOrPlan) {
  const plan = planOf(userOrPlan);
  const base = PLAN_LIMITS[plan];
  // Guests are capped tighter on active subjects, regardless of plan. The input
  // may be a user object or a raw email string (some call sites pass only email).
  const email = typeof userOrPlan === 'string' ? userOrPlan : userOrPlan?.email;
  if (email && isGuestEmail(email)) {
    return { ...base, maxActiveSubjects: GUEST_MAX_ACTIVE_SUBJECTS };
  }
  return base;
}

function isPaidPlan(plan) {
  return PAID_PLANS.includes(normalizePlan(plan));
}

module.exports = {
  PLAN_LIMITS,
  PAID_PLANS,
  GUEST_MAX_ACTIVE_SUBJECTS,
  normalizePlan,
  planOf,
  entitlementsFor,
  isPaidPlan,
};
