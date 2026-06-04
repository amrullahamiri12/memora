const STAFF_ROLES = ['ADMIN', 'SUPER_ADMIN'];

function isStaff(role) {
  return STAFF_ROLES.includes(role);
}

function isSuperAdmin(role) {
  return role === 'SUPER_ADMIN';
}

function canAssignRole(actorRole, newRole) {
  if (newRole === 'SUPER_ADMIN') {
    return isSuperAdmin(actorRole);
  }
  return isStaff(actorRole);
}

function canEditUser(actor, target) {
  if (!isStaff(actor.role)) return false;
  if (isSuperAdmin(target.role) && !isSuperAdmin(actor.role)) {
    return false;
  }
  return true;
}

function canDeleteUser(actor, target) {
  if (actor.id === target.id) return false;
  if (isSuperAdmin(target.role) && !isSuperAdmin(actor.role)) {
    return false;
  }
  return isStaff(actor.role);
}

function assertRoleChangeAllowed(actor, existing, newRole) {
  if (!canAssignRole(actor.role, newRole)) {
    return 'Only a super admin can assign the super admin role';
  }

  if (actor.id === existing.id && isSuperAdmin(existing.role) && newRole !== 'SUPER_ADMIN') {
    return 'You cannot remove your own super admin access';
  }

  if (isSuperAdmin(existing.role) && !isSuperAdmin(actor.role)) {
    return 'You cannot modify a super admin account';
  }

  return null;
}

module.exports = {
  STAFF_ROLES,
  isStaff,
  isSuperAdmin,
  canAssignRole,
  canEditUser,
  canDeleteUser,
  assertRoleChangeAllowed,
};
