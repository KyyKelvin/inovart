"use client";

import Link from "./safe-link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type Counts = { submissions: number; artisans: number; works: number; featured: number };
const empty: Counts = { submissions: 0, artisans: 0, works: 0, featured: 0 };

export function AdminOverview() {
  const [counts, setCounts] = useState<Counts>(empty);
  const [state, setState] = useState("Consultando o arquivo editorial…");
  useEffect(() => {
    let active = true;
    const client = createClient();
    Promise.all([
      client.from("artisan_submissions").select("id", { count: "exact", head: true }).in("status", ["received", "under_review"]),
      client.from("artisans").select("id", { count: "exact", head: true }).neq("status", "archived"),
      client.from("works").select("id", { count: "exact", head: true }).neq("status", "archived"),
      client.from("works").select("id", { count: "exact", head: true }).eq("featured", true).neq("status", "archived"),
    ]).then(([submissions, artisans, works, featured]) => {
      if (!active) return;
      setCounts({ submissions: submissions.count || 0, artisans: artisans.count || 0, works: works.count || 0, featured: featured.count || 0 });
      setState([submissions, artisans, works, featured].some(result => result.error) ? "Alguns indicadores não puderam ser consultados." : "Arquivo sincronizado.");
    });
    return () => { active = false; };
  }, []);
  return <div className="admin-overview">
    <div className="admin-priority window"><div><p className="eyebrow">Prioridade do dia</p><h2>{counts.submissions ? "A fila pede curadoria." : "A fila de curadoria está em dia."}</h2><p>{counts.submissions ? `${counts.submissions} solicitação(ões) aguardam atenção editorial.` : "Nenhuma submissão recebida ou em revisão neste momento."}</p></div><Link className="button primary" href="/admin/submissoes">Abrir solicitações →</Link></div>
    <div className="admin-stat-grid">{[["Solicitações", counts.submissions], ["Artesãos", counts.artisans], ["Produtos", counts.works], ["Destaques", counts.featured]].map(([label, value]) => <div className="admin-stat window" key={String(label)}><span className="eyebrow">{label}</span><strong>{value}</strong></div>)}</div>
    <p className="status" role="status">{state}</p>
    <div className="admin-overview-links"><Link className="window" href="/admin/artesaos"><span className="eyebrow">Catálogo</span><strong>Gerenciar artesãos →</strong></Link><Link className="window" href="/admin/trabalhos"><span className="eyebrow">Catálogo</span><strong>Gerenciar produtos →</strong></Link><Link className="window" href="/admin/mensagens"><span className="eyebrow">Entrada</span><strong>Ver mensagens →</strong></Link></div>
  </div>;
}
