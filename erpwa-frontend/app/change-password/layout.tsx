import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Change Password",
  description: "Update your password securely in GPSERP.",
};

export default function ChangePasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
