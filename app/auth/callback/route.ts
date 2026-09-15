import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    // Sem code — redireciona de volta ao login com erro
    return NextResponse.redirect(
      `${origin}/admin/login?error=link_invalido`
    );
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession falhou:", error.message);
    return NextResponse.redirect(
      `${origin}/admin/login?error=link_expirado`
    );
  }

  // Sessão criada com sucesso — redireciona para o painel admin
  return NextResponse.redirect(`${origin}/admin`);
}
