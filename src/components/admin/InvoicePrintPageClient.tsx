"use client";

import { useEffect, useState } from "react";
import type { Order, OrderItem } from "@/lib/types";
import { OrderInvoice } from "@/components/admin/OrderInvoice";
import { printInvoiceElement } from "@/lib/invoice-pdf";

interface InvoicePrintPageClientProps {
  order: Order & { items: OrderItem[] };
}

export function InvoicePrintPageClient({ order }: InvoicePrintPageClientProps) {
  const [status, setStatus] = useState<"preparing" | "ready" | "error">("preparing");
  const [message, setMessage] = useState("Preparing invoice PDF…");

  useEffect(() => {
    document.title = `${order.order_number} — Invoice`;

    const timer = window.setTimeout(async () => {
      const el = document.getElementById("order-invoice");
      if (!el) {
        setStatus("error");
        setMessage("Invoice could not be loaded.");
        return;
      }

      const result = await printInvoiceElement(el, order.order_number);
      if (result.error) {
        setStatus("error");
        setMessage(result.error);
        return;
      }

      setStatus("ready");
      setMessage("Invoice opened for printing. You can close this tab.");
      window.setTimeout(() => window.close(), 1500);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [order.order_number]);

  return (
    <>
      <p
        className={`admin-print-hint no-print${status === "error" ? " admin-print-hint-error" : ""}`}
      >
        {message}
      </p>
      <div className="order-invoice-print-page">
        <OrderInvoice order={order} />
      </div>
    </>
  );
}
