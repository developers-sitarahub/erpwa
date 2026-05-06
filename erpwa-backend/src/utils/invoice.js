import prisma from "../prisma.js";

/**
 * Generate a unique sequential invoice number.
 * Format: INV-YYYYMMDD-NNNN
 */
export async function generateInvoiceNumber() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ""); // 20260313

  // Count existing invoices for today to get sequential number
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const count = await prisma.vendorPayment.count({
    where: {
      invoiceNumber: { not: null },
      invoiceDate: { gte: todayStart, lt: todayEnd },
    },
  });

  const seq = String(count + 1).padStart(4, "0");
  return `INV-${dateStr}-${seq}`;
}

/**
 * Populate invoice fields on a VendorPayment record after payment capture.
 */
export async function createInvoice({ paymentId, vendorId, planName, planDuration, amount, currency, taxAmount = 0 }) {
  const invoiceNumber = await generateInvoiceNumber();

  // Get vendor + owner details for billing info
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { name: true },
  });

  const owner = await prisma.user.findFirst({
    where: { vendorId, role: "vendor_owner" },
    select: { name: true, email: true },
  });

  const updated = await prisma.vendorPayment.update({
    where: { id: paymentId },
    data: {
      invoiceNumber,
      invoiceDate: new Date(),
      billingName: vendor?.name || owner?.name || "Customer",
      billingEmail: owner?.email || null,
      planName,
      planDuration,
      taxAmount,
    },
  });

  console.log(`🧾 Invoice ${invoiceNumber} generated for vendor ${vendorId} — ${planName} (${currency} ${amount})`);
  return updated;
}
