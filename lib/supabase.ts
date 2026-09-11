import { createBrowserClient } from "@supabase/ssr";
export const SUPABASE_URL=process.env.NEXT_PUBLIC_SUPABASE_URL??"https://fpjxixijldymlkajenck.supabase.co";
export const SUPABASE_KEY=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??"sb_publishable_YROvzuprsRa7rjI4j7QPxQ_ZPIb48bg";
function makeBrowserClient(){return createBrowserClient(SUPABASE_URL,SUPABASE_KEY)}
let browserClient: ReturnType<typeof makeBrowserClient> | undefined;
export function createClient(){
  browserClient ??= makeBrowserClient();
  return browserClient;
}
