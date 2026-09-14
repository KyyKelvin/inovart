import { Footer } from "@/components/footer";
import { LiveArchive } from "@/components/live-archive";
export const metadata = { title: "Artesãos" };
export default function Page() { return <main id="conteudo"><section className="section grid-noise"><div className="site-shell"><div className="section-head"><div><p className="eyebrow">Índice 01 / arquivo humano</p><h1>Artesãos.</h1></div><p>Pessoas, ofícios e histórias do fazer manual em Varginha. Um arquivo que cresce a cada encontro.</p></div><LiveArchive kind="artisans" /></div></section><Footer /></main>; }
