export default function LandingFeatureCard({ title, text, image, alt, staggerClass = '' }) {
  return (
    <article
      className={`glass-card glass-card-hover overflow-hidden rounded-2xl ${staggerClass}`}
    >
      <img
        src={image}
        alt={alt}
        width={800}
        height={500}
        loading="lazy"
        className="aspect-[16/10] w-full object-cover"
      />
      <div className="p-5">
        <h2 className="font-semibold text-[var(--text-heading)]">{title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">{text}</p>
      </div>
    </article>
  );
}
