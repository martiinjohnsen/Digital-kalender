/** The approved brand keeps its own colors in every calendar theme. */
export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <img
      className={`brand-logo ${className}`}
      src="/brand/luke-logo.webp"
      width={960}
      height={349}
      alt="Luke"
      draggable={false}
    />
  );
}
