import { AuthProvider } from "@/contexts/AuthContext";
import { LayoutProvider } from "@/contexts/LayoutContext";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RUET Hall Management",
  description: "Hall management system for RUET",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased pb-16 md:pb-0`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <LayoutProvider>{children}</LayoutProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
