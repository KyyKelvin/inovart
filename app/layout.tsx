import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { WebMcp } from "@/components/webmcp";
import "./globals.css";
import "./refinements.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://inovart-varginha.kelvinky-augusto.chatgpt.site"),
  title: { default: "InovArt - Arquivo tecnoartesanal", template: "%s - InovArt" },
  description: "Uma cartografia viva de artesãos, técnicas e trabalhos de Varginha.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>
        <SiteHeader />
        {children}
        <WebMcp />
      </body>
    </html>
  );
}
