"use client";
import Link from "../../../components/safe-link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
export default function Callback() {
  const [message, setMessage] = useState("Validando seu link de acesso…");
  useEffect(() => {
    let active = true;
    async function authenticate() {
      const code = new URL(location.href).searchParams.get("code");
      if (!code) { setMessage("O link está incompleto ou expirou. Solicite um novo acesso."); return; }
      const { error } = await createClient().auth.exchangeCodeForSession(code);
      if (!active) return;
      if (error) setMessage("Este link expirou ou já foi usado. Solicite outro.");
      else location.replace("/admin");
    }
    void authenticate();
    return () => { active = false; };
  }, []);
  return <main id="conteudo" className="site-shell section"><p role="status">{message}</p><Link href="/admin/login" className="button">Voltar ao acesso</Link></main>;
}
