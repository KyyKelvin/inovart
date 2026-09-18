import type { Metadata } from "next";
import { AdminLogin } from "@/components/admin-login";

export const metadata: Metadata = {
  title: "Acesso editorial",
  description: "Acesso seguro à área editorial da InovArt.",
};

export default function AdminLoginPage() {
  return (
    <main id="conteudo" className="admin-login-page grid-noise">
      <section className="site-shell admin-login-layout" aria-labelledby="admin-login-title">
        <div className="admin-login-copy">
          <p className="eyebrow">Área restrita / autenticação</p>
          <h1 id="admin-login-title">Arquivo<br /><em>editorial.</em></h1>
          <p>
            Curadoria, publicação e organização do acervo tecnoartesanal de Varginha em um ambiente reservado.
          </p>
          <div className="admin-login-stamp" aria-hidden="true">
            <span>INOVART / MG</span>
            <strong>ACESSO<br />CONTROLADO</strong>
          </div>
        </div>

        <div className="admin-login-entry">
          <p className="mono admin-login-coordinate">21°33&apos;S / 45°26&apos;W — NÓ EDITORIAL</p>
          <AdminLogin />
          <p className="admin-login-footnote">
            Tentativas com contas não autorizadas são encerradas antes do acesso ao painel.
          </p>
        </div>
      </section>
    </main>
  );
}
