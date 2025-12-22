export function validateEmail(req, res, next) {
  const { email } = req.body;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ message: "Email is required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  next();
}

export function validateOtp(req, res, next) {
  const { otp } = req.body;

  if (!otp || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({
      message: "OTP must be a 6-digit number",
    });
  }

  next();
}

export function validatePassword(req, res, next) {
  const { newPassword } = req.body;

  if (!newPassword || typeof newPassword !== "string") {
    return res.status(400).json({ message: "Password is required" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      message: "Password must be at least 8 characters long",
    });
  }

  next();
}
