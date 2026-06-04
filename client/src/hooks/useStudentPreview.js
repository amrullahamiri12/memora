import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  isStaffStudentPreview,
  isStudentViewActive,
  syncPreviewFromSearchParams,
} from '../utils/studentView';

export function useStudentPreview() {
  const [searchParams] = useSearchParams();
  const [preview, setPreview] = useState(() => isStaffStudentPreview(searchParams));

  useEffect(() => {
    setPreview(syncPreviewFromSearchParams(searchParams));
  }, [searchParams]);

  useEffect(() => {
    const sync = () => setPreview(isStudentViewActive());
    window.addEventListener('memora-student-view', sync);
    return () => window.removeEventListener('memora-student-view', sync);
  }, []);

  return preview;
}
