export default function CategoryDot({ color, className = '' }) {
  return <span aria-hidden className={`inline-block h-2 w-2 shrink-0 rounded-full ${className}`} style={{ background: color }} />
}
