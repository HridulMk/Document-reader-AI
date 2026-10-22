import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KnowBase AI — Chat with your documents",
  description: "A private, source-grounded AI knowledge assistant powered by RAG.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
