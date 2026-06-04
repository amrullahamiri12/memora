import Logo from './Logo';

export default function AuthFormHeader({ title, subtitle }) {
  return (
    <div className="mb-8 flex flex-col items-center text-center sm:mb-10">
      <Logo to="/" variant="auth" />
      <h1 className="mt-8 text-3xl font-bold text-[var(--text-heading)]">{title}</h1>
      {subtitle && <p className="mt-2 max-w-sm text-[var(--text-muted)]">{subtitle}</p>}
    </div>
  );
}
