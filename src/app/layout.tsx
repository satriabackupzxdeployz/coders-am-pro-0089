import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Premium Access Portal",
  description: "Secure Premium Account Management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <div className="grid-bg" />
        {children}
      </body>
    </html>
  );
}
