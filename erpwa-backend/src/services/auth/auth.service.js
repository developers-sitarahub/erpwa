import prisma from "../../prisma.js";
import { comparePassword } from "../../utils/password.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/token.js";
import { hashToken } from "../../utils/hash.js";

export async function login(email, password) {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Invalid credentials");

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) throw new Error("Invalid credentials");

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  await prisma.$transaction(async (tx) => {
    await tx.refreshToken.deleteMany({ where: { userId: user.id } });
    await tx.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
}

export async function refresh(refreshToken) {
  if (!refreshToken) throw new Error("Refresh token required");

  const hashed = hashToken(refreshToken);

  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashed },
    include: { user: true },
  });

  if (!record || record.expiresAt < new Date()) {
    throw new Error("Invalid refresh token");
  }

  const newAccess = generateAccessToken(record.user);
  const newRefresh = generateRefreshToken();

  await prisma.$transaction(async (tx) => {
    await tx.refreshToken.delete({ where: { tokenHash: hashed } });
    await tx.refreshToken.create({
      data: {
        userId: record.user.id,
        tokenHash: hashToken(newRefresh),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  });

  return { accessToken: newAccess, refreshToken: newRefresh };
}

export async function logout(refreshToken) {
  if (!refreshToken) return;
  await prisma.refreshToken.deleteMany({
    where: { tokenHash: hashToken(refreshToken) },
  });
}
