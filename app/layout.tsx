import "./globals.css";

import Navbar from "./components/Navbar";

export const metadata = {
  title: "SA Freelancers",
  description:
    "South African Freelance Marketplace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          backgroundColor: "#f9fafb",
        }}
      >
        <Navbar />

        {children}
      </body>
    </html>
  );
}