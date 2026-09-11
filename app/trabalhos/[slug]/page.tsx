/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Window } from "@/components/window";
import { demoWorks } from "@/lib/content";
import { loadWork, publicClient, safeMediaUrl } from "@/lib/archive";
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const work = await loadWork(slug);
  const demo = work ? undefined : demoWorks.find(x => x.slug === slug);
  if (!work && !demo) notFound();
  const title = work?.title || demo!.title;
  const image = safeMediaUrl(work?.cover_url || null);
  const media = work ? (await publicClient().from("work_media").select("url,alt_text").eq("work_id", work.id).order("position")).data || [] : [];
  return <main id="conteudo"><section className="section grid-noise"><div className="site-shell">
    <Link className="text-link mono" href="/trabalhos">← Todos os trabalhos</Link>
    {demo && <p className="demo-note">Estudo demonstrativo · objeto e autoria aguardam registro real</p>}
    <div className="section-head detail-head"><div><p className="eyebrow">Registro material / {work?.year || "em coleta"}</p><h1>{title}</h1></div><div><p>{work?.description || "Espaço reservado à história da peça, ao processo e às escolhas de quem a produziu."}</p><p className="mono">{work?.materials.join(" · ") || demo!.material}</p>{work?.artisans && <Link className="button" href={`/artesaos/${work.artisans.slug}`}>Por {work.artisans.name} ↗</Link>}</div></div>
    <Window label="registro_do_trabalho.webp">{image ? <img className="work-cover" src={image} alt={title} decoding="async" /> : <div className="card-visual work-cover" data-code="imagem pendente" />}</Window>
    {media.length > 0 && <div className="media-gallery">{media.filter(m => safeMediaUrl(m.url)).map(m => <figure key={m.url}><img src={m.url} alt={m.alt_text} loading="lazy" decoding="async" /><figcaption>{m.alt_text}</figcaption></figure>)}</div>}
  </div></section><Footer /></main>;
}
