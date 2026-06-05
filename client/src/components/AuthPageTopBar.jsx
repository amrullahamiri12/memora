import ThemeToggle from './ThemeToggle';
import BackToHomeLink from './BackToHomeLink';

export default function AuthPageTopBar() {
  return (
    <>
      <div className="absolute left-6 top-6 z-10">
        <BackToHomeLink />
      </div>
      <div className="absolute right-6 top-6 z-10">
        <ThemeToggle />
      </div>
    </>
  );
}
