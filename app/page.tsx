import Link from "../components/safe-link";
import { Hero } from "@/components/hero";
import { Footer } from "@/components/footer";
import { Window } from "@/components/window";
import { LiveArchive } from "@/components/live-archive";
import { SplineArtifact } from "@/components/spline-artifact";
export default function Home() {
  return <main id="conteudo"><Hero />
    <section className="section"><div className="site-shell"><div className="section-head"><div><p className="eyebrow">01 / pessoas & ofícios</p><h2>Arquivo<br />humano.</h2></div><p>Um espaço editorial para reconhecer quem faz, como faz e o que cada prática conta sobre a cidade.</p></div><LiveArchive kind="artisans" featured /><div className="section-action"><Link className="button" href="/artesaos">Ver todos os artesãos →</Link></div><SplineArtifact scene="orbita" label="Órbita viva do arquivo artesanal" className="spline-artifact--home" /></div></section>
    <section className="section"><div className="site-shell"><div className="section-head"><div><p className="eyebrow">02 / matéria em movimento</p><h2>Trabalhos.</h2></div><p>Peças, processos e experimentos documentados como cultura material — com autoria, contexto e técnica.</p></div><LiveArchive kind="works" featured /><div className="section-action"><Link className="button" href="/trabalhos">Abrir inventário →</Link></div></div></section>
    <section className="section"><div className="site-shell"><Window label="chamada_publica.txt"><div className="callout"><div><p className="eyebrow">O arquivo cresce com a cidade</p><h2 className="display">Seu fazer<br />também conta.</h2></div><div><p>É artesão ou artesã de Varginha? Envie sua história e até três trabalhos para avaliação editorial.</p><Link className="button primary" href="/participar">Começar envio →</Link></div></div></Window></div></section>
    <Footer /></main>;
}
