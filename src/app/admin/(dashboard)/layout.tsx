import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminToastProvider } from "@/components/admin/AdminToastProvider";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminToastProvider>
      <div className="admin-shell">
        <AdminSidebar />
        <main className="admin-main">{children}</main>
      </div>
    </AdminToastProvider>
  );
}
