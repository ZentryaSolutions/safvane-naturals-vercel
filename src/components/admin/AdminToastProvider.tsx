"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";

type ToastType = "success" | "error";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface AdminToastContextValue {
  showToast: (type: ToastType, message: string) => void;
}

const AdminToastContext = createContext<AdminToastContextValue | null>(null);

function AdminToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 4500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onDismiss]);

  return (
    <div
      className={`admin-toast admin-toast--${toast.type}`}
      role={toast.type === "error" ? "alert" : "status"}
    >
      <span className="admin-toast-icon" aria-hidden>
        {toast.type === "success" ? (
          <CheckCircle2 size={18} />
        ) : (
          <XCircle size={18} />
        )}
      </span>
      <span className="admin-toast-message">{toast.message}</span>
      <button
        type="button"
        className="admin-toast-close"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), type, message }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <AdminToastContext.Provider value={{ showToast }}>
      {children}
      <div className="admin-toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <AdminToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => dismiss(toast.id)}
          />
        ))}
      </div>
    </AdminToastContext.Provider>
  );
}

export function useAdminToast() {
  const ctx = useContext(AdminToastContext);
  if (!ctx) {
    throw new Error("useAdminToast must be used within AdminToastProvider");
  }
  return ctx;
}
