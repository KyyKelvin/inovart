"use client";
import Link from "../../../components/safe-link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
export default function Callback() {
  const [message, setMessage] = useState("Validando seu acesso com o Google…");
  useEffect(() => {
    let active = true;
    async function authenticate() {
      const code = new URL(location.href).searchParams.get("code");
      if (!code) { setMessage("O retorno do Google está incompleto. Inicie o acesso novamente."); return; }
      const client = createClient();
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!active) return;
      if (error) { setMessage("Não foi possível validar o acesso com o Google. Inicie novamente."); return; }
      const { data } = await client.auth.getUser();
      if (!active) return;
      if (data.user?.app_metadata?.role !== "admin") {
        await client.auth.signOut();
        setMessage("Esta conta Google não possui acesso editorial.");
        return;
      }
      location.replace("/admin");
    }
    void authenticate();
    return () => { active = false; };
  }, []);
  return <main id="conteudo" className="site-shell section"><p role="status">{message}</p><Link href="/admin/login" className="button">Voltar ao acesso</Link></main>;
}
