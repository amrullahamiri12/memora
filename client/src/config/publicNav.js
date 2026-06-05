/** Legal entity operating Memora (memora.cards). */
export const COMPANY_LEGAL_NAME = 'Willow Team LLC';

export const MEMORA_SLOGAN = 'Memora, cultivate your mind';

/** Top-level marketing header links (left of dropdowns). */
export const PUBLIC_HEADER_LINKS = [
  { label: 'How it works', to: '/features' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'For teams', to: '/for-teams' },
];

/** Header dropdown groups (About, Resources). */
export const PUBLIC_HEADER_DROPDOWNS = [
  {
    id: 'about',
    label: 'About',
    items: [
      { label: 'About us', to: '/about', exact: true },
      { label: 'Contact', to: '/contact', exact: true },
    ],
  },
  {
    id: 'resources',
    label: 'Resources',
    items: [
      { label: 'Help', to: '/help', exact: true },
      { label: 'API documentation', href: '/api-docs.html' },
      { label: 'OpenAPI spec', href: '/openapi.yaml', download: true },
    ],
  },
];

/** Guest-only header CTAs (right side). */
export const PUBLIC_HEADER_GUEST_CTAS = [
  { label: 'Sign in', to: '/login', variant: 'link' },
  { label: 'Get started', to: '/register', variant: 'primary' },
];

/** Footer link columns (title + links). */
export const FOOTER_NAV_SECTIONS = [
  {
    title: 'Get started',
    links: [
      { label: 'Create account', to: '/register' },
      { label: 'Sign in', to: '/login' },
    ],
  },
  {
    title: 'Product',
    links: [
      { label: 'How it works', to: '/features' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'For teams', to: '/for-teams' },
      { label: 'Help', to: '/help' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'API documentation', href: '/api-docs.html' },
      { label: 'OpenAPI spec', href: '/openapi.yaml', download: true },
    ],
  },
];

export function isPublicDropdownActive(pathname, items) {
  return items.some((item) => {
    if (!item.to) return false;
    if (item.exact) return pathname === item.to;
    return pathname === item.to || pathname.startsWith(`${item.to}/`);
  });
}
