import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import NextAuthProvider from "@/components/auth/NextAuthProvider";
import LenisProvider from "@/components/LenisProvider";
import SmoothCursorProvider from "@/components/SmoothCursorProvider";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MaintainerMind — Long-Term Memory for Repositories",
  description:
    "Integrate long-term cognitive knowledge-graph memory directly into your repository with Cognee Cloud.",
  icons: {
    icon: [
      { url: "/maintainermind.png", type: "image/png" },
    ],
    apple: "/maintainermind.png",
    shortcut: "/maintainermind.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${outfit.variable} ${geistMono.variable} antialiased bg-[#0d1117] text-[#e6edf3] font-sans`}
      >
        <NextAuthProvider>
          <SmoothCursorProvider />
          <LenisProvider>{children}</LenisProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
