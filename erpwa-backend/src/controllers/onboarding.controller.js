import * as OnboardingService from "../services/onboarding/onboarding.service.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: false, // true in production (HTTPS)
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export async function requestOtp(req, res) {
  try {
    const { mobile, email } = req.body;
    if (!mobile || !email)
      return res
        .status(400)
        .json({ message: "Mobile number and email are required" });

    // Call the service to generate OTP
    const response = await OnboardingService.generateOtp(mobile, email);
    res.json(response);
  } catch (err) {
    console.error("❌ REQUEST OTP ERROR:", err);
    res.status(500).json({ message: err.message || "Failed to request OTP" });
  }
}

export async function verifyStep1(req, res) {
  try {
    const data = req.body;
    if (
      !data.mobile ||
      !data.email ||
      !data.mobileOtp ||
      !data.emailOtp ||
      !data.name
    ) {
      return res
        .status(400)
        .json({ message: "Name, mobile, email, and both OTPs are required" });
    }

    const result = await OnboardingService.verifyOtpAndCreateUser(data);

    // result contains accessToken, refreshToken, user, tokenPromise
    // Wait for the refresh token to be saved in DB
    await result.tokenPromise;

    res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS).json({
      accessToken: result.accessToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        mobile: result.user.mobileNumber,
        name: result.user.name,
        role: result.user.role,
        vendorId: result.user.vendorId,
        onboardingStatus: result.user.onboardingStatus,
      },
    });
  } catch (err) {
    console.error("❌ VERIFY STEP 1 ERROR:", err);
    res.status(400).json({ message: err.message || "Failed to verify OTP" });
  }
}

export async function submitStep2(req, res) {
  try {
    const userId = req.user.id;
    const { businessName, businessCategory, country } = req.body;
    if (!businessName)
      return res.status(400).json({ message: "Business name is required" });

    const updatedUser = await OnboardingService.submitStep2(userId, {
      businessName,
      businessCategory,
      country,
    });
    res.json({
      message: "Business info saved",
      onboardingStatus: updatedUser.onboardingStatus,
    });
  } catch (err) {
    console.error("❌ SUBMIT STEP 2 ERROR:", err);
    res
      .status(400)
      .json({ message: err.message || "Failed to save business info" });
  }
}

export async function submitStep3(req, res) {
  try {
    const userId = req.user.id;
    const { whatsappBusinessId, whatsappPhoneNumberId } = req.body;
    if (!whatsappBusinessId || !whatsappPhoneNumberId) {
      return res.status(400).json({ message: "WhatsApp IDs are required" });
    }

    const updatedUser = await OnboardingService.submitStep3(userId, {
      whatsappBusinessId,
      whatsappPhoneNumberId,
    });
    res.json({
      message: "WhatsApp connected successfully",
      onboardingStatus: updatedUser.onboardingStatus,
    });
  } catch (err) {
    console.error("❌ SUBMIT STEP 3 ERROR:", err);
    res
      .status(400)
      .json({ message: err.message || "Failed to connect WhatsApp" });
  }
}

export async function getOnboardingStatus(req, res) {
  try {
    res.json({ onboardingStatus: req.user.onboardingStatus || "pending" });
  } catch (err) {
    res.status(500).json({ message: "Failed to get status" });
  }
}
