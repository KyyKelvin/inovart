/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Window } from "@/components/window";
import { demoArtisans } from "@/lib/content";
import { loadArtisan, publicClient, safeMediaUrl, type Work } from "@/lib/archive";
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artisan = await loadArtisan(slug);
  const demo = artisan ? undefined : demoArtisans.find(x => x.slug === slug);
  if (!artisan && !demo) notFound();
  const name = artisan?.name || demo!.name;
  const image = safeMediaUrl(artisan?.portrait_url || null);
  let works: Work[] = [];
  let channels: { kind: string; value: string }[] = [];
  if (artisan) {
    const client = publicClient();
    const [w, c] = await Promise.all([
      client.from("works").select("*").eq("artisan_id", artisan.id).eq("status", "published"),
      client.from("public_contact_channels").select("kind,value").eq("artisan_id", artisan.id),
    ]);
    works = (w.data || []) as Work[];
    channels = c.data || [];
  }
  return <main id="conteudo"><section className="section grid-noise"><div className="site-shell">
    <Link className="text-link mono" href="/artesaos">← Todos os artesãos</Link>
    {demo && <p className="demo-note">Perfil demonstrativo · nome e imagem aguardam registro real</p>}
    <div className="profile-layout">
      <Window label="retrato_autorizado.webp">{image ? <img className="profile-image" src={image} alt={`Retrato de ${name}`} decoding="async" /> : <div className="card-visual profile-placeholder" data-code="imagem pendente" />}</Window>
      <div className="profile-copy"><p className="eyebrow">{artisan?.neighborhood || "Varginha · MG"}</p><h1>{name}</h1><p className="craft-label">{artisan?.craft || demo!.craft}</p><p className="preserve-lines">{artisan?.bio || "Este perfil demonstra como a trajetória, os materiais e o território serão apresentados. A história real será publicada após consentimento e revisão editorial."}</p>
        {artisan?.quote && <blockquote>“{artisan.quote}”</blockquote>}
        {channels.length > 0 && <div className="actions">{channels.map(c => {
          const href = c.kind === "email" ? `mailto:${c.value.replace(/[\r\n]/g, "")}` : c.kind === "phone" ? `tel:${c.value.replace(/[^+0-9]/g, "")}` : `https://instagram.com/${encodeURIComponent(c.value.replace(/^@/, ""))}`;
          return <a key={c.kind} className="button" href={href} rel="noopener noreferrer">{c.kind === "instagram" ? "Instagram ↗" : c.value}</a>;
        })}</div>}
      </div>
    </div>
    {works.length > 0 && <section className="section"><p className="eyebrow">Trabalhos do arquivo</p><div className="cards">{works.map(w => <Link href={`/trabalhos/${w.slug}`} key={w.id} className="card">{safeMediaUrl(w.cover_url) ? <div className="media-frame"><img src={safeMediaUrl(w.cover_url)!} alt={w.title} loading="lazy" decoding="async" /></div> : <div className="card-visual" />}<h2>{w.title}</h2><p>{w.materials.join(" · ")}</p></Link>)}</div></section>}
  </div></section><Footer /></main>;
}
