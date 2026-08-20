import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChitraKhata — Film Production Finance",
  description: "Budget and expense management for Telugu film productions",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
