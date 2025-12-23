import * as Auth from "../services/auth/auth.service.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: false, // true in production (HTTPS)
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // ✅ REQUIRED
};

/* ================= LOGIN ================= */

export async function login(req, res) {
  const data = await Auth.login(req.body.email, req.body.password);

  res.cookie("refreshToken", data.refreshToken, COOKIE_OPTIONS).json({
    accessToken: data.accessToken,
    user: {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
    },
  });
}

/* ================= REFRESH ================= */

export async function refresh(req, res) {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: "No token" });

  const data = await Auth.refresh(token);
  res.json(data);
}

/* ================= LOGOUT ================= */

export async function logout(req, res) {
  if (req.cookies?.refreshToken) {
    await Auth.logout(req.cookies.refreshToken);
  }

  res.clearCookie("refreshToken", COOKIE_OPTIONS);
  res.json({ success: true });
}

export function me(req, res) {
  res.json({
    user: req.user,
  });
}
