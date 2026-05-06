import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Super Admin Settings",
  description: "Secure area for GPSERP Super Administrators to manage settings.",
};

export default function AdminSuperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
