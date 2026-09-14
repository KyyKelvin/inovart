"use client";
import Link from "./safe-link";
import { useRef, useState, type FormEvent } from "react";
import { submissionSchema } from "@/lib/validation";
import { apiRequest } from "@/lib/api-client";

const accepted = ["image/jpeg", "image/png", "image/webp"];
export function SubmissionForm() {
  const requestId = useRef<string | null>(null);
  const [workCount, setWorkCount] = useState(1);
  const [state, setState] = useState("");
  const [busy, setBusy] = useState(false);
  const [received, setReceived] = useState(false);
  const [invalidField, setInvalidField] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const raw = new FormData(form);
    const works = Array.from({ length: workCount }, (_, index) => ({
      title: String(raw.get(`work_title_${index}`) || ""),
      description: String(raw.get(`work_description_${index}`) || ""),
      materials: String(raw.get(`work_materials_${index}`) || "").split(",").map(x => x.trim()).filter(Boolean),
    }));
    const parsed = submissionSchema.safeParse({
      ...Object.fromEntries(raw), works,
      consent: raw.get("consent") === "on",
      public_email: raw.get("public_email") === "on",
      public_phone: raw.get("public_phone") === "on",
      public_instagram: raw.get("public_instagram") === "on",
    });
    if (!parsed.success) {
      const path = parsed.error.issues[0]?.path || [];
      const field = path[0] === "works" ? `work_${String(path[2] || "title")}_${Number(path[1] || 0)}` : String(path[0] || "bio");
      setInvalidField(field);
      setState("Confira os campos: sua história precisa ter ao menos 40 caracteres; cada trabalho, um título e uma descrição com ao menos 10 caracteres.");
      requestAnimationFrame(() => (form.elements.namedItem(field) as HTMLElement | null)?.focus());
      return;
    }
    for (const [field, value] of raw.entries()) {
      if (!(value instanceof File) || !value.size) continue;
      if (!accepted.includes(value.type) || value.size > 5 * 1024 * 1024) {
        setInvalidField(field);
        setState(`A imagem "${value.name}" precisa ser JPEG, PNG ou WebP e ter até 5 MB.`);
        requestAnimationFrame(() => (form.elements.namedItem(field) as HTMLElement | null)?.focus());
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
    for (let index = 0; index < workCount; index++)
      for (let photo = 0; photo < 2; photo++) {
        const file = raw.get(`work_image_${index}_${photo}`);
        if (file instanceof File && file.size) payload.set(`work_${index}_${photo}`, file);
      }
    setBusy(true); setState("Enviando seu material para avaliação…");
    try {
      await apiRequest("/api/submissions", payload);
      form.reset(); setReceived(true);
      setState("Recebemos seu material. A equipe vai revisar sua proposta antes da publicação.");
    } catch (error) { setState(error instanceof Error ? error.message : "Não foi possível enviar. Seus campos foram preservados."); }
    finally { setBusy(false); }
  }
  if (received) return <div className="window form-padding"><p className="eyebrow">Envio recebido</p><h2>Obrigado por compartilhar seu fazer.</h2><p>{state}</p><Link className="button" href="/artesaos">Explorar o arquivo →</Link></div>;
  return <form className="window" onSubmit={submit} onInput={event => { if ((event.target as HTMLInputElement).name === invalidField) setInvalidField(""); }}>
    <div className="window-bar">formulario_participacao.v1 <span>* obrigatório</span></div>
    <fieldset disabled={busy} className="form-grid form-padding form-reset">
      <div className="field"><label htmlFor="name">Nome *</label><input id="name" name="name" required minLength={2} maxLength={120} autoComplete="name" aria-invalid={invalidField === "name" || undefined} aria-describedby={invalidField === "name" ? "submission-status" : undefined} /></div>
      <div className="field"><label htmlFor="craft">Ofício / técnica *</label><input id="craft" name="craft" required minLength={2} maxLength={120} aria-invalid={invalidField === "craft" || undefined} aria-describedby={invalidField === "craft" ? "submission-status" : undefined} /></div>
      <div className="field"><label htmlFor="neighborhood">Bairro</label><input id="neighborhood" name="neighborhood" maxLength={120} aria-invalid={invalidField === "neighborhood" || undefined} aria-describedby={invalidField === "neighborhood" ? "submission-status" : undefined} /></div>
      <div className="field"><label htmlFor="email">E-mail *</label><input id="email" name="email" type="email" maxLength={254} required autoComplete="email" aria-invalid={invalidField === "email" || undefined} aria-describedby={invalidField === "email" ? "submission-status" : undefined} /></div>
      <div className="field"><label htmlFor="phone">Telefone</label><input id="phone" name="phone" type="tel" maxLength={32} autoComplete="tel" aria-invalid={invalidField === "phone" || undefined} aria-describedby={invalidField === "phone" ? "submission-status" : undefined} /></div>
      <div className="field"><label htmlFor="instagram">Instagram</label><input id="instagram" name="instagram" placeholder="@usuario" maxLength={100} aria-invalid={invalidField === "instagram" || undefined} aria-describedby={invalidField === "instagram" ? "submission-status" : undefined} /></div>
      <div className="field full"><label htmlFor="bio">Sua história e seu processo *</label><textarea id="bio" name="bio" required minLength={40} maxLength={3000} placeholder="Como você começou? Quais materiais, gestos e saberes fazem parte do seu trabalho?" aria-invalid={invalidField === "bio" || undefined} aria-describedby={invalidField === "bio" ? "submission-status" : undefined} /></div>
      <div className="field full"><label htmlFor="portrait">Retrato autorizado · até 5 MB</label><input id="portrait" name="portrait" type="file" accept="image/jpeg,image/png,image/webp" aria-invalid={invalidField === "portrait" || undefined} aria-describedby={invalidField === "portrait" ? "submission-status" : undefined} /><small>JPEG, PNG ou WebP. As fotografias só serão publicadas após revisão.</small></div>
      {Array.from({ length: workCount }, (_, index) => <fieldset className="full work-fieldset" key={index}>
        <legend className="mono">Trabalho {index + 1}</legend>
        <div className="form-grid">
          <div className="field"><label htmlFor={`work_title_${index}`}>Título *</label><input id={`work_title_${index}`} name={`work_title_${index}`} required minLength={2} maxLength={160} aria-invalid={invalidField === `work_title_${index}` || undefined} aria-describedby={invalidField === `work_title_${index}` ? "submission-status" : undefined} /></div>
          <div className="field"><label htmlFor={`work_materials_${index}`}>Materiais, separados por vírgula</label><input id={`work_materials_${index}`} name={`work_materials_${index}`} maxLength={1200} /></div>
          <div className="field full"><label htmlFor={`work_description_${index}`}>Descrição *</label><textarea id={`work_description_${index}`} name={`work_description_${index}`} required minLength={10} maxLength={2000} aria-invalid={invalidField === `work_description_${index}` || undefined} aria-describedby={invalidField === `work_description_${index}` ? "submission-status" : undefined} /></div>
          {[0, 1].map(photo => <div className="field" key={photo}><label htmlFor={`work_image_${index}_${photo}`}>Imagem {photo + 1} · até 5 MB</label><input id={`work_image_${index}_${photo}`} name={`work_image_${index}_${photo}`} type="file" accept="image/jpeg,image/png,image/webp" aria-invalid={invalidField === `work_image_${index}_${photo}` || undefined} aria-describedby={invalidField === `work_image_${index}_${photo}` ? "submission-status" : undefined} /></div>)}
        </div>
      </fieldset>)}
      <div className="full actions">
        {workCount < 3 && <button className="button" type="button" onClick={() => setWorkCount(workCount + 1)}>+ Adicionar trabalho</button>}
        {workCount > 1 && <button className="button" type="button" onClick={() => setWorkCount(workCount - 1)}>Remover último trabalho</button>}
      </div>
      <fieldset className="full work-fieldset"><legend className="mono">Contatos no perfil público</legend>
        <p className="muted">Marque apenas os canais que você autoriza divulgar. Os demais ficam com a equipe.</p>
        {[["public_email", "Divulgar e-mail"], ["public_phone", "Divulgar telefone"], ["public_instagram", "Divulgar Instagram"]].map(([name, text]) => <label className="check-row" key={name}><input type="checkbox" name={name} />{text}</label>)}
      </fieldset>
      <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="full check-row"><input type="checkbox" required name="consent" />Autorizo a avaliação editorial e a publicação dos dados e imagens enviados no InovArt. Declaro ter autorização para compartilhar esse material.</label>
      <div className="full"><button className="button primary" disabled={busy}>{busy ? "Enviando…" : "Enviar para avaliação →"}</button></div>
    </fieldset>
    <p id="submission-status" className="status form-status" role={invalidField ? "alert" : "status"}>{state}</p>
  </form>;
}
