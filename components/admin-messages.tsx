"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { adminRequest } from "@/lib/api-client";
type Message = { id: string; name: string; email: string; subject: string; message: string; status: string; created_at: string };
export function AdminMessages() {
  const [rows, setRows] = useState<Message[]>([]);
  const [state, setState] = useState("Consultando mensagens…");
  useEffect(() => {
    let active = true;
    createClient().from("contact_messages").select("*").order("created_at", { ascending: false }).limit(100).then(({ data, error }) => {
      if (active) { setRows(data || []); setState(error ? "Não foi possível consultar as mensagens." : `${data?.length || 0} mensagens.`); }
    });
    return () => { active = false; };
  }, []);
  async function update(id: string, status: string) {
    try { await adminRequest("message_status", { id, status }); setRows(rows.map(x => x.id === id ? { ...x, status } : x)); setState("Mensagem atualizada."); }
    catch (error) { setState(error instanceof Error ? error.message : "Não foi possível salvar."); }
  }
  return <><p className="status" role="status">{state}</p><div className="admin-list">{rows.map(m => <article key={m.id} className="window form-padding"><span className="chip">{m.status}</span><h2>{m.subject}</h2><p className="muted">{m.name} · {m.email} · {new Date(m.created_at).toLocaleDateString("pt-BR")}</p><p className="preserve-lines">{m.message}</p><div className="actions"><button className="button" onClick={() => update(m.id, "read")}>Marcar lida</button><button className="button" onClick={() => update(m.id, "resolved")}>Marcar resolvida</button></div></article>)}</div></>;
}
