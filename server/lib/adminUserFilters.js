/** Query `group`: all | learners (USER) | admins (ADMIN + SUPER_ADMIN) */
function parseUserGroupFilter(query = {}) {
  const group = String(query.group || 'all').toLowerCase();
  if (group === 'learners') {
    return {
      prisma: { role: 'USER' },
      sql: " AND role = 'USER'",
    };
  }
  if (group === 'admins') {
    return {
      prisma: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      sql: " AND role IN ('ADMIN', 'SUPER_ADMIN')",
    };
  }
  return { prisma: {}, sql: '' };
}

module.exports = { parseUserGroupFilter };
