/* eslint-disable @next/next/no-img-element */
import Link from "../../../components/safe-link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { XpImageFrame } from "@/components/xp-image-frame";
import { demoWorks } from "@/lib/content";
import { loadWork, publicClient, safeMediaUrl } from "@/lib/archive";
import { formatBrlFromCents } from "@/lib/currency";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const work = await loadWork(slug);
  const demo = work ? undefined : demoWorks.find((item) => item.slug === slug);

  if (!work && !demo) notFound();

  const title = work?.title || demo!.title;
  const image = safeMediaUrl(work?.cover_url || null);
  const media = work
    ? (await publicClient()
        .from("work_media")
        .select("url,alt_text")
        .eq("work_id", work.id)
        .order("position")).data || []
    : [];
  const seenMedia = new Set(image ? [image] : []);
  const galleryMedia = media.flatMap((item) => {
    const url = safeMediaUrl(item.url);
    if (!url || seenMedia.has(url)) return [];
    seenMedia.add(url);
    return [{ ...item, url }];
  });
  const materials = work?.materials.length
    ? work.materials
    : [demo?.material || "Material em coleta"];
  const categories =
    work?.work_categories
      ?.map((item) => item.categories?.name)
      .filter((category): category is string => Boolean(category)) || [];

  return (
    <main id="conteudo">
      <section className="section grid-noise work-detail-section">
        <div className="site-shell work-detail-shell">
          <Link className="text-link mono" href="/trabalhos">
            ÃƒÂ¢Ã¢â‚¬Â Ã‚Â Todos os trabalhos
          </Link>

          {demo && (
            <p className="demo-note">
              Estudo demonstrativo Ãƒâ€šÃ‚Â· objeto e autoria aguardam registro real
            </p>
          )}

          <div className="work-detail-layout">
            <div className="work-detail-media">
              <XpImageFrame
                className="xp-image-frame--work"
                label="registro_do_trabalho.webp"
                status={`${title} ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ visualizaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o 100%`}
              >
                {image ? (
                  <img
                    className="work-detail-cover"
                    src={image}
                    alt={title}
                    decoding="async"
                    fetchPriority="high"
                  />
                ) : (
                  <div
                    className="card-visual work-detail-cover work-detail-placeholder"
                    data-code="imagem pendente"
                  />
                )}
              </XpImageFrame>

              {galleryMedia.length > 0 && (
                <section className="work-detail-gallery" aria-labelledby="gallery-title">
                  <div className="work-detail-gallery-heading">
                    <p className="eyebrow" id="gallery-title">
                      Registros complementares
                    </p>
                    <span className="mono">{String(galleryMedia.length).padStart(2, "0")} arquivos</span>
                  </div>
                  <div className="media-gallery">
                    {galleryMedia.map((item, index) => (
                      <figure key={item.url}>
                        <XpImageFrame
                          className="xp-image-frame--gallery"
                          label={`detalhe_${String(index + 1).padStart(2, "0")}.webp`}
                          status={item.alt_text || `Detalhe de ${title}`}
                        >
                          <img
                            src={item.url}
                            alt={item.alt_text || `Detalhe de ${title}`}
                            loading="lazy"
                            decoding="async"
                          />
                        </XpImageFrame>
                        {item.alt_text && <figcaption>{item.alt_text}</figcaption>}
                      </figure>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <article className="work-detail-copy">
              <p className="eyebrow">Registro material / {work?.year || "em coleta"}</p>
              <h1>{title}</h1>

              <p className="work-detail-description">
                {work?.description ||
                  "EspaÃƒÆ’Ã‚Â§o reservado ÃƒÆ’Ã‚Â  histÃƒÆ’Ã‚Â³ria da peÃƒÆ’Ã‚Â§a, ao processo e ÃƒÆ’Ã‚Â s escolhas de quem a produziu."}
              </p>

              <dl className="work-detail-record">
                <div>
                  <dt>Materialidade</dt>
                  <dd>{materials.join(" Ãƒâ€šÃ‚Â· ")}</dd>
                </div>
                <div>
                  <dt>Ano</dt>
                  <dd>{work?.year || "Em coleta"}</dd>
                </div>
                <div>
                  <dt>PreÃƒÆ’Ã‚Â§o</dt>
                  <dd>{formatBrlFromCents(work?.price_cents)}</dd>
                </div>
                <div>
                  <dt>Envio / retirada</dt>
                  <dd>{work?.shipping_details || "A combinar com o artesÃƒÆ’Ã‚Â£o"}</dd>
                </div>
                {categories.length > 0 && (
                  <div className="work-detail-record-wide">
                    <dt>TerritÃƒÆ’Ã‚Â³rio de fazer</dt>
                    <dd className="work-detail-chips">
                      {categories.map((category) => (
                        <span className="chip" key={category}>
                          {category}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>

              {work?.artisans && (
                <Link className="button primary work-detail-author" href={`/artesaos/${work.artisans.slug}`}>
                  Conhecer {work.artisans.name} ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â€
                </Link>
              )}

              <p className="mono work-detail-index">Objeto catalogado / InovArt Varginha ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â MG</p>
            </article>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
