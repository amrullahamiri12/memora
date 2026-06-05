import { Link } from 'react-router-dom';

/** Subject › topic context for study sessions (learn, flashcards, test). */
export default function StudyContextHeader({
  subjectId,
  subjectName,
  topicName,
  modeLabel,
  className = '',
}) {
  if (!topicName && !subjectName) return null;

  return (
    <div className={className}>
      <p className="text-sm text-[var(--text-muted)]">
        {subjectName && subjectId ? (
          <>
            <Link
              to={`/subjects/${subjectId}`}
              className="font-medium text-[var(--accent)] hover:underline"
            >
              {subjectName}
            </Link>
            {topicName && (
              <>
                <span className="mx-1.5" aria-hidden>
                  ›
                </span>
                <span className="font-semibold text-[var(--text-heading)]">{topicName}</span>
              </>
            )}
          </>
        ) : (
          topicName && (
            <span className="font-semibold text-[var(--text-heading)]">{topicName}</span>
          )
        )}
      </p>
      {modeLabel && <p className="mt-0.5 text-sm text-[var(--text-muted)]">{modeLabel}</p>}
    </div>
  );
}
