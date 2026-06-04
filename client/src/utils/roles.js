export function isStaff(role) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function isSuperAdmin(role) {
  return role === 'SUPER_ADMIN';
}

export function canEditUser(actor, target) {
  if (!isStaff(actor?.role)) return false;
  if (isSuperAdmin(target.role) && !isSuperAdmin(actor.role)) {
    return false;
  }
  return true;
}

export function canDeleteUser(actor, target) {
  if (!actor || !target) return false;
  if (actor.id === target.id) return false;
  if (isSuperAdmin(target.role) && !isSuperAdmin(actor.role)) {
    return false;
  }
  return isStaff(actor.role);
}

export function roleLabel(role) {
  if (role === 'SUPER_ADMIN') return 'Super admin';
  if (role === 'ADMIN') return 'Admin';
  return 'User';
}
