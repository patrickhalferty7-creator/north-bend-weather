import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wine Climate Atlas",
  description: "Compare your growing-season climate with famous wine regions across the globe."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
