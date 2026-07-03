"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CART_STORAGE_KEY } from "@/lib/constants";
import { mergeCartShippingFlags } from "@/lib/shipping";
import type { CartItem } from "@/lib/types";

async function fetchProductShippingFlags(productIds: string[]) {
  if (!productIds.length) return {};

  const res = await fetch("/api/products/shipping", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productIds }),
  });

  if (!res.ok) return {};
  return (await res.json()) as Record<
    string,
    { use_shop_shipping: boolean; product_free_shipping: boolean }
  >;
}

async function syncCartShipping(items: CartItem[]) {
  const productIds = [...new Set(items.map((i) => i.productId))];
  const flags = await fetchProductShippingFlags(productIds);
  return mergeCartShippingFlags(items, flags);
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  stockIssues: CartItem[];
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCart() {
      try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        if (!stored) {
          setHydrated(true);
          return;
        }

        const parsed = JSON.parse(stored) as CartItem[];
        if (!parsed.length) {
          setItems([]);
          setHydrated(true);
          return;
        }

        const synced = await syncCartShipping(parsed);
        if (!cancelled) setItems(synced);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    loadCart();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.variantId === item.variantId);
        const qty = item.quantity ?? 1;
        if (existing) {
          const newQty = Math.min(
            existing.quantity + qty,
            item.stockQuantity
          );
          return prev.map((i) =>
            i.variantId === item.variantId
              ? {
                  ...i,
                  quantity: newQty,
                  useShopShipping: item.useShopShipping ?? true,
                  productFreeShipping: item.productFreeShipping ?? false,
                }
              : i
          );
        }
        return [...prev, { ...item, quantity: Math.min(qty, item.stockQuantity) }];
      });
    },
    []
  );

  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.variantId !== variantId) return i;
          const qty = Math.max(1, Math.min(quantity, i.stockQuantity));
          return { ...i, quantity: qty };
        })
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const stockIssues = useMemo(
    () =>
      items.filter(
        (i) => i.stockStatus === "out_of_stock" || i.quantity > i.stockQuantity
      ),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      stockIssues,
    }),
    [
      items,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      stockIssues,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
