import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const LOGO = {
  light: '/memora-logo.png',
  dark: '/memora-logo-dark.png',
};

const LOGO_DIMS = {
  light: { width: 900, height: 666 },
  dark: { width: 900, height: 680 },
};

const VARIANTS = {
  nav: {
    className: 'h-11 w-auto max-w-[10.5rem] sm:h-12 sm:max-w-[11.75rem]',
    width: 900,
    height: 667,
  },
  hero: {
    className: 'h-auto w-[14rem] max-w-full sm:w-[15.5rem]',
    width: 900,
    height: 667,
  },
  auth: {
    className: 'h-auto w-[11rem] max-w-full sm:w-[12.5rem]',
    width: 900,
    height: 667,
  },
};

function logoMode(theme, variant) {
  if (variant === 'hero') return 'light';
  return theme === 'dark' ? 'dark' : 'light';
}

export default function Logo({ to, variant = 'nav', className = '' }) {
  const { theme } = useTheme();
  const mode = logoMode(theme, variant);
  const src = LOGO[mode];
  const config = VARIANTS[variant] || VARIANTS.nav;
  const dims = LOGO_DIMS[mode];

  const img = (
    <img
      src={src}
      alt="Memora"
      className={`logo-img block object-contain object-left ${config.className} ${className}`}
      width={dims.width}
      height={dims.height}
      decoding="async"
      fetchPriority={variant === 'hero' ? 'high' : 'auto'}
    />
  );

  const wrapClass =
    variant === 'auth'
      ? 'flex justify-center'
      : 'inline-flex items-center';

  if (to) {
    return (
      <Link
        to={to}
        className={`${wrapClass} shrink-0 transition opacity-95 hover:opacity-100`}
      >
        {img}
      </Link>
    );
  }

  return <span className={`${wrapClass} shrink-0`}>{img}</span>;
}
