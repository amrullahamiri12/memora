import GuestSaveProgressNudge from './GuestSaveProgressNudge';

/** Dashboard / setup banner — delegates to shared nudge component. */
export default function GuestBanner({ className = '' }) {
  return <GuestSaveProgressNudge variant="banner" className={`mb-6 ${className}`.trim()} />;
}
