import { SUPABASE_URL, SUPABASE_KEY } from "./supabase";
import { createLimitedBodyStream } from "./request-stream";
import { createStreamingRequest } from "./streaming-request";

const bodyLimits: Record<string, number> = {
  submission: 36 * 1024 * 1024,
  contact: 32 * 1024,
  editorial: 512 * 1024,
};

async function clientFingerprint(request: Request, secret: string) {
  const source = request.headers.get("cf-connecting-ip") || request.headers.get("oai-authenticated-user-id") || "unknown-client";
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${secret}:${source}`));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function forwardToBackend(request: Request, action: string) {
  const origin = request.headers.get("origin");
  const configuredOrigin = process.env.SITE_ORIGIN || new URL(request.url).origin;
  if (origin && origin !== configuredOrigin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Origem não permitida." }, { status: 403 });
  if (process.env.INOVART_BACKEND_READY !== "true" || !process.env.INOVART_PROXY_TOKEN)
    return Response.json({ error: "O recebimento de envios está em preparação. Seus dados ainda não foram enviados. Tente novamente após a abertura do arquivo." }, { status: 503 });
  const bodyLimit = bodyLimits[action] || 64 * 1024;
  if (Number(request.headers.get("content-length") || 0) > bodyLimit)
    return Response.json({ error: action === "submission" ? "O envio ultrapassa o limite total de 35 MB." : "A solicitação é maior do que o permitido." }, { status: 413 });
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY, "Content-Type": request.headers.get("content-type") || "application/json",
    "X-Inovart-Action": action,
    "X-Inovart-Token": process.env.INOVART_PROXY_TOKEN,
    "X-Inovart-Client-Hash": await clientFingerprint(request, process.env.INOVART_PROXY_TOKEN),
  };
  const auth = request.headers.get("authorization");
  if (auth) headers.Authorization = auth;
  const limited = createLimitedBodyStream(request.body, bodyLimit);
  const controller = new AbortController();
  const relayAbort = () => controller.abort(request.signal.reason);
  request.signal.addEventListener("abort", relayAbort, { once: true });
  const timeout = setTimeout(() => controller.abort(new Error("backend timeout")), action === "submission" ? 60000 : 15000);
  try {
    const result = await fetch(createStreamingRequest(`${SUPABASE_URL}/functions/v1/inovart-api`, {
      method: "POST", headers, body: limited.body, signal: controller.signal,
    }));
    const json = await result.json().catch(() => ({})) as Record<string, unknown> & { error?: string };
    return Response.json(result.ok ? json : { error: json.error || "O arquivo está temporariamente indisponível." }, { status: result.status });
  } catch {
    if (limited.exceeded())
      return Response.json({ error: "Envio muito grande." }, { status: 413 });
    return Response.json({ error: "Não foi possível conectar ao arquivo. Seu formulário foi preservado." }, { status: 503 });
  } finally {
    clearTimeout(timeout);
    request.signal.removeEventListener("abort", relayAbort);
  }
}
