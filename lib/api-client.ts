import { createClient } from "./supabase";
type ApiPayload = Record<string, unknown> & { error?: string };

export async function apiRequest<T extends ApiPayload = ApiPayload>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({})) as T;
  if (!response.ok) throw new Error(result.error || "Não foi possível concluir. Tente novamente.");
  return result;
}
export async function adminRequest<T extends ApiPayload = ApiPayload>(action: string, data: Record<string, unknown>): Promise<T> {
  const { data: { session } } = await createClient().auth.getSession();
  if (!session) throw new Error("Sua sessão expirou. Entre novamente.");
  // The server independently validates the token with getUser().
  const response = await fetch("/api/editorial", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ action, ...data }),
  });
  const result = await response.json().catch(() => ({})) as T;
  if (!response.ok) throw new Error(result.error || "A operação editorial não pôde ser concluída.");
  return result;
}
