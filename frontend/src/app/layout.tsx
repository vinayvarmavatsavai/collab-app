import type { Metadata, Viewport } from "next";
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
  title: "SphereNet",
  description: "Connect, collaborate, and grow with your innovation community",
  applicationName: "SphereNet",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-512.ico" },
      { url: "/icon-512.png", type: "image/png" },
    ],
    apple: "/icon-512.png",
    shortcut: "/icon-512.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SphereNet",
  },
};

export const viewport: Viewport = {
  themeColor: "#2D6BFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}