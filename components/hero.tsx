"use client";

import Link from "next/link";
import { motion, MotionConfig } from "motion/react";
import { ArchiveReliquary } from "./archive-reliquary";
import { Window } from "./window";

export function Hero() {
  return (
    <MotionConfig reducedMotion="user">
      <section className="hero grid-noise" aria-labelledby="hero-title">
        <div className="site-shell hero-grid">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <p className="eyebrow">Arquivo tecnoartesanal · 21°33′S 45°26′W</p>
            <h1 id="hero-title" className="display">Mãos que<br /><em>guardam</em><br />o futuro.</h1>
            <p className="lead">Uma cartografia viva dos ofícios, materiais e histórias que atravessam Varginha.</p>
            <div className="actions">
              <Link className="button primary" href="/artesaos">Explorar arquivo →</Link>
              <Link className="button" href="/participar">Enviar meu trabalho</Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, rotate: 2, x: 20 }}
            animate={{ opacity: 1, rotate: -1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.12 }}
          >
            <Window label="registro_visual.exe">
              <ArchiveReliquary />
              <div className="meta mono"><span>status: arquivo aberto</span><span>objeto: 3d.01</span></div>
            </Window>
          </motion.div>
        </div>
      </section>
    </MotionConfig>
  );
}
