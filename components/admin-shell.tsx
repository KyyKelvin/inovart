"use client";

import Link from "./safe-link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType, type ReactNode } from "react";
import {
  BriefcaseBusiness,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Tags,
  UserRound,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase";

type NavIcon = ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>;
const nav: readonly [string, string, NavIcon][] = [
  ["/admin", "Visão geral", LayoutDashboard],
  ["/admin/submissoes", "Solicitações", Inbox],
  ["/admin/artesaos", "Artesãos", UserRound],
  ["/admin/trabalhos", "Produtos", BriefcaseBusiness],
  ["/admin/categorias", "Categorias", Tags],
  ["/admin/mensagens", "Mensagens", MessageSquareText],
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) =>
    href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const signOut = async () => {
    await createClient().auth.signOut();
    location.replace("/admin/login");
  };

  return (
    <div className={`admin-workspace${open ? " admin-workspace--open" : ""}`}>
      <button
        className="admin-scrim"
        type="button"
        aria-label="Fechar navegação"
        onClick={() => setOpen(false)}
      />
      <aside id="admin-sidebar" className="admin-sidebar" aria-label="Navegação editorial">
        <div className="admin-sidebar-head">
          <Link className="admin-brand" href="/admin" onClick={() => setOpen(false)}>
            <b>Inov</b>
            <i>Art</i>
            <span>
              gestão editorial
              <br />
              arquivo vivo
            </span>
          </Link>
          <button
            className="admin-close"
            type="button"
            aria-label="Recolher navegação"
            onClick={() => setOpen(false)}
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>
        <p className="admin-sidebar-label">Gestão do catálogo</p>
        <nav className="admin-sidebar-nav">
          {nav.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              aria-current={active(href) ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <Icon size={16} strokeWidth={1.8} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <span className="admin-session">
            <i aria-hidden="true" /> sessão autenticada
          </span>
          <button className="admin-logout" type="button" onClick={signOut}>
            <LogOut size={14} aria-hidden="true" /> Sair
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-menu"
            type="button"
            aria-expanded={open}
            aria-controls="admin-sidebar"
            onClick={() => setOpen(true)}
          >
            <Menu size={16} aria-hidden="true" /> menu / abrir
          </button>
          <div>
            <p className="eyebrow">Arquivo tecnoartesanal / backoffice</p>
            <p className="admin-route">{nav.find(([href]) => active(href))?.[1] || "Editorial"}</p>
          </div>
          <button className="admin-top-logout" type="button" onClick={signOut}>
            <LogOut size={14} aria-hidden="true" /> Encerrar sessão
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
