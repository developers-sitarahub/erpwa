import { redirect } from "next/navigation";

export default function VendorsIndexPage() {
  redirect("/admin-super/vendors/requested");
}
