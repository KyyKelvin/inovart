"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const links = [["/artesaos", "Artesãos"], ["/trabalhos", "Trabalhos"], ["/sobre", "Sobre"], ["/contato", "Contato"]];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const closeOutside = (event: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutside);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOutside);
    };
  }, [open]);

  return (
    <header className="nav" ref={headerRef}>
      <div className="site-shell nav-inner">
        <Link className="brand" href="/" aria-label="InovArt, início"><b>Inov</b><i>Art</i><span>arquivo vivo<br />Varginha · MG</span></Link>
        <button className="menu" type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="main-navigation">menu / {open ? "fechar" : "abrir"}</button>
        <nav id="main-navigation" className={open ? "open" : ""} aria-label="Principal">
          {links.map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined} onClick={() => setOpen(false)}>{label}</Link>)}
          <Link className="nav-cta" href="/participar" aria-current={pathname === "/participar" ? "page" : undefined} onClick={() => setOpen(false)}>Quero participar ↗</Link>
        </nav>
      </div>
    </header>
  );
}
