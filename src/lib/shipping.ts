import type { CartItem, SiteSettings } from "@/lib/types";

type ShippingSettings = Pick<
  SiteSettings,
  | "flat_shipping_fee"
  | "free_shipping_enabled"
  | "free_shipping_minimum"
  | "free_shipping_show_banner"
>;

type ShippingCartItem = Pick<CartItem, "useShopShipping" | "productFreeShipping">;

function shopFreeShippingApplies(
  subtotal: number,
  settings: Partial<ShippingSettings> | null | undefined
): boolean {
  const freeEnabled = settings?.free_shipping_enabled ?? false;
  const minimum = Number(settings?.free_shipping_minimum ?? 0);
  return freeEnabled && subtotal >= minimum;
}

export function calculateShippingFee(
  subtotal: number,
  settings: Partial<ShippingSettings> | null | undefined,
  items?: ShippingCartItem[]
): number {
  const flat = Number(settings?.flat_shipping_fee ?? 200);
  const shopFree = shopFreeShippingApplies(subtotal, settings);

  if (!items?.length) {
    return shopFree ? 0 : flat;
  }

  const anyItemNeedsPaidShipping = items.some((item) => {
    if (item.productFreeShipping) return false;

    if (item.useShopShipping !== false) {
      return !shopFree;
    }

    return true;
  });

  return anyItemNeedsPaidShipping ? flat : 0;
}

export function isFreeShipping(
  subtotal: number,
  settings: Partial<ShippingSettings> | null | undefined,
  items?: ShippingCartItem[]
): boolean {
  return calculateShippingFee(subtotal, settings, items) === 0;
}

export function freeShippingLabel(
  settings: Partial<ShippingSettings> | null | undefined
): string {
  const minimum = Number(settings?.free_shipping_minimum ?? 0);
  if (minimum > 0) {
    return `Free shipping on all orders over Rs. ${minimum.toLocaleString()}`;
  }
  return "Free shipping on all orders";
}

/** Amount still needed for shop-wide free shipping, or null if not applicable. */
export function freeShippingAmountNeeded(
  subtotal: number,
  settings: Partial<ShippingSettings> | null | undefined
): number | null {
  if (!settings?.free_shipping_enabled) return null;
  const minimum = Number(settings?.free_shipping_minimum ?? 0);
  if (minimum <= 0 || subtotal >= minimum) return null;
  return minimum - subtotal;
}

export function freeShippingBannerText(
  settings: Partial<ShippingSettings> | null | undefined
): string | null {
  if (!settings?.free_shipping_enabled) return null;
  if (settings.free_shipping_show_banner === false) return null;
  const minimum = Number(settings?.free_shipping_minimum ?? 0);
  if (minimum > 0) {
    return `Free shipping on all orders over ${minimum.toLocaleString()} PKR!`;
  }
  return "Free shipping on all orders!";
}

export function productShowsFreeShipping(
  product: {
    use_shop_shipping?: boolean;
    product_free_shipping?: boolean;
  },
  settings?: Partial<ShippingSettings> | null,
  referencePrice?: number
): boolean {
  if (product.product_free_shipping) return true;

  if (product.use_shop_shipping !== false && settings?.free_shipping_enabled) {
    const minimum = Number(settings?.free_shipping_minimum ?? 0);
    const amount = referencePrice ?? minimum;
    return amount >= minimum;
  }

  return false;
}

export function productHasActivePromo(product: {
  use_shop_promo: boolean;
  promo_enabled: boolean;
  promo_ends_at: string | null;
}): boolean {
  if (product.use_shop_promo) return false;
  if (!product.promo_enabled) return false;
  if (!product.promo_ends_at) return true;
  return new Date(product.promo_ends_at) > new Date();
}

export function shopPromoActive(settings: {
  promo_enabled?: boolean;
  promo_ends_at?: string | null;
} | null): boolean {
  if (!settings?.promo_enabled) return false;
  if (!settings.promo_ends_at) return true;
  return new Date(settings.promo_ends_at) > new Date();
}

export function mergeCartShippingFlags(
  items: CartItem[],
  productFlags: Record<
    string,
    { use_shop_shipping: boolean; product_free_shipping: boolean }
  >
): CartItem[] {
  return items.map((item) => {
    const flags = productFlags[item.productId];
    if (!flags) return item;
    return {
      ...item,
      useShopShipping: flags.use_shop_shipping,
      productFreeShipping: flags.product_free_shipping,
    };
  });
}
