import { Link } from 'react-router-dom';

/** Subject › topic › mode context for study sessions. */
export default function StudyContextHeader({
  subjectId,
  subjectName,
  topicName,
  modeLabel,
  hint,
  className = '',
}) {
  if (!topicName && !subjectName) return null;

  const segmentClass = 'font-medium text-[var(--text-heading)]';
  const separator = (
    <span className="mx-1.5 text-[var(--text-muted)]" aria-hidden>
      ›
    </span>
  );

  return (
    <div className={className}>
      <p className="text-sm text-[var(--text-muted)]">
        {subjectName && subjectId ? (
          <>
            <Link
              to={`/subjects/${subjectId}`}
              className={`${segmentClass} text-[var(--accent)] hover:underline`}
            >
              {subjectName}
            </Link>
            {topicName && (
              <>
                {separator}
                <span className={segmentClass}>{topicName}</span>
              </>
            )}
          </>
        ) : (
          topicName && <span className={segmentClass}>{topicName}</span>
        )}
        {modeLabel && (
          <>
            {separator}
            <span className={segmentClass}>{modeLabel}</span>
          </>
        )}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>
      )}
    </div>
  );
}
