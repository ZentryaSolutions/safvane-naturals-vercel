import { z } from "zod";

export const checkoutSchema = z.object({
  customer_name: z.string().min(2, "Name is required"),
  customer_phone: z
    .string()
    .min(10, "Valid phone number required")
    .refine(
      (val) => {
        const cleaned = val.replace(/[\s\-()]/g, "");
        return /^(03\d{9}|\+923\d{9}|923\d{9}|0\d{10})$/.test(cleaned);
      },
      { message: "Enter a valid Pakistani phone number" }
    ),
  customer_email: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
  delivery_address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  order_note: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password required"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
