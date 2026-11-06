/** The approved brand keeps its own colors in every calendar theme. */
export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <img
      className={`brand-logo ${className}`}
      src="/icons/luke-192.png"
      width={192}
      height={192}
      alt="Luke"
      draggable={false}
    />
  );
}
