"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
export function AdminLogin() {
  const [state, setState] = useState("");
  const [busy, setBusy] = useState(false);
  async function signIn() {
    setBusy(true);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      setState("Não foi possível iniciar o acesso com o Google. Tente novamente.");
      setBusy(false);
    }
  }
  return <div className="window"><div className="window-bar">acesso_editorial</div><div className="form-padding">
    <button type="button" className="button primary section-action" disabled={busy} onClick={signIn}>{busy ? "Conectando…" : "Entrar com Google →"}</button>
    <p className="status" role="status">{state}</p><p className="muted">Use uma conta Google autorizada pela equipe editorial.</p>
  </div></div>;
}
