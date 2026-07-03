"use client";

import { useEffect, useState } from "react";
import { mergeCartShippingFlags } from "@/lib/shipping";
import type { CartItem } from "@/lib/types";

export function useSyncedCartShipping(items: CartItem[]) {
  const [syncedItems, setSyncedItems] = useState(items);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      if (!items.length) {
        setSyncedItems([]);
        return;
      }

      try {
        const productIds = [...new Set(items.map((i) => i.productId))];
        const res = await fetch("/api/products/shipping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productIds }),
        });

        if (!res.ok) {
          setSyncedItems(items);
          return;
        }

        const flags = (await res.json()) as Record<
          string,
          { use_shop_shipping: boolean; product_free_shipping: boolean }
        >;

        if (!cancelled) {
          setSyncedItems(mergeCartShippingFlags(items, flags));
        }
      } catch {
        if (!cancelled) setSyncedItems(items);
      }
    }

    sync();
    return () => {
      cancelled = true;
    };
  }, [items]);

  return syncedItems;
}
