import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();

  return (
    <div>
      <h1 className="admin-page-title">Settings</h1>
      <p className="admin-page-sub">Shipping, notifications, and contact information</p>
      <div className="admin-card" style={{ marginTop: 32, maxWidth: 560 }}>
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
