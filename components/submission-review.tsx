/* eslint-disable @next/next/no-img-element */
"use client";
import Link from "./safe-link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { adminRequest } from "@/lib/api-client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
type Entry = { id: string; name: string; craft: string; bio: string; email: string; phone: string; instagram: string; portrait_path: string | null; reviewer_notes: string | null; status: string; submission_works: { id: string; title: string; description: string; materials: string[]; image_paths: string[] }[] };
export function SubmissionReview({ id }: { id: string }) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [images, setImages] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("Abrindo proposta…");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [pendingDecision, setPendingDecision] = useState<"approved" | "rejected" | null>(null);
  useEffect(() => {
    let active = true;
    const client = createClient();
    client.from("artisan_submissions").select("*,submission_works(*)").eq("id", id).maybeSingle().then(async ({ data, error }) => {
      if (!active) return;
      if (error || !data) { setMessage("Submissão não encontrada ou acesso indisponível."); return; }
      const item = data as Entry; setEntry(item); setNotes(item.reviewer_notes || ""); setMessage("");
      const paths = [item.portrait_path, ...item.submission_works.flatMap(w => w.image_paths)].filter((x): x is string => Boolean(x));
      if (paths.length) {
        const { data: signed } = await client.storage.from("submission-media").createSignedUrls(paths, 600);
        if (active) setImages(Object.fromEntries((signed || []).filter(x => x.signedUrl).map(x => [x.path!, x.signedUrl!] as const)));
      }
    });
    return () => { active = false; };
  }, [id]);
  async function decide(status: string) {
    if (!entry) return;
    setBusy(true); setMessage("Salvando decisão…");
    try {
      const result = await adminRequest<{ artisan_id?: string } & Record<string, unknown>>("review", { id, status, notes });
      setEntry({ ...entry, status }); setDraft(result.artisan_id || "");
      setMessage(status === "approved" ? "Aprovada. O perfil e os trabalhos foram criados como rascunhos." : "Decisão editorial salva.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível salvar."); }
    finally { setBusy(false); setPendingDecision(null); }
  }
  return <div><Link className="text-link" href="/admin">← Voltar à fila</Link><p className="status" role="status">{message}</p>{entry && <>
    <div className="profile-layout"><div><span className="chip">{entry.status}</span><h1>{entry.name}</h1><p className="eyebrow">{entry.craft}</p><p className="preserve-lines">{entry.bio}</p><dl><dt>E-mail</dt><dd>{entry.email}</dd><dt>Telefone</dt><dd>{entry.phone || "Não informado"}</dd><dt>Instagram</dt><dd>{entry.instagram || "Não informado"}</dd></dl></div>{entry.portrait_path && images[entry.portrait_path] && <img className="profile-image" src={images[entry.portrait_path]} alt="Retrato enviado para avaliação" decoding="async" />}</div>
    <div className="admin-list">{entry.submission_works.map(work => <article key={work.id} className="window form-padding"><h2>{work.title}</h2><p className="preserve-lines">{work.description}</p><p className="mono">{work.materials.join(" · ")}</p><div className="media-gallery">{work.image_paths.filter(p => images[p]).map((path, index) => <img key={path} src={images[path]} alt={`${work.title}, imagem ${index + 1}`} loading="lazy" decoding="async" />)}</div></article>)}</div>
    <div className="field section-action"><label htmlFor="review-notes">Notas editoriais internas</label><textarea id="review-notes" value={notes} onChange={e => setNotes(e.target.value)} maxLength={3000} /></div>
    <div className="actions">{entry.status !== "approved" ? <><button className="button" disabled={busy} onClick={() => decide("under_review")}>Marcar em revisão</button><button className="button primary" disabled={busy} onClick={() => setPendingDecision("approved")}>Aprovar e criar rascunho</button><button className="button" disabled={busy} onClick={() => setPendingDecision("rejected")}>Recusar proposta</button></> : <Link href="/admin/artesaos" className="button primary">{draft ? "Abrir rascunhos →" : "Gerenciar perfil aprovado →"}</Link>}</div>
    <AlertDialog open={Boolean(pendingDecision)} onOpenChange={open => { if (!open && !busy) setPendingDecision(null); }}>
      <AlertDialogContent className="window editorial-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>{pendingDecision === "approved" ? "Aprovar esta proposta?" : "Recusar esta proposta?"}</AlertDialogTitle>
          <AlertDialogDescription>{pendingDecision === "approved" ? "Um perfil e os trabalhos serão criados como rascunhos editoriais. Nada será publicado automaticamente." : "A decisão ficará registrada no histórico editorial; os materiais enviados continuarão privados."}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="button" disabled={busy}>Cancelar</AlertDialogCancel>
          <AlertDialogAction className={pendingDecision === "approved" ? "button primary" : "button"} disabled={busy} onClick={() => { if (pendingDecision) void decide(pendingDecision); }}>{busy ? "Salvando…" : "Confirmar decisão"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>}</div>;
}
