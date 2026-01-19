import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { MobileSidebarProvider } from "@/lib/MobileSidebarContext";
import { ThemeProvider } from "@/lib/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MorehGuide",
  description: "Braude College AI Assistant",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        // FIX: Default is Light (gray-50/gray-900), Dark is Brand (brand-dark/brand-cream)
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100 text-gray-900 dark:bg-brand-dark dark:text-brand-cream h-screen flex flex-col transition-colors duration-300`}
      >
        <ThemeProvider>
          <MobileSidebarProvider>
            <Navbar />
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {children}
            </div>
          </MobileSidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
