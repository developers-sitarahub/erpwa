import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Access the GPSERP Admin dashboard.",
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
