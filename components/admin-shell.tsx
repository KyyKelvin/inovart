"use client";

import Link from "./safe-link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase";

const nav = [
  ["/admin", "Visão geral"],
  ["/admin/submissoes", "Solicitações"],
  ["/admin/artesaos", "Artesãos"],
  ["/admin/trabalhos", "Produtos"],
  ["/admin/categorias", "Categorias"],
  ["/admin/mensagens", "Mensagens"],
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const signOut = async () => { await createClient().auth.signOut(); location.replace("/admin/login"); };
  return <div className={`admin-workspace${open ? " admin-workspace--open" : ""}`}>
    <button className="admin-scrim" type="button" aria-label="Fechar navegação" onClick={() => setOpen(false)} />
    <aside id="admin-sidebar" className="admin-sidebar" aria-label="Navegação editorial">
      <div className="admin-sidebar-head"><Link className="admin-brand" href="/admin" onClick={() => setOpen(false)}><b>Inov</b><i>Art</i><span>gestão editorial<br />arquivo vivo</span></Link><button className="admin-close" type="button" aria-label="Recolher navegação" onClick={() => setOpen(false)}>×</button></div>
      <p className="admin-sidebar-label">Gestão do catálogo</p>
      <nav className="admin-sidebar-nav">{nav.map(([href, label]) => <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} onClick={() => setOpen(false)}><span aria-hidden="true">{active(href) ? "■" : "□"}</span>{label}</Link>)}</nav>
      <div className="admin-sidebar-foot"><span className="admin-session"><i aria-hidden="true" /> sessão autenticada</span><button className="admin-logout" type="button" onClick={signOut}>Sair →</button></div>
    </aside>
    <div className="admin-main"><header className="admin-topbar"><button className="admin-menu" type="button" aria-expanded={open} aria-controls="admin-sidebar" onClick={() => setOpen(true)}>menu / abrir</button><div><p className="eyebrow">Arquivo tecnoartesanal / backoffice</p><p className="admin-route">{nav.find(([href]) => active(href))?.[1] || "Editorial"}</p></div><button className="admin-top-logout" type="button" onClick={signOut}>Encerrar sessão ↗</button></header>{children}</div>
  </div>;
}
