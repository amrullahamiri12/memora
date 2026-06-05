import { Link } from 'react-router-dom';

export default function LandingFeatureCard({
  title,
  text,
  image,
  alt,
  learnMoreTo,
  staggerClass = '',
}) {
  return (
    <article
      className={`glass-card glass-card-hover flex h-full flex-col overflow-hidden rounded-2xl ${staggerClass}`}
    >
      <div className="overflow-hidden">
        <img
          src={image}
          alt={alt}
          width={800}
          height={500}
          loading="lazy"
          className="aspect-[3/2] w-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col p-5 lg:p-6">
        <h2 className="text-base font-semibold text-[var(--text-heading)]">{title}</h2>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-muted)]">{text}</p>
        {learnMoreTo ? (
          <Link
            to={learnMoreTo}
            className="mt-4 inline-flex text-sm font-semibold text-[var(--accent)] hover:underline"
          >
            Learn more →
          </Link>
        ) : null}
      </div>
    </article>
  );
}
