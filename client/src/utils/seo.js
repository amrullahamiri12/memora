const DEFAULT_SITE_URL = 'https://memora.cards';

const DEFAULTS = {
  title: 'Memora — Flashcards, quizzes & study progress',
  description:
    'Memora is a study app with flashcards, learn mode, and tests. Enroll in subjects, track mastery, streaks, and progress.',
  image: '/memora-logo.png',
};

/** Public routes we want indexed; app screens are noindex. */
const ROUTE_META = {
  '/': {
    title: 'Memora — Study flashcards, quizzes & tests',
    description:
      'Study smarter with Memora. Enroll in subjects, practice with flashcards and quizzes, and track mastery and streaks over time.',
    index: true,
    jsonLd: true,
  },
  '/home': {
    title: 'Memora — Study flashcards, quizzes & tests',
    description:
      'Study smarter with Memora. Enroll in subjects, practice with flashcards and quizzes, and track mastery and streaks over time.',
    index: false,
  },
  '/login': {
    title: 'Sign in — Memora',
    description: 'Sign in to Memora to continue studying your enrolled subjects.',
    index: true,
  },
  '/register': {
    title: 'Create account — Memora',
    description: 'Create a free Memora account, pick subjects, and start studying with flashcards and quizzes.',
    index: true,
  },
  '/about': {
    title: 'About — Memora',
    description:
      'Memora, cultivate your mind — adaptive flashcards, quizzes, and progress tracking from Willow Team LLC.',
    index: true,
  },
  '/features': {
    title: 'How Memora works — Memora',
    description:
      'Learn how Memora learn mode, flashcards, and streak tracking help you study smarter and track progress.',
    index: true,
  },
  '/pricing': {
    title: 'Pricing — Memora',
    description:
      'Memora is free for core study today. See what is included and learn about future Plus and Team plans.',
    index: true,
  },
  '/help': {
    title: 'Help — Memora',
    description:
      'Frequently asked questions about Memora accounts, study modes, streaks, teams, and support.',
    index: true,
  },
  '/for-teams': {
    title: 'For teams — Memora',
    description:
      'Memora for schools and organizations — admin dashboard, content management, learner reports, and learner view.',
    index: true,
  },
  '/contact': {
    title: 'Contact us — Memora',
    description: 'Get in touch with the Memora team for support, partnerships, or general questions.',
    index: true,
  },
  '/explore': {
    title: 'Explore subjects — Memora',
    description:
      'Browse Memora subjects and start studying free with no sign-up. Create an account later to save your progress.',
    index: true,
  },
  '/privacy': {
    title: 'Privacy policy — Memora',
    description: 'How Memora collects, uses, and protects your account and study data.',
    index: true,
  },
  '/terms': {
    title: 'Terms of service — Memora',
    description: 'Terms of use for the Memora study app at memora.cards.',
    index: true,
  },
  '/forgot-password': {
    title: 'Forgot password — Memora',
    description: 'Reset your Memora account password.',
    index: false,
  },
  '/reset-password': {
    title: 'Reset password — Memora',
    description: 'Choose a new password for your Memora account.',
    index: false,
  },
};

const NOINDEX_PREFIXES = [
  '/admin',
  '/dashboard',
  '/study',
  '/subjects',
  '/topics',
  '/practice',
  '/flashcards',
  '/profile',
  '/account',
  '/guest',
  '/verify-email',
  '/api-docs',
  '/start',
];

export function getSiteUrl() {
  const fromEnv = (import.meta.env.VITE_SITE_URL || '').trim().replace(/\/$/, '');
  return fromEnv || DEFAULT_SITE_URL;
}

function resolveMeta(pathname) {
  if (ROUTE_META[pathname]) return ROUTE_META[pathname];
  if (pathname.startsWith('/explore/') && pathname.length > '/explore/'.length) {
    return {
      title: 'Start studying — Memora',
      description:
        'Choose how to start studying on Memora — create an account, sign in, or continue as a guest.',
      index: true,
    };
  }
  if (NOINDEX_PREFIXES.some((p) => pathname.startsWith(p))) {
    return {
      title: 'Memora',
      description: DEFAULTS.description,
      index: false,
    };
  }
  return { ...DEFAULTS, title: DEFAULTS.title, index: false };
}

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function removeJsonLd() {
  document.getElementById('memora-jsonld')?.remove();
}

function injectJsonLd(siteUrl) {
  removeJsonLd();
  const script = document.createElement('script');
  script.id = 'memora-jsonld';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Memora',
    url: siteUrl,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    description: ROUTE_META['/'].description,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  });
  document.head.appendChild(script);
}

export function applyPageSeo(pathname) {
  const siteUrl = getSiteUrl();
  const meta = resolveMeta(pathname);
  const canonical = `${siteUrl}${pathname === '/' ? '' : pathname}`;
  const imageUrl = meta.image?.startsWith('http') ? meta.image : `${siteUrl}${meta.image || DEFAULTS.image}`;
  const robots = meta.index ? 'index, follow' : 'noindex, nofollow';

  document.title = meta.title;
  upsertMeta('name', 'description', meta.description);
  upsertMeta('name', 'robots', robots);
  upsertMeta('name', 'theme-color', '#2d6a6a');

  upsertLink('canonical', canonical);

  upsertMeta('property', 'og:type', 'website');
  upsertMeta('property', 'og:site_name', 'Memora');
  upsertMeta('property', 'og:title', meta.title);
  upsertMeta('property', 'og:description', meta.description);
  upsertMeta('property', 'og:url', canonical);
  upsertMeta('property', 'og:image', imageUrl);
  upsertMeta('property', 'og:locale', 'en_US');

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', meta.title);
  upsertMeta('name', 'twitter:description', meta.description);
  upsertMeta('name', 'twitter:image', imageUrl);

  if (meta.jsonLd && pathname === '/') injectJsonLd(siteUrl);
  else removeJsonLd();
}
