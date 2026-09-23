"use client";

import Link from "./safe-link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { submissionSchema } from "@/lib/validation";
import { apiRequest } from "@/lib/api-client";
import { createClient } from "@/lib/supabase";
import { parseBrlToCents } from "@/lib/currency";

const accepted = ["image/jpeg", "image/png", "image/webp"];

type CraftOption = { id: string; name: string };

export function SubmissionForm() {
  const requestId = useRef<string | null>(null);
  const [workCount, setWorkCount] = useState(1);
  const [state, setState] = useState("");
  const [busy, setBusy] = useState(false);
  const [received, setReceived] = useState(false);
  const [invalidField, setInvalidField] = useState("");
  const [crafts, setCrafts] = useState<CraftOption[]>([]);
  const [craftStatus, setCraftStatus] = useState("Carregando ofícios disponíveis…");
  const [regionWithheld, setRegionWithheld] = useState(false);

  useEffect(() => {
    let active = true;
    createClient()
      .from("categories")
      .select("id,name")
      .order("name")
      .then(({ data, error }) => {
        if (!active) return;
        const options = (data || []) as CraftOption[];
        setCrafts(options);
        setCraftStatus(
          error
            ? "Não foi possível consultar os ofícios. Recarregue a página."
            : options.length
              ? "Lista sincronizada com o catálogo editorial."
              : "Nenhum ofício está disponível no momento.",
        );
      });
    return () => {
      active = false;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const raw = new FormData(form);
    const works = Array.from({ length: workCount }, (_, index) => ({
      title: String(raw.get(`work_title_${index}`) || ""),
      description: String(raw.get(`work_description_${index}`) || ""),
      materials: String(raw.get(`work_materials_${index}`) || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      price_cents: parseBrlToCents(raw.get(`work_price_${index}`)),
      shipping_details: String(raw.get(`work_shipping_${index}`) || ""),
    }));
    const parsed = submissionSchema.safeParse({
      ...Object.fromEntries(raw),
      neighborhood: regionWithheld ? "" : String(raw.get("neighborhood") || ""),
      region_withheld: regionWithheld,
      works,
      consent: raw.get("consent") === "on",
      public_email: raw.get("public_email") === "on",
      public_phone: raw.get("public_phone") === "on",
      public_instagram: raw.get("public_instagram") === "on",
    });

    if (!parsed.success) {
      const path = parsed.error.issues[0]?.path || [];
      const workFieldNames: Record<string, string> = {
        title: "title",
        description: "description",
        materials: "materials",
        price_cents: "price",
        shipping_details: "shipping",
      };
      const key = String(path[2] || "title");
      const field =
        path[0] === "works"
          ? `work_${workFieldNames[key] || "title"}_${Number(path[1] || 0)}`
          : String(path[0] || "bio");
      setInvalidField(field);
      setState(
        "Confira os campos obrigatórios, o preço informado e os limites de texto antes de continuar.",
      );
      requestAnimationFrame(() =>
        (form.elements.namedItem(field) as HTMLElement | null)?.focus(),
      );
      return;
    }

    for (const [field, value] of raw.entries()) {
      if (!(value instanceof File) || !value.size) continue;
      if (!accepted.includes(value.type) || value.size > 5 * 1024 * 1024) {
        setInvalidField(field);
        setState(`A imagem "${value.name}" precisa ser JPEG, PNG ou WebP e ter até 5 MB.`);
        requestAnimationFrame(() =>
          (form.elements.namedItem(field) as HTMLElement | null)?.focus(),
        );
        return;
      }
    }

    const payload = new FormData();
    requestId.current ??= crypto.randomUUID();
    payload.set("request_id", requestId.current);
    payload.set("data", JSON.stringify(parsed.data));
    payload.set("website", String(raw.get("website") || ""));
    const portrait = raw.get("portrait");
    if (portrait instanceof File && portrait.size) payload.set("portrait", portrait);
    for (let index = 0; index < workCount; index++) {
      for (let photo = 0; photo < 2; photo++) {
        const file = raw.get(`work_image_${index}_${photo}`);
        if (file instanceof File && file.size) payload.set(`work_${index}_${photo}`, file);
      }
    }

    setBusy(true);
    setState("Enviando seu material para avaliação…");
    try {
      await apiRequest("/api/submissions", payload);
      form.reset();
      setRegionWithheld(false);
      setWorkCount(1);
      setReceived(true);
      setState("Recebemos seu material. A equipe vai revisar sua proposta antes da publicação.");
    } catch (error) {
      setState(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar. Seus campos foram preservados.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (received) {
    return (
      <div className="window form-padding">
        <p className="eyebrow">Envio recebido</p>
        <h2>Obrigado por compartilhar seu fazer.</h2>
        <p>{state}</p>
        <Link className="button" href="/artesaos">
          Explorar o arquivo →
        </Link>
      </div>
    );
  }

  return (
    <form
      className="window"
      onSubmit={submit}
      onInput={(event) => {
        if ((event.target as HTMLInputElement).name === invalidField) setInvalidField("");
      }}
    >
      <div className="window-bar">
        formulario_participacao.v2 <span>* obrigatório</span>
      </div>
      <fieldset disabled={busy} className="form-grid form-padding form-reset">
        <div className="field">
          <label htmlFor="name">Nome *</label>
          <input
            id="name"
            name="name"
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            aria-invalid={invalidField === "name" || undefined}
            aria-describedby={invalidField === "name" ? "submission-status" : undefined}
          />
        </div>
        <div className="field">
          <label htmlFor="craft_category_id">Ofício / técnica *</label>
          <select
            id="craft_category_id"
            name="craft_category_id"
            required
            defaultValue=""
            disabled={!crafts.length}
            aria-invalid={invalidField === "craft_category_id" || undefined}
            aria-describedby="craft-status"
          >
            <option value="" disabled>
              Selecione um ofício
            </option>
            {crafts.map((craft) => (
              <option key={craft.id} value={craft.id}>
                {craft.name}
              </option>
            ))}
          </select>
          <small id="craft-status" role="status">
            {craftStatus}
          </small>
        </div>
        <div className="field">
          <label htmlFor="neighborhood">Bairro / região</label>
          <input
            id="neighborhood"
            name="neighborhood"
            maxLength={120}
            disabled={regionWithheld}
            placeholder={regionWithheld ? "Informação preservada" : "Ex.: Centro"}
            aria-invalid={invalidField === "neighborhood" || undefined}
            aria-describedby={invalidField === "neighborhood" ? "submission-status" : undefined}
          />
        </div>
        <label className="check-row region-privacy-control">
          <input
            type="checkbox"
            name="region_withheld"
            checked={regionWithheld}
            onChange={(event) => setRegionWithheld(event.target.checked)}
          />
          Prefiro não informar publicamente minha região.
        </label>
        <div className="field">
          <label htmlFor="email">E-mail *</label>
          <input
            id="email"
            name="email"
            type="email"
            maxLength={254}
            required
            autoComplete="email"
            aria-invalid={invalidField === "email" || undefined}
            aria-describedby={invalidField === "email" ? "submission-status" : undefined}
          />
        </div>
        <div className="field">
          <label htmlFor="phone">Telefone</label>
          <input id="phone" name="phone" type="tel" maxLength={32} autoComplete="tel" />
        </div>
        <div className="field">
          <label htmlFor="instagram">Instagram</label>
          <input id="instagram" name="instagram" placeholder="@usuario" maxLength={100} />
        </div>
        <div className="field full">
          <label htmlFor="bio">Sua história e seu processo *</label>
          <textarea
            id="bio"
            name="bio"
            required
            minLength={40}
            maxLength={3000}
            placeholder="Como você começou? Quais materiais, gestos e saberes fazem parte do seu trabalho?"
            aria-invalid={invalidField === "bio" || undefined}
            aria-describedby={invalidField === "bio" ? "submission-status" : undefined}
          />
        </div>
        <div className="field full">
          <label htmlFor="portrait">Retrato autorizado · até 5 MB</label>
          <input id="portrait" name="portrait" type="file" accept={accepted.join(",")} />
          <small>JPEG, PNG ou WebP. As fotografias só serão publicadas após revisão.</small>
        </div>

        {Array.from({ length: workCount }, (_, index) => (
          <fieldset className="full work-fieldset" key={index}>
            <legend className="mono">Trabalho {index + 1}</legend>
            <div className="form-grid">
              <div className="field">
                <label htmlFor={`work_title_${index}`}>Título *</label>
                <input
                  id={`work_title_${index}`}
                  name={`work_title_${index}`}
                  required
                  minLength={2}
                  maxLength={160}
                  aria-invalid={invalidField === `work_title_${index}` || undefined}
                />
              </div>
              <div className="field">
                <label htmlFor={`work_materials_${index}`}>Materiais, separados por vírgula</label>
                <input
                  id={`work_materials_${index}`}
                  name={`work_materials_${index}`}
                  maxLength={1200}
                />
              </div>
              <div className="field">
                <label htmlFor={`work_price_${index}`}>Preço em R$</label>
                <input
                  id={`work_price_${index}`}
                  name={`work_price_${index}`}
                  inputMode="decimal"
                  placeholder="Ex.: 120,00"
                  maxLength={15}
                  aria-invalid={invalidField === `work_price_${index}` || undefined}
                />
                <small>Deixe vazio para exibir “Sob consulta”.</small>
              </div>
              <div className="field">
                <label htmlFor={`work_shipping_${index}`}>Envio ou retirada</label>
                <input
                  id={`work_shipping_${index}`}
                  name={`work_shipping_${index}`}
                  maxLength={500}
                  placeholder="Ex.: retirada no ateliê ou envio para todo o Brasil"
                  aria-invalid={invalidField === `work_shipping_${index}` || undefined}
                />
              </div>
              <div className="field full">
                <label htmlFor={`work_description_${index}`}>Descrição *</label>
                <textarea
                  id={`work_description_${index}`}
                  name={`work_description_${index}`}
                  required
                  minLength={10}
                  maxLength={2000}
                  aria-invalid={invalidField === `work_description_${index}` || undefined}
                />
              </div>
              {[0, 1].map((photo) => (
                <div className="field" key={photo}>
                  <label htmlFor={`work_image_${index}_${photo}`}>
                    Imagem {photo + 1} · até 5 MB
                  </label>
                  <input
                    id={`work_image_${index}_${photo}`}
                    name={`work_image_${index}_${photo}`}
                    type="file"
                    accept={accepted.join(",")}
                    aria-invalid={invalidField === `work_image_${index}_${photo}` || undefined}
                  />
                </div>
              ))}
            </div>
          </fieldset>
        ))}

        <div className="full actions">
          {workCount < 3 && (
            <button className="button" type="button" onClick={() => setWorkCount((count) => count + 1)}>
              + Adicionar trabalho
            </button>
          )}
          {workCount > 1 && (
            <button className="button" type="button" onClick={() => setWorkCount((count) => count - 1)}>
              Remover último trabalho
            </button>
          )}
        </div>

        <fieldset className="full work-fieldset">
          <legend className="mono">Contatos no perfil público</legend>
          <p className="muted">Marque apenas os canais que você autoriza divulgar.</p>
          {[
            ["public_email", "Divulgar e-mail"],
            ["public_phone", "Divulgar telefone"],
            ["public_instagram", "Divulgar Instagram"],
          ].map(([name, text]) => (
            <label className="check-row" key={name}>
              <input type="checkbox" name={name} />
              {text}
            </label>
          ))}
        </fieldset>
        <div className="honeypot" aria-hidden="true">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <label className="full check-row">
          <input type="checkbox" required name="consent" />
          Autorizo a avaliação editorial e a publicação dos dados e imagens enviados no InovArt.
          Declaro ter autorização para compartilhar esse material.
        </label>
        <div className="full">
          <button className="button primary" disabled={busy || !crafts.length}>
            {busy ? "Enviando…" : "Enviar para avaliação →"}
          </button>
        </div>
      </fieldset>
      <p
        id="submission-status"
        className="status form-status"
        role={invalidField ? "alert" : "status"}
      >
        {state}
      </p>
    </form>
  );
}
