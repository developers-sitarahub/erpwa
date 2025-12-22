import * as Auth from "../services/auth/auth.service.js";
import * as Reset from "../services/auth/passwordReset.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const data = await Auth.login(email, password);
  res.json(data);
});

export const refresh = asyncHandler(async (req, res) => {
  const data = await Auth.refresh(req.body.refreshToken);
  res.json(data);
});

export const logout = asyncHandler(async (req, res) => {
  await Auth.logout(req.body.refreshToken);
  res.json({ success: true });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await Reset.resetPassword(req.body.email, req.body.otp, req.body.newPassword);
  res.json({ success: true });
});

export const me = asyncHandler(async (req, res) => {
  res.json({
    id: req.user.id,
    role: req.user.role,
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await Reset.sendResetOtp(req.body.email);
  res.json({ success: true });
});

export const verifyForgotOtp = asyncHandler(async (req, res) => {
  const resetToken = await Reset.verifyForgotOtp(
    req.body.email,
    req.body.otp
  );
  res.json({ resetToken });
});

export const resetForgotPassword = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing reset token" });
  }

  await Reset.resetForgotPassword(
    authHeader.split(" ")[1],
    req.body.newPassword
  );

  res.json({ success: true });
});
