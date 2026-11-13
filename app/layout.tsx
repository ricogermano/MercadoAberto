import type { Metadata } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import {Toaster} from "@/components/ui/sonner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

// The Latin display face has no Arabic glyphs. Only Arabic pages use this one (see globals.css),
// so it isn't preloaded on the rest.
const arabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  preload: false,
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "MercadoAberto",
  description: "Bolsa brasileira, commodities e mercados globais em um só painel. Código aberto. Conteúdo informativo, não é recomendação de investimento.",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR" className="dark" suppressHydrationWarning>
            <body
                className={`${jakarta.variable} ${arabic.variable} ${plexMono.variable} font-sans antialiased`}
            >
                {children}
                <Toaster/>
                <Analytics />
            </body>
        </html>
    );
}
