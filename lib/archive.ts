import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "./supabase";

export type Category = { id: string; slug: string; name: string };
export type Artisan = {
  id: string; slug: string; name: string; craft: string; bio: string;
  neighborhood: string | null; quote: string | null; portrait_url: string | null;
  craft_category_id: string | null; region_withheld: boolean;
  status: string; featured: boolean;
  artisan_categories?: { categories: Category | null }[];
};
export type Work = {
  id: string; slug: string; title: string; description: string; materials: string[];
  cover_url: string | null; artisan_id: string; year: number | null; status: string;
  price_cents: number | null; shipping_details: string | null;
  artisans?: { name: string; slug: string } | null;
  work_categories?: { categories: Category | null }[];
};
function makeArchiveClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: "inovart-public-anon",
    },
  });
}
let archiveClient: ReturnType<typeof makeArchiveClient> | undefined;
export function publicClient() {
  archiveClient ??= makeArchiveClient();
  return archiveClient;
}
export async function loadArtisan(slug: string) {
  const client = publicClient();
  const { data, error } = await client.from("artisans").select("*,artisan_categories(categories(*))").eq("slug", slug).eq("status", "published").maybeSingle();
  if (error) throw new Error("O arquivo está temporariamente indisponível.");
  return data as Artisan | null;
}
export async function loadWork(slug: string) {
  const { data, error } = await publicClient().from("works").select("*,artisans(name,slug),work_categories(categories(*))").eq("slug", slug).eq("status", "published").maybeSingle();
  if (error) throw new Error("O arquivo está temporariamente indisponível.");
  return data as Work | null;
}
export function safeMediaUrl(value: string | null) {
  if (!value) return null;
  try { const url = new URL(value); return url.origin === SUPABASE_URL && url.pathname.startsWith("/storage/v1/object/public/public-media/") ? url.href : null; }
  catch { return null; }
}
