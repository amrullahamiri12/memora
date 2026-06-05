import { Link } from 'react-router-dom';
import { useState } from 'react';
import Alert from './ui/Alert';
import Button from './ui/Button';
import Card from './ui/Card';

export const GUEST_NUDGE_DISMISS_KEY = 'memora_guest_nudge_dismissed';

export function isGuestNudgeDismissed() {
  try {
    return sessionStorage.getItem(GUEST_NUDGE_DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissGuestNudge() {
  try {
    sessionStorage.setItem(GUEST_NUDGE_DISMISS_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function clearGuestNudgeDismiss() {
  try {
    sessionStorage.removeItem(GUEST_NUDGE_DISMISS_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Remind guest users to register — Khan Academy-style save-progress prompts.
 * @param {'banner' | 'compact' | 'sessionComplete'} variant
 */
export default function GuestSaveProgressNudge({
  variant = 'banner',
  className = '',
  dismissible = false,
}) {
  const [dismissed, setDismissed] = useState(isGuestNudgeDismissed);

  if (dismissible && dismissed) return null;

  const handleDismiss = () => {
    dismissGuestNudge();
    setDismissed(true);
  };

  if (variant === 'sessionComplete') {
    return (
      <Card
        className={`mb-6 border-[var(--accent)]/25 bg-[var(--accent-glow)]/40 p-5 text-left sm:p-6 ${className}`}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
          Keep what you learned
        </p>
        <h2 className="mt-1 font-display text-lg font-semibold text-[var(--text-heading)]">
          Save your progress with a free account
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
          Your session is saved on this device only. Register in under a minute to keep scores,
          streaks, and enrolled subjects if you switch browsers or come back later.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link to="/account" className="sm:flex-1">
            <Button className="w-full">Create free account</Button>
          </Link>
          <Link to="/dashboard" className="sm:flex-1">
            <Button variant="secondary" className="w-full">
              Maybe later
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={`mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--warning)]/20 bg-[var(--warning-bg)] px-3.5 py-2.5 text-sm ${className}`}
        role="status"
      >
        <p className="text-[var(--text)]">
          <span className="font-medium text-[var(--warning)]">Guest session</span>
          <span className="text-[var(--text-muted)]"> — progress stays on this device only.</span>
        </p>
        <div className="flex items-center gap-3">
          <Link
            to="/account"
            className="shrink-0 font-semibold text-[var(--accent)] hover:underline"
          >
            Save progress →
          </Link>
          {dismissible && (
            <button
              type="button"
              onClick={handleDismiss}
              className="shrink-0 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
              aria-label="Dismiss reminder"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Alert type="warning">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p>
            You&apos;re studying as a guest. Progress is saved on this device only —{' '}
            <Link to="/account" className="font-semibold underline hover:no-underline">
              create a free account
            </Link>{' '}
            to keep your work on any device.
          </p>
          {dismissible && (
            <button
              type="button"
              onClick={handleDismiss}
              className="shrink-0 text-xs font-medium opacity-80 hover:opacity-100"
            >
              Dismiss
            </button>
          )}
        </div>
      </Alert>
    </div>
  );
}
