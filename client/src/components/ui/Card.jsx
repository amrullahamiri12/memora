export default function Card({ children, className = '', hover = false, ...props }) {
  const hoverClass = hover ? 'glass-card-hover cursor-pointer' : '';
  return (
    <div className={`glass-card p-6 ${hoverClass} ${className}`} {...props}>
      {children}
    </div>
  );
}
