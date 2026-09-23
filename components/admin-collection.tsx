"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { adminRequest } from "@/lib/api-client";
import { formatCentsForInput, parseBrlToCents } from "@/lib/currency";
import { slugify } from "@/lib/validation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Table = "artisans" | "works" | "categories";
type Row = {
  id: string;
  name?: string;
  title?: string;
  slug?: string;
  craft?: string;
  craft_category_id?: string | null;
  bio?: string;
  description?: string;
  neighborhood?: string;
  region_withheld?: boolean;
  quote?: string;
  year?: number;
  materials?: string[];
  price_cents?: number | null;
  shipping_details?: string;
  artisan_id?: string;
  status?: string;
  featured?: boolean;
  artisan_categories?: { category_id: string }[];
  work_categories?: { category_id: string }[];
};

type PendingAction = { row: Row; action: "publish" | "archive" | "delete" };

export function AdminCollection({ table, title }: { table: Table; title: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [categories, setCategories] = useState<Row[]>([]);
  const [artisans, setArtisans] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Row | null>(null);
  const [message, setMessage] = useState("Consultando registros…");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const client = createClient();
    const selection =
      table === "artisans"
        ? "*,artisan_categories(category_id)"
        : table === "works"
          ? "*,work_categories(category_id)"
          : "*";
    const [records, cats, people] = await Promise.all([
      client.from(table).select(selection).order("created_at", { ascending: false }).limit(100),
      client.from("categories").select("id,name,slug").order("name"),
      client.from("artisans").select("id,name").order("name"),
    ]);
    setRows((records.data || []) as unknown as Row[]);
    setCategories((cats.data || []) as Row[]);
    setArtisans((people.data || []) as Row[]);
    setMessage(
      records.error
        ? "Não foi possível consultar os registros."
        : `${records.data?.length || 0} registros.`,
    );
  }, [table]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function runAction({ row, action }: PendingAction) {
    setBusy(true);
    try {
      if (action === "delete") {
        await adminRequest("delete_category", { id: row.id });
        setMessage("Categoria excluída. Os menus de ofício já foram sincronizados.");
      } else {
        const result = await adminRequest<{ cleanup_pending?: boolean }>(action, {
          table,
          id: row.id,
        });
        const confirmation = action === "publish" ? "Registro publicado." : "Registro arquivado.";
        setMessage(
          result.cleanup_pending
            ? `${confirmation} As imagens antigas aguardam a limpeza automática.`
            : confirmation,
        );
      }
      setPendingAction(null);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível alterar o registro.");
    } finally {
      setBusy(false);
    }
  }

  const actionLabel =
    pendingAction?.action === "publish"
      ? "Publicar"
      : pendingAction?.action === "archive"
        ? "Arquivar"
        : "Excluir";

  return (
    <div>
      <div className="actions">
        <button className="button primary" onClick={() => setSelected({ id: "" })}>
          + Novo {title}
        </button>
      </div>
      <p className="status" role="status">
        {message}
      </p>
      {selected && (
        <CollectionEditor
          key={selected.id || "new"}
          table={table}
          row={selected}
          categories={categories}
          artisans={artisans}
          onClose={() => setSelected(null)}
          onSaved={async () => {
            setSelected(null);
            await load();
          }}
        />
      )}

      <AlertDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => {
          if (!open && !busy) setPendingAction(null);
        }}
      >
        <AlertDialogContent className="window editorial-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionLabel} “{pendingAction?.row.name || pendingAction?.row.title}”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.action === "publish"
                ? "O registro e suas imagens aprovadas passarão a aparecer no arquivo público."
                : pendingAction?.action === "archive"
                  ? "O registro deixará de aparecer no arquivo público. Esta ação pode ser revertida."
                  : "A categoria sairá dos menus de ofício e das relações editoriais. O nome histórico já gravado nos perfis será preservado."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="button" disabled={busy}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className={pendingAction?.action === "publish" ? "button primary" : "button"}
              disabled={busy}
              onClick={() => {
                if (pendingAction) void runAction(pendingAction);
              }}
            >
              {busy ? "Salvando…" : `Confirmar ${actionLabel.toLowerCase()}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="admin-list">
        {rows.map((row) => (
          <article className="window form-padding" key={row.id}>
            <span className="chip">{row.status || "Categoria"}</span>
            <h2>{row.name || row.title}</h2>
            <p className="muted">{row.craft || row.description}</p>
            <div className="actions">
              <button className="button" onClick={() => setSelected(row)}>
                Editar
              </button>
              {table === "categories" ? (
                <button
                  className="button admin-delete-button"
                  onClick={() => setPendingAction({ row, action: "delete" })}
                >
                  <Trash2 size={15} aria-hidden="true" /> Excluir
                </button>
              ) : (
                <>
                  {row.status !== "published" && (
                    <button
                      className="button primary"
                      onClick={() => setPendingAction({ row, action: "publish" })}
                    >
                      Publicar
                    </button>
                  )}
                  {row.status !== "archived" && (
                    <button
                      className="button"
                      disabled={busy}
                      onClick={() => setPendingAction({ row, action: "archive" })}
                    >
                      Arquivar
                    </button>
                  )}
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function CollectionEditor({
  table,
  row,
  categories,
  artisans,
  onClose,
  onSaved,
}: {
  table: Table;
  row: Row;
  categories: Row[];
  artisans: Row[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [regionWithheld, setRegionWithheld] = useState(Boolean(row.region_withheld));
  const label = table === "works" ? "title" : "name";
  const selectedCraft =
    row.craft_category_id || row.artisan_categories?.[0]?.category_id || "";

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const values: Record<string, unknown> = Object.fromEntries(data);
    values.slug = String(values.slug || slugify(String(values[label])));
    values.featured = data.get("featured") === "on";
    values.category_ids = data.getAll("category_ids");

    if (table === "artisans") {
      values.region_withheld = regionWithheld;
      values.neighborhood = regionWithheld ? "" : String(data.get("neighborhood") || "");
    }

    if (table === "works") {
      const price = parseBrlToCents(data.get("price"));
      if (price === -1) {
        setMessage("Informe um preço válido, com no máximo duas casas decimais.");
        (form.elements.namedItem("price") as HTMLElement | null)?.focus();
        return;
      }
      values.materials = String(values.materials || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      values.year = values.year ? Number(values.year) : null;
      values.price_cents = price;
      values.shipping_details = String(data.get("shipping_details") || "");
      delete values.price;
    }

    setBusy(true);
    try {
      await adminRequest("save", { table, id: row.id || undefined, values });
      await onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="window editor-form" onSubmit={save}>
      <div className="window-bar">{row.id ? "Editar registro" : "Novo rascunho"}</div>
      <fieldset className="form-grid form-padding form-reset" disabled={busy}>
        <div className="field">
          <label htmlFor="editor-name">{table === "works" ? "Título" : "Nome"} *</label>
          <input
            id="editor-name"
            name={label}
            defaultValue={row.name || row.title || ""}
            minLength={2}
            maxLength={160}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="editor-slug">Endereço curto</label>
          <input
            id="editor-slug"
            name="slug"
            defaultValue={row.slug || ""}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            maxLength={180}
            placeholder="nome-do-registro"
          />
        </div>

        {table === "artisans" && (
          <>
            <div className="field">
              <label htmlFor="editor-craft">Ofício *</label>
              <select
                id="editor-craft"
                name="craft_category_id"
                defaultValue={selectedCraft}
                required
              >
                <option value="" disabled>
                  Selecione uma categoria
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="editor-neighborhood">Bairro / região</label>
              <input
                id="editor-neighborhood"
                name="neighborhood"
                defaultValue={row.neighborhood || ""}
                maxLength={120}
                disabled={regionWithheld}
                placeholder={regionWithheld ? "Informação preservada" : "Ex.: Centro"}
              />
            </div>
            <label className="full check-row">
              <input
                name="region_withheld"
                type="checkbox"
                checked={regionWithheld}
                onChange={(event) => setRegionWithheld(event.target.checked)}
              />
              Região não informada por escolha do artesão
            </label>
            <div className="field full">
              <label htmlFor="editor-bio">História *</label>
              <textarea
                id="editor-bio"
                name="bio"
                defaultValue={row.bio || ""}
                minLength={40}
                maxLength={3000}
                required
              />
            </div>
            <div className="field full">
              <label htmlFor="editor-quote">Citação</label>
              <textarea id="editor-quote" name="quote" defaultValue={row.quote || ""} maxLength={500} />
            </div>
          </>
        )}

        {table === "works" && (
          <>
            <div className="field">
              <label htmlFor="editor-artisan">Autoria *</label>
              <select id="editor-artisan" name="artisan_id" defaultValue={row.artisan_id || ""} required>
                <option value="">Escolha um artesão</option>
                {artisans.map((artisan) => (
                  <option key={artisan.id} value={artisan.id}>
                    {artisan.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="editor-year">Ano</label>
              <input
                id="editor-year"
                type="number"
                name="year"
                min={1900}
                max={2100}
                defaultValue={row.year || ""}
              />
            </div>
            <div className="field">
              <label htmlFor="editor-price">Preço em R$</label>
              <input
                id="editor-price"
                name="price"
                inputMode="decimal"
                defaultValue={formatCentsForInput(row.price_cents)}
                placeholder="Ex.: 120,00"
                maxLength={15}
              />
            </div>
            <div className="field">
              <label htmlFor="editor-shipping">Envio ou retirada</label>
              <input
                id="editor-shipping"
                name="shipping_details"
                defaultValue={row.shipping_details || ""}
                maxLength={500}
                placeholder="Ex.: retirada no ateliê"
              />
            </div>
            <div className="field full">
              <label htmlFor="editor-materials">Materiais (separados por vírgula)</label>
              <input
                id="editor-materials"
                name="materials"
                defaultValue={row.materials?.join(", ") || ""}
              />
            </div>
          </>
        )}

        {table !== "artisans" && (
          <div className="field full">
            <label htmlFor="editor-description">Descrição *</label>
            <textarea
              id="editor-description"
              name="description"
              defaultValue={row.description || ""}
              minLength={10}
              maxLength={2000}
              required
            />
          </div>
        )}

        {table !== "categories" && (
          <>
            <fieldset className="full work-fieldset">
              <legend>Categorias relacionadas</legend>
              {categories.map((category) => (
                <label className="check-row" key={category.id}>
                  <input
                    name="category_ids"
                    type="checkbox"
                    value={category.id}
                    defaultChecked={[
                      ...(row.artisan_categories || []),
                      ...(row.work_categories || []),
                    ].some((item) => item.category_id === category.id)}
                  />
                  {category.name}
                </label>
              ))}
            </fieldset>
            <label className="full check-row">
              <input name="featured" type="checkbox" defaultChecked={row.featured} />
              Destacar na página inicial
            </label>
          </>
        )}

        <div className="full actions">
          <button className="button primary" type="submit">
            {busy ? "Salvando…" : "Salvar registro"}
          </button>
          <button className="button" type="button" onClick={onClose}>
            Cancelar
          </button>
        </div>
        <p className="full status" role="status">
          {message}
        </p>
      </fieldset>
    </form>
  );
}
