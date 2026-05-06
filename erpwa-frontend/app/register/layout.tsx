import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start Free Trial",
  description: "Create your GPSERP account to scale your WhatsApp messaging and streamline your business.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
