/** Public feature guides — linked from landing cards via /features#slug */
export const FEATURE_GUIDES = [
  {
    slug: 'learn-mode',
    title: 'Learn mode',
    summary: 'Mixed quizzes with instant feedback across question types.',
    image: '/landing/feature-learn.webp',
    imageAlt: 'Person taking notes while learning on a laptop',
    lead: 'Work through a topic question by question with immediate feedback so you know what to review next.',
    sections: [
      {
        heading: 'What it is',
        body: 'Learn mode presents a mix of question types for the topic you chose — multiple choice, true/false, and more when available. Each answer is scored right away so you are not guessing whether you understood the material.',
      },
      {
        heading: 'How it helps',
        body: 'Instant feedback reinforces correct ideas and surfaces gaps while the material is still fresh. Your mastery score updates as you go, so the app can prioritize what needs more practice later.',
      },
      {
        heading: 'Getting started',
        body: 'Enroll in a subject, open a topic, and choose Learn. You can also try the app as a guest, pick subjects, and start a session without creating an account — sign up later to keep your progress.',
      },
    ],
  },
  {
    slug: 'flashcards',
    title: 'Flashcards',
    summary: 'Flip cards and rate what you know — progress follows you.',
    image: '/landing/feature-flashcards.webp',
    imageAlt: 'Desk with laptop and study materials for focused review',
    lead: 'Review cards at your own pace, rate how well you know each one, and pick up exactly where you left off.',
    sections: [
      {
        heading: 'What it is',
        body: 'Flashcard mode shows the front of a card first. Flip to reveal the answer, then rate whether you knew it. The session walks you through the deck for that topic until you finish or pause.',
      },
      {
        heading: 'How it helps',
        body: 'Self-rating keeps review honest and lightweight — no long forms, just a quick judgment after each card. Your ratings feed mastery tracking so cards you struggle with come back more often.',
      },
      {
        heading: 'Getting started',
        body: 'From any enrolled topic, open Flashcards to start a deck. Progress is saved to your account (or guest session) so the next visit continues from your last card.',
      },
    ],
  },
  {
    slug: 'streaks-profile',
    title: 'Streaks & profile',
    summary: 'Daily practice tracking and per-topic study stats.',
    image: '/landing/feature-streaks.webp',
    imageAlt: 'Planner and calendar for tracking daily study habits',
    lead: 'See how consistently you study, how your streak grows, and which topics deserve attention next.',
    sections: [
      {
        heading: 'What it is',
        body: 'Your profile summarizes study activity: current streak, recent practice, and mastery by topic. Streaks reward showing up on consecutive days — even a short session counts.',
      },
      {
        heading: 'How it helps',
        body: 'Per-topic stats make it easy to spot strong areas and weak spots without digging through every subject. That overview helps you plan the next Learn or Flashcards session with purpose.',
      },
      {
        heading: 'Getting started',
        body: 'Create an account (or continue as a guest and register later), study any mode on a topic, then open Profile from the app menu to view streaks and progress.',
      },
    ],
  },
];

export function featureGuidePath(slug) {
  return `/features#${slug}`;
}
