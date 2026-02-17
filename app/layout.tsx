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

export const metadata: Metadata = {
  title: "MarkIt — Bookmark Manager",
  description:
    "A simple, real-time bookmark manager. Save your favorite links and access them from anywhere.",
  icons: {
    icon: "/bookmark.png",
    shortcut: "/bookmark.png",
    apple: "/bookmark.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[#0a0a0f] font-sans text-white antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
