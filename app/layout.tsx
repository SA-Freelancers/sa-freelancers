import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export const metadata = {
  title: "Freelance Hub SA | South Africa's Trusted Freelance Marketplace",
  description:
    "Freelance Hub SA connects South African businesses with skilled freelancers across engineering, drafting, design, development, writing, marketing and more.",
  keywords: [
    "South African freelancers",
    "freelance marketplace South Africa",
    "hire freelancers",
    "find freelance jobs",
    "engineering freelancers",
    "CAD drafting freelancers",
    "web development freelancers",
  ],
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
        <Navbar />
        <main className="main-wrapper">{children}</main>
        <Footer />
      </body>
    </html>
  );
}