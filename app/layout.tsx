import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// --- CONFIGURAÇÃO DE METADADOS E COMPARTILHAMENTO ---
export const metadata: Metadata = {
  // Título e descrição que aparecem no Google
  title: "Miza DJ - Ultra Luxury Events",
  description: "O Maestro das Frequências. Especialista em Casamentos, 15 Anos e Eventos Sociais de Luxo.",
  
  // Configuração para WhatsApp, Facebook, LinkedIn, etc.
  openGraph: {
    title: "Miza DJ - Ultra Luxury Events",
    description: "Transforme seu evento em uma experiência épica. Clique para ver a agenda e solicitar orçamento.",
    url: "https://mizadjeventos.com.br", // IMPORTANTE: Coloque o link real do seu site aqui (se já tiver o domínio)
    siteName: "Miza DJ",
    images: [
      {
        url: "/thumb-miza.jpg", // Certifique-se de que essa foto está na pasta 'public'
        width: 1200,
        height: 630,
        alt: "Foto do DJ Miza em evento",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}