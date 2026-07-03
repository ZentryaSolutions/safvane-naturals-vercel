"use client";

import { useCart } from "@/context/CartContext";

export function CartBadge() {
  const { itemCount } = useCart();

  if (itemCount === 0) return null;

  return <div className="c-badge">{itemCount > 99 ? "99+" : itemCount}</div>;
}
