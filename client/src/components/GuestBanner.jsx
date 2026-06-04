import { Link } from 'react-router-dom';
import Alert from './ui/Alert';

export default function GuestBanner() {
  return (
    <div className="mb-6">
      <Alert type="warning">
        You&apos;re browsing as a guest.{' '}
        <Link to="/account" className="font-semibold underline hover:no-underline">
          Create your account
        </Link>{' '}
        to save progress on any device.
      </Alert>
    </div>
  );
}
