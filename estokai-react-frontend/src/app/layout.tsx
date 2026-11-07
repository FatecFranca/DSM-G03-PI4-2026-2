import type { Metadata } from "next";
import { ReactNode } from "react";
import { Inter, Rajdhani } from "next/font/google";
import "./globals.css";
import { LayoutWrapper } from "@/components/layoutWrapper";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider"; 

const inter = Inter({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-inter",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-rajdhani",
});

export const metadata: Metadata = {
  title: "Estokaí — Controle de Estoque Inteligente",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${rajdhani.variable}`}
      suppressHydrationWarning 
    >
      <body
        className={`
          ${inter.className}
          bg-background
          text-foreground
          antialiased
          transition-colors duration-300
        `}
      >
        {/* Envolva a aplicação com o ThemeProvider indicando a classe 'dark' */}
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
          <Toaster richColors closeButton position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
