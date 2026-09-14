"use client";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase";
export function AdminLogin() {
  const [state, setState] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    const email = String(new FormData(event.currentTarget).get("email")).trim();
    const { error } = await createClient().auth.signInWithOtp({
      email, options: { shouldCreateUser: false, emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setState(error ? "Não foi possível solicitar o acesso. Confira o e-mail autorizado e tente novamente." : "Se este e-mail estiver autorizado, você receberá um link de acesso. Confira também o spam.");
    setBusy(false);
  }
  return <form className="window" onSubmit={submit}><div className="window-bar">acesso_editorial</div><div className="form-padding">
    <div className="field"><label htmlFor="login-email">E-mail autorizado</label><input id="login-email" name="email" type="email" required autoComplete="email" /></div>
    <button className="button primary section-action" disabled={busy}>{busy ? "Solicitando…" : "Enviar link de acesso →"}</button>
    <p className="status" role="status">{state}</p><p className="muted">O acesso é individual, por link enviado ao seu e-mail.</p>
  </div></form>;
}
