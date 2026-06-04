const { parseUserGroupFilter } = require('../lib/adminUserFilters');

describe('adminUserFilters', () => {
  it('filters learners only', () => {
    const f = parseUserGroupFilter({ group: 'learners' });
    expect(f.prisma).toEqual({ role: 'USER' });
    expect(f.sql).toContain("role = 'USER'");
  });

  it('filters admins only', () => {
    const f = parseUserGroupFilter({ group: 'admins' });
    expect(f.prisma.role.in).toEqual(['ADMIN', 'SUPER_ADMIN']);
    expect(f.sql).toContain('SUPER_ADMIN');
  });

  it('returns no filter for all', () => {
    const f = parseUserGroupFilter({ group: 'all' });
    expect(f.prisma).toEqual({});
    expect(f.sql).toBe('');
  });
});
