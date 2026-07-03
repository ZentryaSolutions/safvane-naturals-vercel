export type ProductStatus = "active" | "draft" | "hidden";
export type StockStatus = "in_stock" | "out_of_stock";
export type OrderStatus =
  | "new"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";
export type ContentPageKey = "about" | "faq";
export type BlogPostStatus = "published" | "draft";
export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string | null;
  ingredients: string | null;
  how_to_use: string | null;
  delivery_returns: string | null;
  benefits: string[];
  category_id: string;
  status: ProductStatus;
  featured: boolean;
  meta_title: string | null;
  meta_description: string | null;
  use_shop_shipping: boolean;
  product_free_shipping: boolean;
  use_shop_promo: boolean;
  promo_enabled: boolean;
  promo_headline: string | null;
  promo_message: string | null;
  promo_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_label: string;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  stock_status: StockStatus;
  sku: string | null;
}

export interface ProductBatch {
  id: string;
  product_id: string;
  variant_id: string | null;
  batch_number: string;
  manufactured_at: string;
  expires_at: string;
  quantity: number;
  notes: string | null;
  status: "active" | "depleted" | "recalled";
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  alt_text: string | null;
}

export interface ProductWithDetails extends Product {
  category: Category | null;
  variants: ProductVariant[];
  images: ProductImage[];
}

export interface ProductReview {
  id: string;
  product_id: string;
  customer_name: string;
  customer_city: string | null;
  customer_email: string | null;
  review_title: string | null;
  rating: number;
  review_text: string;
  status: ReviewStatus;
  featured_on_homepage?: boolean;
  created_at: string;
  images?: ProductReviewImage[];
}

export interface ProductReviewImage {
  id: string;
  review_id: string;
  image_url: string;
  sort_order: number;
}

export interface ProductReviewSummary {
  averageRating: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string;
  city: string;
  order_note: string | null;
  status: OrderStatus;
  subtotal: number;
  shipping_fee: number;
  total: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_variant_id: string;
  product_name_snapshot: string;
  variant_label_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface ContentPage {
  id: string;
  page_key: ContentPageKey;
  content: string;
  updated_at: string;
}

export interface SiteSettings {
  id: number;
  flat_shipping_fee: number;
  free_shipping_enabled: boolean;
  free_shipping_minimum: number;
  free_shipping_show_banner: boolean;
  promo_enabled: boolean;
  promo_headline: string | null;
  promo_message: string | null;
  promo_ends_at: string | null;
  notification_email: string | null;
  notification_whatsapp_number: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_address: string | null;
}

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  variantLabel: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  stockQuantity: number;
  stockStatus: StockStatus;
  slug: string;
  useShopShipping?: boolean;
  productFreeShipping?: boolean;
}

export interface CheckoutFormData {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_address: string;
  city: string;
  order_note?: string;
}

export type ExpenseCategory =
  | "raw_materials"
  | "packaging"
  | "shipping"
  | "marketing"
  | "labour"
  | "other";

export interface ProductExpense {
  id: string;
  product_id: string | null;
  title: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  notes: string | null;
  created_at: string;
  product?: { name: string; slug: string } | null;
}

export interface InventoryRestockLog {
  id: string;
  variant_id: string;
  product_id: string;
  quantity_added: number;
  previous_quantity: number;
  new_quantity: number;
  cost_per_unit: number | null;
  notes: string | null;
  created_at: string;
  variant?: { variant_label: string; sku: string | null } | null;
  product?: { name: string; slug: string } | null;
}
