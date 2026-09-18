"use client";

import Link from "../../../components/safe-link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type CallbackState = "checking" | "error" | "denied";

export default function CallbackPage() {
  const [state, setState] = useState<CallbackState>("checking");
  const [message, setMessage] = useState("Confirmando sua identidade com o Google.");

  useEffect(() => {
    let active = true;

    async function authenticate() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const providerError = url.searchParams.get("error");

      window.history.replaceState(null, "", "/auth/callback");

      if (providerError || !code) {
        setState("error");
        setMessage("O acesso não foi concluído. Volte e tente entrar novamente.");
        return;
      }

      const client = createClient();
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!active) return;

      if (error) {
        setState("error");
        setMessage("Não foi possível validar esta sessão. Inicie o acesso novamente.");
        return;
      }

      const { data, error: userError } = await client.auth.getUser();
      if (!active) return;

      if (userError || data.user?.app_metadata?.role !== "admin") {
        await client.auth.signOut();
        if (!active) return;
        setState("denied");
        setMessage("Esta conta Google não possui acesso à área editorial.");
        return;
      }

      window.location.replace("/admin");
    }

    void authenticate();
    return () => { active = false; };
  }, []);

  return (
    <main id="conteudo" className="admin-login-page grid-noise">
      <section className="site-shell admin-callback-shell" aria-labelledby="callback-title">
        <div className="window admin-callback-window">
          <div className="window-bar">
            <span>verificação_de_acesso</span>
            <span>{state === "checking" ? "em curso" : "concluída"}</span>
          </div>
          <div className="admin-callback-panel">
            <div className={`admin-callback-orbit admin-callback-orbit--${state}`} aria-hidden="true"><i /></div>
            <p className="eyebrow">Autenticação / Google OAuth</p>
            <h1 id="callback-title">Validando<br />credencial.</h1>
            <p className="admin-callback-message" role="status" aria-live="polite">{message}</p>
            {state !== "checking" && <Link href="/admin/login" className="button">Voltar ao acesso →</Link>}
          </div>
        </div>
      </section>
    </main>
  );
}
