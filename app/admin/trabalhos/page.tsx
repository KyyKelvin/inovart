import { AdminCollection } from "@/components/admin-collection";

export default function Page() {
  return (
    <main id="conteudo">
      <section className="section admin-section">
        <div className="site-shell">
          <div className="section-head">
            <h1>Produtos.</h1>
            <p>PeÃƒÆ’Ã‚Â§as vinculadas a artesÃƒÆ’Ã‚Â£os, com preÃƒÆ’Ã‚Â§o, envio e ciclo editorial.</p>
          </div>
          <AdminCollection table="works" title="produto" />
        </div>
      </section>
    </main>
  );
}
