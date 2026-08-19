import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Midnight Counter | Live Ledger",
  description: "Increment and read a Midnight on-chain counter in real time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased bg-[#07090f] text-foreground selection:bg-brand-amber/30`}
      >
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_55%)] opacity-70 pointer-events-none" />
        <div className="fixed inset-0 z-[-2] bg-[linear-gradient(145deg,rgba(5,8,20,1),rgba(6,12,26,1),rgba(3,6,14,1))] pointer-events-none" />
        {children}
      </body>
    </html>
  );
}
