import GoogleAnalytics from "./components/GoogleAnalytics";
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export const metadata = {
  title: "Freelance Hub SA | South Africa's Trusted Freelance Marketplace",
description:
  "Find freelancers, hire talent and grow your business with Freelance Hub SA.",
  keywords: [
    "South African freelancers",
    "freelance marketplace South Africa",
    "hire freelancers",
    "find freelance jobs",
    "engineering freelancers",
    "CAD drafting freelancers",
    "web development freelancers",
  ],
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
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
        <Navbar />
        <main className="main-wrapper">{children}</main>
        <Footer />
      </body>
    </html>
  );
}