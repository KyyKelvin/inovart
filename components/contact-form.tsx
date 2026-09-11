"use client";
import { useState, type FormEvent } from "react";
import { contactSchema } from "@/lib/validation";
import { apiRequest } from "@/lib/api-client";
export function ContactForm() {
  const [state, setState] = useState("");
  const [busy, setBusy] = useState(false);
  const [invalidField, setInvalidField] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const parsed = contactSchema.safeParse(Object.fromEntries(values));
    if (!parsed.success) {
      const field = String(parsed.error.issues[0]?.path[0] || "message");
      setInvalidField(field);
      setState("Confira o campo indicado. A mensagem precisa ter entre 10 e 3.000 caracteres.");
      requestAnimationFrame(() => (form.elements.namedItem(field) as HTMLElement | null)?.focus());
      return;
    }
    setBusy(true); setState("Enviando…");
    try {
      await apiRequest("/api/contact", { ...parsed.data, website: values.get("website") || "" });
      form.reset(); setState("Mensagem recebida. Obrigado por conversar com o arquivo.");
    } catch (error) { setState(error instanceof Error ? error.message : "Não foi possível enviar."); }
    finally { setBusy(false); }
  }
  return <form className="window" onSubmit={submit} onInput={event => { if ((event.target as HTMLInputElement).name === invalidField) setInvalidField(""); }}>
    <div className="window-bar">mensagem.txt</div>
    <div className="form-grid form-padding">
      <div className="field"><label htmlFor="contact-name">Nome *</label><input id="contact-name" name="name" minLength={2} maxLength={120} required autoComplete="name" aria-invalid={invalidField === "name" || undefined} aria-describedby={invalidField === "name" ? "contact-status" : undefined} /></div>
      <div className="field"><label htmlFor="contact-email">E-mail *</label><input id="contact-email" name="email" type="email" maxLength={254} required autoComplete="email" aria-invalid={invalidField === "email" || undefined} aria-describedby={invalidField === "email" ? "contact-status" : undefined} /></div>
      <div className="field full"><label htmlFor="contact-subject">Assunto *</label><input id="contact-subject" name="subject" minLength={2} maxLength={160} required aria-invalid={invalidField === "subject" || undefined} aria-describedby={invalidField === "subject" ? "contact-status" : undefined} /></div>
      <div className="field full"><label htmlFor="contact-message">Mensagem *</label><textarea id="contact-message" name="message" minLength={10} maxLength={3000} required aria-invalid={invalidField === "message" || undefined} aria-describedby={invalidField === "message" ? "contact-status" : undefined} /></div>
      <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="full"><button className="button primary" disabled={busy}>{busy ? "Enviando…" : "Enviar mensagem →"}</button><p id="contact-status" className="status" role={invalidField ? "alert" : "status"}>{state}</p></div>
    </div>
  </form>;
}
