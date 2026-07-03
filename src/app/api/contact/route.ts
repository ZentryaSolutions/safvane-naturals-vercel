import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { CONTACT } from "@/lib/constants";
import { Resend } from "resend";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().optional(),
  subject: z.string().trim().optional(),
  message: z.string().trim().min(10, "Message must be at least 10 characters"),
});

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid form data" },
        { status: 400 }
      );
    }

    const { name, email, phone, subject, message } = parsed.data;

    const supabase = createServiceClient();
    const { data: settings } = await supabase
      .from("site_settings")
      .select("contact_email, notification_email")
      .eq("id", 1)
      .single();

    const toEmail =
      settings?.contact_email ??
      settings?.notification_email ??
      CONTACT.email;

    const emailSubject = subject
      ? `Contact: ${subject} — ${name}`
      : `Website contact from ${name}`;

    const text = `
New contact form message — Safvane Naturals

Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ""}
${subject ? `Subject: ${subject}` : ""}

Message:
${message}
    `.trim();

    if (resend) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "orders@safvane.com",
        to: toEmail,
        replyTo: email,
        subject: emailSubject,
        text,
      });
    } else {
      console.log("Contact form (no Resend API key):\n", text);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }
}
