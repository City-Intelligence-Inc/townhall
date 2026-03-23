import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Townhall — Real-time team communication",
  description: "Townhall by City Intelligence. Where teams come together to communicate in real time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} ${newsreader.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col bg-white text-neutral-900 font-sans">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
