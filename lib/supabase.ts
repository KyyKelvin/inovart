import { createBrowserClient } from "@supabase/ssr";
const DEFAULT_SUPABASE_URL = "https://fpjxixijldymlkajenck.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_YROvzuprsRa7rjI4j7QPxQ_ZPIb48bg";
const nonEmpty = (...values: Array<string | undefined>) => values.find(value => value?.trim())?.trim();
export const SUPABASE_URL = nonEmpty(process.env.NEXT_PUBLIC_SUPABASE_URL) ?? DEFAULT_SUPABASE_URL;
export const SUPABASE_KEY = nonEmpty(
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
) ?? DEFAULT_SUPABASE_KEY;
function makeBrowserClient(){return createBrowserClient(SUPABASE_URL,SUPABASE_KEY)}
let browserClient: ReturnType<typeof makeBrowserClient> | undefined;
export function createClient(){
  browserClient ??= makeBrowserClient();
  return browserClient;
}
