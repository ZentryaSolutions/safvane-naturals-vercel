interface FreeShippingBadgeProps {
  variant?: "card" | "pdp" | "cart" | "inline";
  className?: string;
}

export function FreeShippingBadge({
  variant = "card",
  className = "",
}: FreeShippingBadgeProps) {
  return (
    <span
      className={`free-ship-badge free-ship-badge--${variant} ${className}`.trim()}
    >
      Free Shipping
    </span>
  );
}
