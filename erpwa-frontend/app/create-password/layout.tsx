import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Password",
  description: "Set up your password for your GPSERP account.",
};

export default function CreatePasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
