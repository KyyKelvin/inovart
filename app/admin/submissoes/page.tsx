import { AdminDashboard } from "@/components/admin-dashboard";

export const metadata = { title: "Solicitações" };

export default function Page() {
  return (
    <main id="conteudo">
      <section className="section admin-section">
        <div className="site-shell">
          <div className="section-head">
            <div>
              <p className="eyebrow">Backoffice 01 / triagem</p>
              <h1>Solicitações.</h1>
            </div>
            <p>
              Cada proposta passa por revisão antes de criar rascunhos de perfil e produtos no arquivo.
            </p>
          </div>
          <AdminDashboard />
        </div>
      </section>
    </main>
  );
}
