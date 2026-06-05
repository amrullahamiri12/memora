export const ADMIN_SECTIONS = [
  {
    id: 'overview',
    label: 'Overview',
    match: (path) => path === '/admin/dashboard',
    items: [{ to: '/admin/dashboard', label: 'Dashboard', exact: true }],
  },
  {
    id: 'reports',
    label: 'Reports',
    match: (path) => path.startsWith('/admin/reports'),
    items: [
      { to: '/admin/reports/learners', label: 'Learner engagement' },
      { to: '/admin/reports/content', label: 'Content health' },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    match: (path) =>
      path.startsWith('/admin/subjects') || path.startsWith('/admin/cards'),
    items: [
      { to: '/admin/subjects', label: 'Subjects' },
      { to: '/admin/cards', label: 'Flashcards' },
    ],
  },
  {
    id: 'people',
    label: 'People',
    match: (path) => path.startsWith('/admin/users'),
    items: [{ to: '/admin/users', label: 'Users', exact: true }],
  },
];

export const ADMIN_HEADER_NAV = [
  { type: 'link', to: '/admin/dashboard', label: 'Dashboard', exact: true },
  { type: 'group', label: 'Reports', sectionId: 'reports' },
  { type: 'group', label: 'Content', sectionId: 'content' },
  { type: 'link', to: '/admin/users', label: 'Users' },
];

export function isAdminPath(pathname) {
  return pathname.startsWith('/admin');
}

export function getAdminSection(pathname) {
  return ADMIN_SECTIONS.find((section) => section.match(pathname)) ?? null;
}

export function isNavItemActive(pathname, to, exact = false) {
  if (exact) return pathname === to;
  if (to === '/admin/dashboard') return pathname === '/admin/dashboard';
  if (to === '/admin/cards') return pathname === '/admin/cards';
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function isHeaderGroupActive(pathname, sectionId) {
  const section = ADMIN_SECTIONS.find((s) => s.id === sectionId);
  return section ? section.match(pathname) : false;
}
