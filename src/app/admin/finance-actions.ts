"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ExpenseCategory } from "@/lib/types";

export async function saveExpense(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string | null;
  const productId = (formData.get("product_id") as string) || null;

  const data = {
    product_id: productId || null,
    title: (formData.get("title") as string).trim(),
    category: formData.get("category") as ExpenseCategory,
    amount: parseFloat(formData.get("amount") as string),
    expense_date: formData.get("expense_date") as string,
    notes: (formData.get("notes") as string)?.trim() || null,
  };

  if (!data.title || Number.isNaN(data.amount) || data.amount < 0) {
    return { error: "Title and a valid amount are required." };
  }

  if (id) {
    const { error } = await supabase.from("product_expenses").update(data).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("product_expenses").insert(data);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/expenses");
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("product_expenses").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/expenses");
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  return { success: true };
}
