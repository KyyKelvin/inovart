"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
type Context = { registerTool: (tool: unknown, options: { signal: AbortSignal }) => void | Promise<void> };
export function WebMcp() {
  const router = useRouter();
  useEffect(() => {
    const context = (document as Document & { modelContext?: Context }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const registration = context.registerTool({
      name: "open_artisan_submission", title: "Abrir formulário de participação",
      description: "Abre o formulário InovArt. Não envia informações nem arquivos.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length)
          throw new Error("Este comando aceita apenas um objeto vazio.");
        router.push("/participar");
        return { route: "/participar", submitted: false };
      },
    }, { signal: lifecycle.signal });
    void Promise.resolve(registration).catch(() => {});
    return () => lifecycle.abort();
  }, [router]);
  return null;
}
