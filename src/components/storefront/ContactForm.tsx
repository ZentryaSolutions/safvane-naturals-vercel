"use client";

import { useState } from "react";
import { CONTACT } from "@/lib/constants";

interface ContactFormProps {
  defaultEmail?: string;
}

export function ContactForm({ defaultEmail = CONTACT.email }: ContactFormProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const update = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (status !== "idle") setStatus("idle");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setStatus("idle");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch {
      setStatus("error");
      setErrorMsg("Could not send your message. Please email us directly.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="form-pair">
        <div className="fg">
          <label htmlFor="contact-name">Full name *</label>
          <input
            id="contact-name"
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Your name"
          />
        </div>
        <div className="fg">
          <label htmlFor="contact-phone">Phone / WhatsApp</label>
          <input
            id="contact-phone"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+92 3XX XXXXXXX"
          />
        </div>
      </div>

      <div className="form-pair">
        <div className="fg">
          <label htmlFor="contact-email">Email *</label>
          <input
            id="contact-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="fg">
          <label htmlFor="contact-subject">Subject</label>
          <input
            id="contact-subject"
            value={form.subject}
            onChange={(e) => update("subject", e.target.value)}
            placeholder="Order, product question, etc."
          />
        </div>
      </div>

      <div className="fg full">
        <label htmlFor="contact-message">Message *</label>
        <textarea
          id="contact-message"
          required
          rows={6}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="How can we help you?"
        />
      </div>

      {status === "success" && (
        <div className="contact-form-alert contact-form-alert--success" role="status">
          Thank you — your message has been sent. We&apos;ll reply within 24 hours.
        </div>
      )}
      {status === "error" && (
        <div className="contact-form-alert contact-form-alert--error" role="alert">
          {errorMsg}{" "}
          <a href={`mailto:${defaultEmail}`}>Email {defaultEmail}</a>
        </div>
      )}

      <button type="submit" className="btn contact-form-submit" disabled={sending}>
        <span>{sending ? "Sending..." : "Send Message"}</span>
      </button>
    </form>
  );
}
