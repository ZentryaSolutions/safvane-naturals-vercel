"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  MessageSquare,
  Settings,
  Wallet,
  BarChart3,
} from "lucide-react";
import { AdminLogoutButton } from "./AdminLogoutButton";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/expenses", label: "Expenses", icon: Wallet },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-head">
        <BrandLogo
          href="/admin"
          variant="admin"
          className="admin-sidebar-logo"
        />
        <p>Store management</p>
      </div>
      <nav className="admin-nav">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={isActive(link.href, link.exact) ? "active" : ""}
          >
            <link.icon size={18} />
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="admin-sidebar-foot">
        <Link href="/">← View storefront</Link>
        <AdminLogoutButton />
      </div>
    </aside>
  );
}
