"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import Link from "./safe-link";

function moveFooterReveal(event: ReactPointerEvent<HTMLAnchorElement>) {
  const { offsetX, offsetY } = event.nativeEvent;

  event.currentTarget.style.setProperty("--footer-pointer-x", `${offsetX}px`);
  event.currentTarget.style.setProperty("--footer-pointer-y", `${offsetY}px`);
}

export function Footer() {
  return (
    <footer className="footer archive-footer">
      <div className="site-shell footer-shell">
        <div className="footer-grid">
          <div className="footer-intro">
            <p className="eyebrow">Arquivo tecnoartesanal</p>
            <p>Histórias, técnicas e matérias do fazer artesanal em Varginha.</p>
          </div>

          <nav aria-label="Arquivo no rodapé">
            <h2>Arquivo</h2>
            <ul className="footer-links">
              <li><Link href="/artesaos">Artesãos</Link></li>
              <li><Link href="/trabalhos">Trabalhos</Link></li>
              <li><Link href="/sobre">Sobre</Link></li>
            </ul>
          </nav>

          <nav aria-label="Participação no rodapé">
            <h2>Participação</h2>
            <ul className="footer-links">
              <li><Link href="/participar">Enviar trabalho</Link></li>
              <li><Link href="/contato">Contato</Link></li>
              <li><Link href="/admin/login">Área editorial</Link></li>
            </ul>
          </nav>

          <div className="footer-place">
            <h2>Território</h2>
            <p>Varginha · Minas Gerais</p>
            <span className="mono">21°33′S · 45°26′W</span>
          </div>
        </div>

        <Link
          className="footer-title display"
          href="/"
          aria-label="Voltar ao início"
          data-text="INOVART"
          onPointerMove={moveFooterReveal}
        >
          INOVART
        </Link>

        <div className="footer-bottom mono">
          <span>© 2026 InovArt</span>
          <span>Arquivo vivo · publicação com cuidado</span>
        </div>
      </div>
    </footer>
  );
}
