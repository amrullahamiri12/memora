import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { applyPageSeo } from '../utils/seo';

/** Updates document title, meta tags, and canonical URL per route. */
export default function SeoManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    applyPageSeo(pathname);
  }, [pathname]);

  return null;
}
