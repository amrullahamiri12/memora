import { featureGuidePath } from './featureGuides';

/** Hero carousel — same slides in light and dark mode */
export const LANDING_HERO_SLIDES = [
  {
    image: '/landing/hero.webp',
    alt: 'Student studying with notebook and pen at a desk',
    objectPosition: 'center 40%',
    photographer: 'Green Chameleon',
    unsplashUrl: 'https://unsplash.com/photos/OP88TNuz5Ho',
  },
  {
    image: '/landing/hero-light.webp',
    alt: 'Open books and study materials in bright natural light',
    objectPosition: 'center 35%',
    photographer: 'Aaron Burden',
    unsplashUrl: 'https://unsplash.com/photos/55aiqBrRVNo',
  },
  {
    image: '/landing/hero-slide-3.webp',
    alt: 'Person taking notes while learning on a laptop',
    objectPosition: 'center center',
    photographer: 'Christina @ wocintechchat.com',
    unsplashUrl: 'https://unsplash.com/photos/bFZPJIFWMKE',
  },
  {
    image: '/landing/hero-slide-4.jpg',
    alt: 'Students collaborating while studying with laptops',
    objectPosition: 'center center',
    photographer: 'Element5 Digital',
    unsplashUrl: 'https://unsplash.com/photos/2sAQ3v6XBS4',
  },
  {
    image: '/landing/hero-slide-5.webp',
    alt: 'Desk with laptop and study materials for focused review',
    objectPosition: 'center center',
    photographer: 'Scott Graham',
    unsplashUrl: 'https://unsplash.com/photos/Q1p7bh3SHj8',
  },
  {
    image: '/landing/hero-slide-6.webp',
    alt: 'Planner and calendar for tracking daily study habits',
    objectPosition: 'center center',
    photographer: 'Glenn Carstens-Peters',
    unsplashUrl: 'https://unsplash.com/photos/npxXWgQ33ZQ',
  },
];

export const LANDING_HERO_INTERVAL_MS = 10_000;

export const LANDING_FEATURES = [
  {
    title: 'Learn mode',
    text: 'Mixed quizzes with instant feedback across question types.',
    learnMoreTo: featureGuidePath('learn-mode'),
    image: '/landing/feature-learn.webp',
    alt: 'Person taking notes while learning on a laptop',
    photographer: 'Christina @ wocintechchat.com',
    unsplashUrl: 'https://unsplash.com/photos/bFZPJIFWMKE',
  },
  {
    title: 'Flashcards',
    text: 'Flip cards and rate what you know — progress follows you.',
    learnMoreTo: featureGuidePath('flashcards'),
    image: '/landing/feature-flashcards.webp',
    alt: 'Desk with laptop and study materials for focused review',
    photographer: 'Scott Graham',
    unsplashUrl: 'https://unsplash.com/photos/Q1p7bh3SHj8',
  },
  {
    title: 'Streaks & profile',
    text: 'Daily practice tracking and per-topic study stats.',
    learnMoreTo: featureGuidePath('streaks-profile'),
    image: '/landing/feature-streaks.webp',
    alt: 'Planner and calendar for tracking daily study habits',
    photographer: 'Glenn Carstens-Peters',
    unsplashUrl: 'https://unsplash.com/photos/npxXWgQ33ZQ',
  },
];
