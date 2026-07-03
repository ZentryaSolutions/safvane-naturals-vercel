import { createClient } from "@/lib/supabase/server";
import { ContentEditor } from "@/components/admin/ContentEditor";

export default async function AdminContentPage() {
  const supabase = await createClient();
  const { data: pages } = await supabase.from("content_pages").select("*");

  const about = pages?.find((p) => p.page_key === "about");
  const faq = pages?.find((p) => p.page_key === "faq");

  return (
    <div>
      <h1 className="admin-page-title">Content</h1>
      <p className="admin-page-sub">Edit About and FAQ pages</p>

      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 32 }}>
        {about && <ContentEditor page={about} label="About Page" />}
        {faq && <ContentEditor page={faq} label="FAQ Page" />}
      </div>
    </div>
  );
}
