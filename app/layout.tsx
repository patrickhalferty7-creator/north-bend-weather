import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "North Bend Viticulture Climate Dashboard",
  description:
    "Growing-season climate dashboard for North Bend, WA with Willamette Valley and Burgundy comparisons."
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
