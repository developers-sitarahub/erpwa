import * as Auth from "../services/auth/auth.service.js";
import prisma from "../prisma.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: false, // true in production (HTTPS)
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // ✅ REQUIRED
};

/* ================= LOGIN ================= */

export async function login(req, res) {
  try {
    const data = await Auth.login(req.body.email, req.body.password);

    console.log("✅ LOGIN SUCCESS: Setting cookie for user", data.user.email);
    console.log("Cookie Options:", COOKIE_OPTIONS);

    res.cookie("refreshToken", data.refreshToken, COOKIE_OPTIONS).json({
      accessToken: data.accessToken,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        vendor: data.user.vendor,
      },
    });
  } catch (err) {
    console.error("❌ LOGIN ERROR:", err.message);
    const status = err.message === "Invalid credentials" ? 401 : 500;
    res.status(status).json({ message: err.message });
  }
}

/* ================= REFRESH ================= */

export async function refresh(req, res) {
  const token = req.cookies?.refreshToken;

  if (!token) {
    console.log("❌ REFRESH: No token in cookies", req.cookies);
    res.clearCookie("refreshToken", COOKIE_OPTIONS);
    return res.status(401).json({ message: "No token" });
  }

  try {
    const data = await Auth.refresh(token);
    return res.json(data);
  } catch (err) {
    console.error("❌ REFRESH ERROR:", err.message);
    
    // Only delete cookie if the token is definitely invalid or expired
    if (err.message === "Invalid refresh token" || err.message === "Expired refresh token") {
      res.clearCookie("refreshToken", COOKIE_OPTIONS);
      return res.status(401).json({ message: err.message });
    }
    
    // For DB or network errors, do NOT clear the cookie, just return 500
    // so the frontend can try again later without logging out the user.
    return res.status(500).json({ message: "Internal server error during refresh" });
  }
}

/* ================= LOGOUT ================= */

export async function logout(req, res) {
  if (req.cookies?.refreshToken) {
    await Auth.logout(req.cookies.refreshToken);
  }

  res.clearCookie("refreshToken", COOKIE_OPTIONS);
  res.json({ success: true });
}

export async function me(req, res) {
  try {
    console.log("🔄 FORCE RESTART LOG: /auth/me hit");
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        vendor: {
          include: {
            subscriptionPlan: true
          }
        }
      }
    });

    console.log("💎 [ME_CONTROLLER] Fresh Fetch Plan:", user?.vendor?.subscriptionPlan?.name);
    console.log("💎 [ME_CONTROLLER] RAW USER DUMP:", JSON.stringify(user, null, 2));
    
    res.json({
      user: user || req.user,
    });
  } catch (error) {
    console.error("Error in me controller:", error);
    res.json({ user: req.user });
  }
}
