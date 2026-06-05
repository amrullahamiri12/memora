/** Legal entity operating Memora (memora.cards). */
export const COMPANY_LEGAL_NAME = 'Willow Team LLC';

export const MEMORA_SLOGAN = 'Memora, cultivate your mind';

/** Header links (subset — legal pages are footer-first). */
export const PUBLIC_HEADER_LINKS = [
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
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
