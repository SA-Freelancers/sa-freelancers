import VersionRefresh from "./components/VersionRefresh";
import WhatsAppButton from "./components/WhatsAppButton";
import GoogleAnalytics from "./components/GoogleAnalytics";
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.freelancehubsa.co.za"),
  title: "Freelance Hub SA",
  description:
    "South Africa's trusted freelance marketplace. Find freelancers, hire talent, post jobs, manage contracts and grow your business.",
  icons: {
    icon: [
      { url: "/favicon.ico?v=6" },
      { url: "/favicon-48.png?v=6", type: "image/png", sizes: "48x48" },
      { url: "/icon-192.png?v=6", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png?v=6", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico?v=6",
    apple: "/apple-touch-icon.png?v=6",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
  <GoogleAnalytics />
  <VersionRefresh />
        <Navbar />
        <main className="main-wrapper">{children}</main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}