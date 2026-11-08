import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/layout/sidebar";

export const metadata: Metadata = {
  title: "Bot Conversa - Plataforma de Chatbots Visuais",
  description: "Criação visual de chatbots com motor de execução independente e Evolution API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-background text-foreground antialiased min-h-screen flex selection:bg-indigo-500/30 selection:text-indigo-200">
        <Providers>
          <Sidebar />
          <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
