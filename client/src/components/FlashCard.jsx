import { useState } from 'react';
import DifficultyBadge from './DifficultyBadge';

export default function FlashCard({ question, answer, difficulty, onRate, showActions }) {
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => {
    if (!flipped) setFlipped(true);
  };

  const handleRate = (status) => {
    onRate(status);
    setFlipped(false);
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <div
        className="perspective-1000 group mb-8 h-72 cursor-pointer sm:h-80"
        onClick={handleFlip}
      >
        <div
          className="relative h-full w-full transform-style-3d transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.02]"
          style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          <div
            className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] p-8 shadow-[var(--shadow-lg)]"
            style={{ background: 'var(--card-face-q)' }}
          >
            <DifficultyBadge difficulty={difficulty} />
            <p className="mt-5 text-center text-xl font-medium leading-relaxed text-[var(--text-heading)] sm:text-2xl">
              {question}
            </p>
            <p className="mt-8 text-sm text-[var(--text-muted)]">Tap to reveal answer</p>
          </div>

          <div
            className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-[var(--accent)]/30 p-8 shadow-[var(--shadow-lg)]"
            style={{ transform: 'rotateY(180deg)', background: 'var(--card-face-a)' }}
          >
            <p className="text-center text-xl leading-relaxed text-[var(--text-heading)] sm:text-2xl">
              {answer}
            </p>
          </div>
        </div>
      </div>

      {showActions && flipped && (
        <div className="flex gap-4 animate-[fadeInUp_0.3s_ease]">
          <button
            type="button"
            onClick={() => handleRate('NEEDS_PRACTICE')}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger-bg)] px-4 py-3.5 font-semibold text-[var(--danger)] transition hover:bg-[var(--danger)] hover:text-white active:scale-[0.98]"
          >
            <span>✗</span> Need practice
          </button>
          <button
            type="button"
            onClick={() => handleRate('GOT_IT')}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--success)]/30 bg-[var(--success-bg)] px-4 py-3.5 font-semibold text-[var(--success)] transition hover:bg-[var(--success)] hover:text-white active:scale-[0.98]"
          >
            <span>✓</span> Got it
          </button>
        </div>
      )}
    </div>
  );
}
