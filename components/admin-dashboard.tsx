"use client";
import Link from "./safe-link";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
const labels: Record<string, string> = { pending: "Recebida", under_review: "Em revisão", approved: "Aprovada", rejected: "Recusada" };
type Submission = { id: string; name: string; craft: string; status: string; created_at: string };
export function AdminDashboard() {
  const [rows, setRows] = useState<Submission[]>([]);
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("Consultando fila editorial…");
  const load = useCallback(async () => {
    let query = createClient().from("artisan_submissions").select("id,name,craft,status,created_at").order("created_at", { ascending: false }).limit(100);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    setRows(data || []); setMessage(error ? "Não foi possível consultar as submissões." : `${data?.length || 0} submissões.`);
  }, [status]);
  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);
  return <div><div className="field filter-field"><label htmlFor="queue-status">Status</label><select id="queue-status" value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><p className="status" role="status">{message}</p><div className="admin-list">{rows.map(row => <Link className="window admin-row" href={`/admin/submissoes/${row.id}`} key={row.id}><div><span className="chip">{labels[row.status]}</span><h2>{row.name}</h2><p>{row.craft}</p></div><div><time>{new Date(row.created_at).toLocaleDateString("pt-BR")}</time><span className="row-arrow">Abrir material ↗</span></div></Link>)}</div>{!rows.length && <p className="muted">As novas propostas aparecerão aqui para leitura e decisão editorial.</p>}</div>;
}
