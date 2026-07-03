import Link from "next/link";

interface BrandLogoProps {
  href?: string;
  variant?: "default" | "footer" | "admin";
  className?: string;
  /** Use on light backgrounds (e.g. admin sidebar) */
  onLight?: boolean;
}

function Wordmark() {
  return (
    <div className="brand-wordmark">
      <span className="brand-name-primary">SAFVANE</span>
      <span className="brand-name-sub">
        <span className="brand-line" aria-hidden />
        NATURALS
        <span className="brand-line" aria-hidden />
      </span>
    </div>
  );
}

export function BrandLogo({
  href = "/",
  variant = "default",
  className = "",
  onLight = false,
}: BrandLogoProps) {
  const rootClass = [
    "brand-logo",
    `brand-logo--${variant}`,
    onLight ? "brand-logo--on-light" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (!href) {
    return (
      <div className={rootClass}>
        <Wordmark />
      </div>
    );
  }

  return (
    <Link href={href} className={rootClass}>
      <Wordmark />
    </Link>
  );
}
