import type React from "react";
import type { Metadata } from "next";

import { ThemeProvider } from "@/context/theme-provider";
import { AuthProvider } from "@/context/authContext";
import { ToastContainer } from "react-toastify";
import { UploadProvider } from "@/context/GlobalUploadContext";
import "react-toastify/dist/ReactToastify.css";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | GPSERP",
    default: "GPSERP - WhatsApp Automation & ERP",
  },
  description:
    "Enterprise Resource Planning & WhatsApp Automation. Unlock native flows, dual workflow engines, and interactive catalogs.",
  keywords: [
    "GPSERP",
    "WhatsApp Automation",
    "ERP",
    "CRM",
    "WhatsApp Business API",
    "Lead Management",
    "Customer Support",
    "Interactive Catalogs",
    "Native Flows",
  ],
  authors: [{ name: "GPSERP" }],
  creator: "GPSERP",
  openGraph: {
    title: {
      template: "%s | GPSERP",
      default: "GPSERP - WhatsApp Automation & ERP",
    },
    description:
      "The complete toolkit for modern businesses to scale their messaging on WhatsApp.",
    siteName: "GPSERP",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: {
      template: "%s | GPSERP",
      default: "GPSERP - WhatsApp Automation & ERP",
    },
    description:
      "The complete toolkit for modern businesses to scale their messaging on WhatsApp.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon_io/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon_io/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon_io/favicon.ico",
    apple: "/favicon_io/apple-touch-icon.png",
  },
  manifest: "/favicon_io/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            <UploadProvider>{children}</UploadProvider>
          </AuthProvider>

          {/* ✅ Global Toast Container (theme-aware) */}
          <ToastContainer
            position="top-center"
            autoClose={6000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            draggable
            toastClassName="toast-base"
            progressClassName="toast-progress"
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
