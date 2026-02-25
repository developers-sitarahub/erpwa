import prisma from "../../prisma.js";
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/token.js";
import { hashToken } from "../../utils/hash.js";

/* ================= LOGIN ================= */

export async function login(email, password) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      vendor: {
        select: {
          subscriptionEnd: true,
          subscriptionStart: true,
          whatsappStatus: true,
        },
      },
    },
  });
  if (!user) throw new Error("Invalid credentials");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error("Invalid credentials");

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  await prisma.$transaction([
    prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
    prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  return { accessToken, refreshToken, user };
}

/* ================= REFRESH ================= */

export async function refresh(refreshToken) {
  const tokenHash = hashToken(refreshToken);

  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  // 🔴 INVALID OR MISSING TOKEN → DELETE IF EXISTS
  if (!record) {
    await prisma.refreshToken.deleteMany({
      where: { tokenHash },
    });
    throw new Error("Invalid refresh token");
  }

  // 🔴 EXPIRED TOKEN → DELETE
  if (record.expiresAt < new Date()) {
    await prisma.refreshToken.delete({
      where: { tokenHash },
    });
    throw new Error("Expired refresh token");
  }

  return {
    accessToken: generateAccessToken(record.user),
  };
}

/* ================= LOGOUT ================= */

export async function logout(refreshToken) {
  await prisma.refreshToken.deleteMany({
    where: { tokenHash: hashToken(refreshToken) },
  });
}
