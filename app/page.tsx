import Link from "../components/safe-link";
import { Hero } from "@/components/hero";
import { Footer } from "@/components/footer";
import { Window } from "@/components/window";
import { LiveArchive } from "@/components/live-archive";
import { ModelArtifact } from "@/components/model-artifact";
export default function Home() {
  return <main id="conteudo"><Hero />
    <section className="section section--ornamented"><div className="site-shell"><div className="section-head"><div><p className="eyebrow">01 / pessoas & ofícios</p><h2>Arquivo<br />humano.</h2></div><p>Um espaço editorial para reconhecer quem faz, como faz e o que cada prática conta sobre a cidade.</p></div><LiveArchive kind="artisans" featured /><div className="section-action"><Link className="button" href="/artesaos">Ver todos os artesãos →</Link></div></div><ModelArtifact scene="metalSphere" label="Esfera abstrata de metal escuro" className="model-ornament model-ornament--sphere" /><ModelArtifact scene="metalCross" label="Cruz abstrata de metal escuro" className="model-ornament model-ornament--cross" /></section>
    <section className="section section--ornamented"><div className="site-shell"><div className="section-head"><div><p className="eyebrow">02 / matéria em movimento</p><h2>Trabalhos.</h2></div><p>Peças, processos e experimentos documentados como cultura material — com autoria, contexto e técnica.</p></div><LiveArchive kind="works" featured /><div className="section-action"><Link className="button" href="/trabalhos">Abrir inventário →</Link></div></div><ModelArtifact scene="metalCone" label="Cone abstrato de metal escuro" className="model-ornament model-ornament--cone" /><ModelArtifact scene="metalOrbit" label="Órbita abstrata de metal escuro" className="model-ornament model-ornament--orbit" /></section>
    <section className="section section--ornamented"><div className="site-shell"><Window label="chamada_publica.txt"><div className="callout"><div><p className="eyebrow">O arquivo cresce com a cidade</p><h2 className="display">Seu fazer<br />também conta.</h2></div><div><p>É artesão ou artesã de Varginha? Envie sua história e até três trabalhos para avaliação editorial.</p><Link className="button primary" href="/participar">Começar envio →</Link></div></div></Window></div><ModelArtifact scene="metalFrame" label="Estrutura abstrata de metal escuro" className="model-ornament model-ornament--frame" /><ModelArtifact scene="alien" label="Alienígena digital roxo em movimento" className="model-ornament model-ornament--alien" /></section>
    <Footer /></main>;
}
