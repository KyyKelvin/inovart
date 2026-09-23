/* eslint-disable @next/next/no-img-element */
import Link from "../../../components/safe-link";
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
  return <main id="conteudo"><section className="section grid-noise artisan-profile-section"><div className="site-shell artisan-profile-shell">
    <Link className="text-link mono" href="/artesaos">ÃƒÂ¢Ã¢â‚¬Â Ã‚Â Todos os artesÃƒÆ’Ã‚Â£os</Link>
    {demo && <p className="demo-note">Perfil demonstrativo Ãƒâ€šÃ‚Â· nome e imagem aguardam registro real</p>}
    <div className="profile-layout artisan-profile-layout">
      <Window label="retrato_autorizado.webp" className="artisan-profile-window">{image ? <img className="profile-image artisan-profile-image" src={image} alt={`Retrato de ${name}`} decoding="async" /> : <div className="card-visual profile-placeholder artisan-profile-placeholder" data-code="imagem pendente" />}</Window>
      <div className="profile-copy"><p className="eyebrow">{artisan?.region_withheld ? "RegiÃƒÆ’Ã‚Â£o nÃƒÆ’Ã‚Â£o informada" : artisan?.neighborhood || "Varginha Ãƒâ€šÃ‚Â· MG"}</p><h1>{name}</h1><p className="craft-label">{artisan?.craft || demo!.craft}</p><p className="preserve-lines">{artisan?.bio || "Este perfil demonstra como a trajetÃƒÆ’Ã‚Â³ria, os materiais e o territÃƒÆ’Ã‚Â³rio serÃƒÆ’Ã‚Â£o apresentados. A histÃƒÆ’Ã‚Â³ria real serÃƒÆ’Ã‚Â¡ publicada apÃƒÆ’Ã‚Â³s consentimento e revisÃƒÆ’Ã‚Â£o editorial."}</p>
        {artisan?.quote && <blockquote>ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ{artisan.quote}ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â</blockquote>}
        {channels.length > 0 && <div className="actions">{channels.map(c => {
          const href = c.kind === "email" ? `mailto:${c.value.replace(/[\r\n]/g, "")}` : c.kind === "phone" ? `tel:${c.value.replace(/[^+0-9]/g, "")}` : `https://instagram.com/${encodeURIComponent(c.value.replace(/^@/, ""))}`;
          return <a key={c.kind} className="button" href={href} rel="noopener noreferrer">{c.kind === "instagram" ? "Instagram ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â€" : c.value}</a>;
        })}</div>}
      </div>
    </div>
    {works.length > 0 && <section className="section"><p className="eyebrow">Trabalhos do arquivo</p><div className="cards">{works.map(w => <Link href={`/trabalhos/${w.slug}`} key={w.id} className="card">{safeMediaUrl(w.cover_url) ? <div className="media-frame"><img src={safeMediaUrl(w.cover_url)!} alt={w.title} loading="lazy" decoding="async" /></div> : <div className="card-visual" />}<h2>{w.title}</h2><p>{w.materials.join(" Ãƒâ€šÃ‚Â· ")}</p></Link>)}</div></section>}
  </div></section><Footer /></main>;
}
