"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function submitProductReview(formData: FormData) {
  const productId = formData.get("product_id") as string;
  const productSlug = formData.get("product_slug") as string;
  const customerName = (formData.get("customer_name") as string)?.trim();
  const customerCity = (formData.get("customer_city") as string)?.trim() || null;
  const customerEmail = (formData.get("customer_email") as string)?.trim() || null;
  const reviewTitle = (formData.get("review_title") as string)?.trim() || null;
  const rating = Number(formData.get("rating"));
  const reviewText = (formData.get("review_text") as string)?.trim();
  const imageFiles = formData
    .getAll("images")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (!productId || !customerName || !reviewText) {
    return { error: "Please fill in all required fields." };
  }

  if (customerName.length < 2 || customerName.length > 80) {
    return { error: "Name must be between 2 and 80 characters." };
  }

  if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return { error: "Please enter a valid email address." };
  }

  if (reviewTitle && reviewTitle.length > 120) {
    return { error: "Review title is too long." };
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Please select a star rating." };
  }

  if (reviewText.length < 10 || reviewText.length > 2000) {
    return { error: "Review must be between 10 and 2000 characters." };
  }

  if (imageFiles.length > MAX_IMAGES) {
    return { error: `You can upload up to ${MAX_IMAGES} images.` };
  }

  for (const file of imageFiles) {
    if (!file.type.startsWith("image/")) {
      return { error: "Only image files are allowed." };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { error: "Each image must be under 5 MB." };
    }
  }

  const supabase = createServiceClient();

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("status", "active")
    .maybeSingle();

  if (productError || !product) {
    console.error("submitProductReview product:", productError?.message);
    return { error: "This product is not available for reviews right now." };
  }

  const { data: review, error } = await supabase
    .from("product_reviews")
    .insert({
      product_id: productId,
      customer_name: customerName,
      customer_city: customerCity,
      customer_email: customerEmail,
      review_title: reviewTitle,
      rating,
      review_text: reviewText,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !review) {
    console.error("submitProductReview:", error?.message);
    if (error?.message?.includes("product_reviews")) {
      return {
        error:
          "Reviews are not set up yet. Please contact support or try again later.",
      };
    }
    return {
      error: "Could not submit your review. Please try again in a moment.",
    };
  }

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${review.id}/${Date.now()}-${i}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("review-images")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("review image upload:", uploadError.message);
      continue;
    }

    const { data: urlData } = supabase.storage
      .from("review-images")
      .getPublicUrl(path);

    await supabase.from("product_review_images").insert({
      review_id: review.id,
      image_url: urlData.publicUrl,
      sort_order: i,
    });
  }

  if (productSlug) {
    revalidatePath(`/products/${productSlug}`);
  }

  return {
    success: true,
    message:
      "Thank you! Your review has been submitted and will appear after our team approves it.",
  };
}
