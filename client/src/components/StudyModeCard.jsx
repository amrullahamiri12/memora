import { Link } from 'react-router-dom';
import Card from './ui/Card';

const MODES = {
  learn: {
    icon: '🧠',
    title: 'Learn',
    description: 'Mixed questions with instant feedback. Weak cards come first.',
    iconClass: 'mode-icon-learn',
    ctaClass: 'mode-cta-learn',
  },
  flashcards: {
    icon: '🃏',
    title: 'Flashcards',
    description: 'Flip cards and rate yourself — Got it or Need practice.',
    iconClass: 'mode-icon-flashcards',
    ctaClass: 'mode-cta-flashcards',
  },
  test: {
    icon: '📝',
    title: 'Test',
    description: 'Exam-style run. See your score at the end.',
    iconClass: 'mode-icon-test',
    ctaClass: 'mode-cta-test',
  },
};

export default function StudyModeCard({ mode, topicId, cardCount, optionsQuery }) {
  const meta = MODES[mode];
  const to =
    mode === 'flashcards'
      ? `/flashcards/${topicId}?${optionsQuery}`
      : `/practice/${topicId}?${optionsQuery}&session=${mode}`;

  return (
    <Link to={to} className="block h-full">
      <Card hover className="study-mode-card h-full p-6">
        <div
          className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${meta.iconClass}`}
        >
          {meta.icon}
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-heading)]">{meta.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-muted)]">
          {meta.description}
        </p>
        <p className={`mt-4 text-xs font-medium ${meta.ctaClass}`}>
          ~{cardCount} card{cardCount !== 1 ? 's' : ''} · Start →
        </p>
      </Card>
    </Link>
  );
}
