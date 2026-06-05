import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * On every route change, scroll to the top so each page starts at its heading
 * instead of inheriting the previous page's scroll position. Respects the
 * user's reduced-motion preference.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, left: 0, behavior: reduce ? 'auto' : 'smooth' });
  }, [pathname]);

  return null;
}
