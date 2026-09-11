/* eslint-disable @next/next/no-img-element */
"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { publicClient, safeMediaUrl, type Artisan, type Work } from "@/lib/archive";
import { categoryNames, demoArtisans, demoWorks } from "@/lib/content";

type Card = { slug: string; title: string; subtitle: string; place: string; image: string | null; categories: { slug: string; name: string }[] };

function ArchiveCard({ item, index, kind }: { item: Card; index: number; kind: "artisans" | "works" }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const frameRef = useRef(0);
  const pointRef = useRef({ x: 0, y: 0 });

  useEffect(() => () => window.cancelAnimationFrame(frameRef.current), []);

  const handlePointerMove = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointRef.current = {
      x: (event.clientX - bounds.left) / bounds.width - 0.5,
      y: (event.clientY - bounds.top) / bounds.height - 0.5,
    };
    if (frameRef.current) return;
    frameRef.current = window.requestAnimationFrame(() => {
      const card = cardRef.current;
      const point = pointRef.current;
      if (card) {
        card.style.setProperty("--card-rx", `${point.y * -7}deg`);
        card.style.setProperty("--card-ry", `${point.x * 9}deg`);
        card.style.setProperty("--card-light-x", `${(point.x + 0.5) * 100}%`);
        card.style.setProperty("--card-light-y", `${(point.y + 0.5) * 100}%`);
      }
      frameRef.current = 0;
    });
  };

  const resetTilt = () => {
    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    cardRef.current?.style.setProperty("--card-rx", "0deg");
    cardRef.current?.style.setProperty("--card-ry", "0deg");
  };

  return (
    <Link
      ref={cardRef}
      className="card depth-card"
      href={`/${kind === "artisans" ? "artesaos" : "trabalhos"}/${item.slug}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
    >
      {item.image ? (
        <div className="media-frame"><img src={item.image} alt={kind === "artisans" ? `Retrato de ${item.title}` : item.title} loading="lazy" decoding="async" /></div>
      ) : (
        <div
          className="card-visual"
          data-code={`${kind === "artisans" ? "ARQ" : "OBJ"}.${String(index + 1).padStart(2, "0")}`}
          style={{ background: index % 3 === 1 ? "#2347ff" : index % 3 === 2 ? "#55f58a" : "#eae6da", "--tilt": `${index % 2 ? 7 : -7}deg` } as CSSProperties}
        />
      )}
      <div className="card-copy"><span className="chip">{item.place}</span><h3>{item.title}</h3><p>{item.subtitle}</p><span className="card-arrow" aria-hidden="true">↗</span></div>
    </Link>
  );
}

export function LiveArchive({ kind, featured = false }: { kind: "artisans" | "works"; featured?: boolean }) {
  const [items, setItems] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    const client = publicClient();
    const selection = kind === "artisans" ? "*,artisan_categories(categories(id,name,slug))" : "*,artisans(name,slug),work_categories(categories(id,name,slug))";
    client.from(kind).select(selection).eq("status", "published").order("featured", { ascending: false }).order("published_at", { ascending: false }).limit(featured ? 3 : 100).then(({ data, error }) => {
      if (!active) return;
      if (error) { setError("Não foi possível consultar o arquivo. Tente novamente."); setLoading(false); return; }
      setError("");
      const mapped = kind === "artisans"
        ? (data as unknown as Artisan[]).map(x => ({ slug: x.slug, title: x.name, subtitle: x.craft, place: x.neighborhood || "Varginha · MG", image: safeMediaUrl(x.portrait_url), categories: x.artisan_categories?.flatMap(c => c.categories ? [{ slug: c.categories.slug, name: c.categories.name }] : []) || [] }))
        : (data as unknown as Work[]).map(x => ({ slug: x.slug, title: x.title, subtitle: x.materials.join(" · "), place: x.artisans?.name || "Varginha · MG", image: safeMediaUrl(x.cover_url), categories: x.work_categories?.flatMap(c => c.categories ? [{ slug: c.categories.slug, name: c.categories.name }] : []) || [] }));
      setItems(mapped); setLoading(false);
    });
    return () => { active = false; };
  }, [kind, attempt, featured]);
  const fallback = useMemo<Card[]>(() => kind === "artisans"
    ? demoArtisans.map(x => ({ slug: x.slug, title: x.name, subtitle: x.craft, place: x.place, image: null, categories: [{ slug: x.category, name: categoryNames[x.category] || x.category }] }))
    : demoWorks.map(x => ({ slug: x.slug, title: x.title, subtitle: x.material, place: "Estudo de composição", image: null, categories: [{ slug: x.category, name: categoryNames[x.category] || x.category }] })), [kind]);
  const shown = useMemo(() => items.length ? items : fallback, [items, fallback]);
  const availableCategories = useMemo(() => Array.from(new Map(shown.flatMap(item => item.categories).map(item => [item.slug, item.name])).entries()), [shown]);
  const normalized = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const filtered = useMemo(() => shown.filter(x =>
    (!category || x.categories.some(item => item.slug === category)) &&
    `${x.title} ${x.subtitle} ${x.place}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(normalized)
  ), [shown, category, normalized]);
  if (error) return <div className="window form-padding"><p role="alert">{error}</p><button className="button" onClick={() => { setError(""); setLoading(true); setAttempt(attempt + 1); }}>Tentar novamente</button></div>;
  if (loading) return <div className="archive-loading" role="status">Consultando o arquivo…</div>;
  const cards = featured ? filtered.slice(0, 3) : filtered;
  return <>
    {!items.length && <p className="demo-note">Acervo em formação · exemplos de layout, sem pessoas reais cadastradas</p>}
    {!featured && <div className="archive-controls">
      <div className="field"><label htmlFor="archive-search">Buscar no arquivo</label><input id="archive-search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Nome, técnica ou material" /></div>
      <div className="field"><label htmlFor="archive-category">Técnica</label><select id="archive-category" value={category} onChange={e => setCategory(e.target.value)}><option value="">Todas as técnicas</option>{availableCategories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      <p className="mono result-count" role="status">{filtered.length} {items.length ? "registros" : "exemplos"}</p>
    </div>}
    <div className="cards archive-cards">{cards.map((item, index) => <ArchiveCard item={item} index={index} kind={kind} key={item.slug} />)}</div>
    {!cards.length && <div className="window form-padding"><p>Nenhum registro encontrado para esta busca.</p><button className="button" onClick={() => { setQuery(""); setCategory(""); }}>Limpar filtros</button></div>}
  </>;
}
