import VersionRefresh from "./components/VersionRefresh";
import WhatsAppButton from "./components/WhatsAppButton";
import GoogleAnalytics from "./components/GoogleAnalytics";

import type {
  ReactNode,
} from "react";

import type {
  Metadata,
  Viewport,
} from "next";

import "./globals.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export const metadata: Metadata = {
  metadataBase:
    new URL(
      "https://www.freelancehubsa.co.za"
    ),

  title:
    "Freelance Hub SA",

  description:
    "South Africa's trusted freelance marketplace. Find freelancers, hire talent, post jobs, manage contracts and grow your business.",

  icons: {
    icon: [
      {
        url: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],

    shortcut:
      "/icon.png",

    apple:
      "/icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
  themeColor: "#020617",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="en"
      className="dark"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var savedTheme =
                    localStorage.getItem("theme");

                  /*
                   * First visit defaults to DARK.
                   * Existing saved preference is respected.
                   */
                  if (savedTheme === "light") {
                    document.documentElement
                      .classList.remove("dark");
                  } else {
                    document.documentElement
                      .classList.add("dark");
                  }
                } catch (error) {
                  document.documentElement
                    .classList.add("dark");
                }
              })();
            `,
          }}
        />
      </head>

      <body>
        <GoogleAnalytics />

        <VersionRefresh />

        <Navbar />

        <main className="main-wrapper">
          {children}
        </main>

        <Footer />

        <WhatsAppButton />
      </body>
    </html>
  );
}