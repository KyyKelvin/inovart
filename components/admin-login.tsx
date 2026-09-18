"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="admin-login-google-mark" viewBox="0 0 24 24">
      <path fill="#4285f4" d="M21.6 12.23c0-.71-.06-1.4-.19-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.55h3.24c1.9-1.75 2.98-4.33 2.98-7.42Z" />
      <path fill="#34a853" d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.55c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.63A10 10 0 0 0 12 22Z" />
      <path fill="#fbbc05" d="M6.39 13.85A6 6 0 0 1 6.08 12c0-.64.11-1.27.31-1.85V7.52H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.48l3.35-2.63Z" />
      <path fill="#ea4335" d="M12 6.02c1.47 0 2.78.5 3.82 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.63C7.18 7.78 9.39 6.02 12 6.02Z" />
    </svg>
  );
}

export function AdminLogin() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn() {
    if (busy) return;
    setBusy(true);
    setMessage("Abrindo a autenticação segura do Google…");

    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });

    if (error) {
      setMessage("Não foi possível iniciar o acesso. Tente novamente em alguns instantes.");
      setBusy(false);
    }
  }

  return (
    <div className="window admin-login-window">
      <div className="window-bar admin-login-window-bar">
        <span>acesso_editorial.exe</span>
        <span className="admin-login-window-status"><i aria-hidden="true" /> conexão segura</span>
      </div>
      <div className="admin-login-panel">
        <div className="admin-login-index" aria-hidden="true">01 / IDENTIDADE</div>
        <h2>Entre no arquivo.</h2>
        <p className="admin-login-intro">
          A edição do acervo é reservada à equipe autorizada. A identidade é confirmada pelo Google e a permissão é validada novamente no servidor.
        </p>
        <button type="button" className="button primary admin-login-button" disabled={busy} onClick={signIn}>
          <GoogleMark />
          <span>{busy ? "Conectando ao Google…" : "Continuar com Google"}</span>
          <span aria-hidden="true" className="admin-login-arrow">↗</span>
        </button>
        <p className="status admin-login-message" role="status" aria-live="polite">{message}</p>
        <div className="admin-login-security" aria-label="Informações de segurança">
          <span><i aria-hidden="true" /> OAuth 2.0</span>
          <span><i aria-hidden="true" /> sessão protegida</span>
          <span><i aria-hidden="true" /> acesso por função</span>
        </div>
        <p className="muted admin-login-help">
          Use uma conta Google previamente credenciada. A InovArt não solicita nem armazena sua senha do Google.
        </p>
      </div>
    </div>
  );
}
