"use client";
import Link from "./safe-link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase";
const nav = [["/admin", "Submissões"], ["/admin/artesaos", "Artesãos"], ["/admin/trabalhos", "Trabalhos"], ["/admin/categorias", "Categorias"], ["/admin/mensagens", "Mensagens"]];
const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "kelvinky.augusto@gmail.com").trim().toLowerCase();
export function AdminGate({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [access, setAccess] = useState<"loading" | "admin" | "denied">("loading");
  useEffect(() => {
    const client = createClient();
    let active = true;
    const check = () => client.auth.getUser().then(({ data }) => {
      const user = data.user;
      const isAdmin = user?.app_metadata?.role === "admin" || user?.email?.toLowerCase() === ADMIN_EMAIL;
      if (active) setAccess(isAdmin ? "admin" : "denied");
    });
    void check();
    const { data: { subscription } } = client.auth.onAuthStateChange(() => { setTimeout(() => void check(), 0); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  if (path === "/admin/login") return children;
  if (access === "loading") return <main id="conteudo" className="section site-shell"><p role="status">Verificando acesso editorial…</p></main>;
  if (access === "denied") return <main id="conteudo" className="section site-shell"><p className="eyebrow">Acesso editorial</p><h1>Entre para continuar.</h1><p>Esta área está disponível apenas para a equipe autorizada.</p><Link className="button primary" href="/admin/login">Solicitar acesso →</Link></main>;
  return <><nav className="admin-nav site-shell" aria-label="Editorial">{nav.map(([href, name]) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>{name}</Link>)}<button onClick={async () => { await createClient().auth.signOut(); location.replace("/admin/login"); }}>Sair</button></nav>{children}</>;
}
