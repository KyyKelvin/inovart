import Link from "../../../components/safe-link";

export default function CallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main id="conteudo" className="site-shell section">
      <p role="status">
        Processando seu link de acesso…
      </p>
      <Link href="/admin/login" className="button">
        Voltar ao acesso
      </Link>
    </main>
  );
}
