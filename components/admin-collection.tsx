"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase";
import { adminRequest } from "@/lib/api-client";
import { slugify } from "@/lib/validation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type Table = "artisans" | "works" | "categories";
type Row = { id: string; name?: string; title?: string; slug?: string; craft?: string; bio?: string; description?: string; neighborhood?: string; quote?: string; year?: number; materials?: string[]; artisan_id?: string; status?: string; featured?: boolean; artisan_categories?: { category_id: string }[]; work_categories?: { category_id: string }[] };
export function AdminCollection({ table, title }: { table: Table; title: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [categories, setCategories] = useState<Row[]>([]);
  const [artisans, setArtisans] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Row | null>(null);
  const [message, setMessage] = useState("Consultando registros…");
  const [pendingAction, setPendingAction] = useState<{ row: Row; action: "publish" | "archive" } | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const client = createClient();
    const selection = table === "artisans" ? "*,artisan_categories(category_id)" : table === "works" ? "*,work_categories(category_id)" : "*";
    const [records, cats, people] = await Promise.all([
      client.from(table).select(selection).order("created_at", { ascending: false }).limit(100),
      client.from("categories").select("id,name,slug").order("name"),
      client.from("artisans").select("id,name").order("name"),
    ]);
    setRows((records.data || []) as unknown as Row[]);
    setCategories(cats.data || []); setArtisans(people.data || []);
    setMessage(records.error ? "Não foi possível consultar os registros." : `${records.data?.length || 0} registros.`);
  }, [table]);
  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);
  async function changeStatus(row: Row, action: "publish" | "archive") {
    setBusy(true);
    try {
      const result = await adminRequest<{ cleanup_pending?: boolean }>(action, { table, id: row.id });
      setPendingAction(null); await load();
      const confirmation = action === "publish" ? "Registro publicado." : "Registro arquivado.";
      setMessage(result.cleanup_pending ? `${confirmation} As imagens antigas aguardam a limpeza automática e serão removidas na próxima operação editorial.` : confirmation);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível alterar o registro."); }
    finally { setBusy(false); }
  }
  return <div>
    <div className="actions"><button className="button primary" onClick={() => setSelected({ id: "" })}>+ Novo {title}</button></div>
    <p className="status" role="status">{message}</p>
    {selected && <CollectionEditor key={selected.id || "new"} table={table} row={selected} categories={categories} artisans={artisans} onClose={() => setSelected(null)} onSaved={async () => { setSelected(null); await load(); }} />}
    <AlertDialog open={Boolean(pendingAction)} onOpenChange={open => { if (!open && !busy) setPendingAction(null); }}>
      <AlertDialogContent className="window editorial-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>{pendingAction?.action === "publish" ? "Publicar" : "Arquivar"} “{pendingAction?.row.name || pendingAction?.row.title}”?</AlertDialogTitle>
          <AlertDialogDescription>{pendingAction?.action === "publish" ? "O registro e suas imagens aprovadas passarão a aparecer no arquivo público." : "O registro deixará de aparecer no arquivo público. Esta ação pode ser revertida por uma nova publicação."}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="button" disabled={busy}>Cancelar</AlertDialogCancel>
          <AlertDialogAction className={pendingAction?.action === "publish" ? "button primary" : "button"} disabled={busy} onClick={() => { if (pendingAction) void changeStatus(pendingAction.row, pendingAction.action); }}>{busy ? "Salvando…" : "Confirmar"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <div className="admin-list">{rows.map(row => <article className="window form-padding" key={row.id}>
      <span className="chip">{row.status || "Categoria"}</span><h2>{row.name || row.title}</h2><p className="muted">{row.craft || row.description}</p>
      <div className="actions"><button className="button" onClick={() => setSelected(row)}>Editar</button>
        {table !== "categories" && <>{row.status !== "published" && <button className="button primary" onClick={() => setPendingAction({ row, action: "publish" })}>Publicar</button>}{row.status !== "archived" && <button className="button" disabled={busy} onClick={() => setPendingAction({ row, action: "archive" })}>Arquivar</button>}</>}
      </div>
    </article>)}</div>
  </div>;
}
function CollectionEditor({ table, row, categories, artisans, onClose, onSaved }: { table: Table; row: Row; categories: Row[]; artisans: Row[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const label = table === "works" ? "title" : "name";
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const values: Record<string, unknown> = Object.fromEntries(data);
    values.slug = String(values.slug || slugify(String(values[label])));
    values.featured = data.get("featured") === "on";
    values.category_ids = data.getAll("category_ids");
    if (table === "works") { values.materials = String(values.materials || "").split(",").map(x => x.trim()).filter(Boolean); values.year = values.year ? Number(values.year) : null; }
    setBusy(true);
    try { await adminRequest("save", { table, id: row.id || undefined, values }); await onSaved(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível salvar."); }
    finally { setBusy(false); }
  }
  return <form className="window editor-form" onSubmit={save}><div className="window-bar">{row.id ? "Editar registro" : "Novo rascunho"}</div><fieldset className="form-grid form-padding form-reset" disabled={busy}>
    <div className="field"><label htmlFor="editor-name">{table === "works" ? "Título" : "Nome"} *</label><input id="editor-name" name={label} defaultValue={row.name || row.title || ""} minLength={2} maxLength={160} required /></div>
    <div className="field"><label htmlFor="editor-slug">Endereço curto</label><input id="editor-slug" name="slug" defaultValue={row.slug || ""} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={180} placeholder="nome-do-registro" /></div>
    {table === "artisans" && <>
      <div className="field"><label htmlFor="editor-craft">Ofício *</label><input id="editor-craft" name="craft" defaultValue={row.craft || ""} required maxLength={120} /></div>
      <div className="field"><label htmlFor="editor-neighborhood">Bairro</label><input id="editor-neighborhood" name="neighborhood" defaultValue={row.neighborhood || ""} maxLength={120} /></div>
      <div className="field full"><label htmlFor="editor-bio">História *</label><textarea id="editor-bio" name="bio" defaultValue={row.bio || ""} minLength={40} maxLength={3000} required /></div>
      <div className="field full"><label htmlFor="editor-quote">Citação</label><textarea id="editor-quote" name="quote" defaultValue={row.quote || ""} maxLength={500} /></div>
    </>}
    {table === "works" && <>
      <div className="field"><label htmlFor="editor-artisan">Autoria *</label><select id="editor-artisan" name="artisan_id" defaultValue={row.artisan_id || ""} required><option value="">Escolha um artesão</option>{artisans.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
      <div className="field"><label htmlFor="editor-year">Ano</label><input id="editor-year" type="number" name="year" min={1900} max={2100} defaultValue={row.year || ""} /></div>
      <div className="field full"><label htmlFor="editor-materials">Materiais (separados por vírgula)</label><input id="editor-materials" name="materials" defaultValue={row.materials?.join(", ") || ""} /></div>
    </>}
    {table !== "artisans" && <div className="field full"><label htmlFor="editor-description">Descrição *</label><textarea id="editor-description" name="description" defaultValue={row.description || ""} minLength={10} maxLength={2000} required /></div>}
    {table !== "categories" && <>
      <fieldset className="full work-fieldset"><legend>Técnicas</legend>{categories.map(cat => <label className="check-row" key={cat.id}><input name="category_ids" type="checkbox" value={cat.id} defaultChecked={[...(row.artisan_categories || []), ...(row.work_categories || [])].some(x => x.category_id === cat.id)} />{cat.name}</label>)}</fieldset>
      <label className="full check-row"><input name="featured" type="checkbox" defaultChecked={row.featured} />Destacar na página inicial</label>
    </>}
    <div className="full actions"><button className="button primary">{busy ? "Salvando…" : "Salvar registro"}</button><button className="button" type="button" onClick={onClose}>Cancelar</button></div>
    <p className="full status" role="status">{message}</p>
  </fieldset></form>;
}
