import type React from "react";
import type { Metadata } from "next";

import { ThemeProvider } from "@/context/theme-provider";
import { AuthProvider } from "@/context/authContext";
import { ToastContainer } from "react-toastify";
import { UploadProvider } from "@/context/GlobalUploadContext";
import "react-toastify/dist/ReactToastify.css";

import "./globals.css";

export const metadata: Metadata = {
  title: "GPSERP - WhatsApp Automation & ERP",
  description:
    "Enterprise Resource Planning & WhatsApp Automation. Unlock native flows, dual workflow engines, and interactive catalogs.",
  keywords:
    "GPSERP, WhatsApp Automation, ERP, CRM, WhatsApp Business API, Lead Management",
  openGraph: {
    title: "GPSERP - WhatsApp Automation & ERP",
    description:
      "The complete toolkit for modern businesses to scale their messaging on WhatsApp.",
    siteName: "GPSERP",
    type: "website",
  },
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
