import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/layout/header";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ITI Virtual Electrical Practical Lab",
  description:
    "Practice ITI Electrician 2nd-year syllabus practicals at home - build virtual circuits, simulate, and learn.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col bg-zinc-50 font-sans text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        <Header />
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
