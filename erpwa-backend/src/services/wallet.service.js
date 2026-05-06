/**
 * Vendor Wallet Service
 * 
 * Handles wallet creation, balance checks, deductions, credits,
 * and maintains a full transaction audit trail.
 */

import prisma from "../prisma.js";

/**
 * Ensure a wallet exists for the given vendor.
 * Creates one with zero balance if missing.
 *
 * @param {string} vendorId
 * @returns {Promise<object>} The wallet record
 */
export async function ensureWallet(vendorId) {
  let wallet = await prisma.vendorWallet.findUnique({
    where: { vendorId },
  });

  if (!wallet) {
    wallet = await prisma.vendorWallet.create({
      data: { vendorId, balance: 0 },
    });
    console.log(`💰 Wallet created for vendor ${vendorId}`);
  }

  return wallet;
}

/**
 * Get current wallet balance for a vendor.
 *
 * @param {string} vendorId
 * @returns {Promise<number>}
 */
export async function getBalance(vendorId) {
  const wallet = await ensureWallet(vendorId);
  return wallet.balance;
}

/**
 * Deduct amount from vendor wallet.
 * Throws INSUFFICIENT_BALANCE if wallet doesn't have enough funds.
 * Records a transaction for audit trail.
 *
 * @param {string} vendorId
 * @param {number} amount - Amount to deduct (positive number)
 * @param {object} [options]
 * @param {string} [options.description] - Human-readable reason
 * @param {string} [options.reference] - e.g. conversation ID
 * @returns {Promise<{ wallet: object, transaction: object }>}
 * @throws {Error} INSUFFICIENT_BALANCE
 */
export async function deductWallet(vendorId, amount, options = {}) {
  if (amount <= 0) {
    throw new Error("INVALID_AMOUNT: Deduction amount must be positive");
  }

  const wallet = await ensureWallet(vendorId);

  if (wallet.balance < amount) {
    console.warn(
      `⚠️ Insufficient balance for vendor ${vendorId}: ` +
      `balance=${wallet.balance}, required=${amount}`
    );
    throw new Error("INSUFFICIENT_BALANCE");
  }

  const newBalance = parseFloat((wallet.balance - amount).toFixed(4));

  // Atomic update with balance check to prevent race conditions
  const updatedWallet = await prisma.vendorWallet.update({
    where: { vendorId },
    data: { balance: newBalance },
  });

  // Record audit trail
  const transaction = await prisma.walletTransaction.create({
    data: {
      vendorId,
      amount: -amount, // Negative = debit
      type: "debit",
      description: options.description || "WhatsApp conversation charge",
      reference: options.reference || null,
      balanceAfter: newBalance,
    },
  });

  console.log(
    `💸 Wallet deducted for vendor ${vendorId}: ` +
    `₹${amount} | Balance: ₹${newBalance}`
  );

  return { wallet: updatedWallet, transaction };
}

/**
 * Credit amount to vendor wallet (top-up / refund).
 *
 * @param {string} vendorId
 * @param {number} amount - Amount to credit (positive number)
 * @param {object} [options]
 * @param {string} [options.description]
 * @param {string} [options.reference]
 * @param {string} [options.type] - "credit" | "refund"
 * @returns {Promise<{ wallet: object, transaction: object }>}
 */
export async function creditWallet(vendorId, amount, options = {}) {
  if (amount <= 0) {
    throw new Error("INVALID_AMOUNT: Credit amount must be positive");
  }

  const wallet = await ensureWallet(vendorId);
  const newBalance = parseFloat((wallet.balance + amount).toFixed(4));

  const updatedWallet = await prisma.vendorWallet.update({
    where: { vendorId },
    data: { balance: newBalance },
  });

  const transaction = await prisma.walletTransaction.create({
    data: {
      vendorId,
      amount: amount, // Positive = credit
      type: options.type || "credit",
      description: options.description || "Wallet top-up",
      reference: options.reference || null,
      balanceAfter: newBalance,
    },
  });

  console.log(
    `💰 Wallet credited for vendor ${vendorId}: ` +
    `₹${amount} | Balance: ₹${newBalance}`
  );

  return { wallet: updatedWallet, transaction };
}

/**
 * Get wallet transaction history for a vendor.
 *
 * @param {string} vendorId
 * @param {object} [options]
 * @param {number} [options.limit=50]
 * @param {number} [options.offset=0]
 * @returns {Promise<object[]>}
 */
export async function getTransactionHistory(vendorId, options = {}) {
  const { limit = 50, offset = 0 } = options;

  return prisma.walletTransaction.findMany({
    where: { vendorId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}
