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
  title: "Townhall — Real-time Chat",
  description: "Real-time chat room application with channels, reactions, and presence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${inter.variable} ${newsreader.variable}`}
      >
        <body className="min-h-screen antialiased bg-white text-neutral-900 font-sans">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
