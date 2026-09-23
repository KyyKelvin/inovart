import { AdminDashboard } from "@/components/admin-dashboard";

export const metadata = { title: "SolicitaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes" };

export default function Page() {
  return (
    <main id="conteudo">
      <section className="section admin-section">
        <div className="site-shell">
          <div className="section-head">
            <div>
              <p className="eyebrow">Backoffice 01 / triagem</p>
              <h1>SolicitaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes.</h1>
            </div>
            <p>
              Cada proposta passa por revisÃƒÆ’Ã‚Â£o antes de criar rascunhos de perfil e produtos no arquivo.
            </p>
          </div>
          <AdminDashboard />
        </div>
      </section>
    </main>
  );
}
