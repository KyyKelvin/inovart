"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase";
import { AdminShell } from "./admin-shell";
export function AdminGate({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [access, setAccess] = useState<"loading" | "admin" | "denied">("loading");
  useEffect(() => {
    const client = createClient();
    let active = true;
    const check = () => client.auth.getUser().then(({ data }) => {
      if (active) setAccess(data.user?.app_metadata?.role === "admin" ? "admin" : "denied");
    });
    void check();
    const { data: { subscription } } = client.auth.onAuthStateChange(() => { setTimeout(() => void check(), 0); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  if (path === "/admin/login") return children;
  if (access === "loading") return <main id="conteudo" className="section site-shell"><p role="status">Verificando acesso editorial…</p></main>;
  if (access === "denied") return <main id="conteudo" className="section site-shell"><p className="eyebrow">Acesso editorial</p><h1>Entre para continuar.</h1><p>Esta área está disponível apenas para a equipe autorizada.</p><a className="button primary" href="/admin/login">Solicitar acesso →</a></main>;
  return <AdminShell>{children}</AdminShell>;
}
