import prisma from "../../prisma.js";
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/token.js";
import { hashToken } from "../../utils/hash.js";
import { sendMail } from "../../utils/mailer.js";
import { onboardingOtpTemplate } from "../../emails/onboardingOtp.template.js";
import twilio from "twilio";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Used for simple OTP generation; in production replace with an SMS gateway integration
export async function generateOtp(mobile, email) {
  const mobileOtp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
  const emailOtp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits

  // In production, encrypt/hash the OTP. For simplicity in onboarding prototype, we can hash it.
  const salt = await bcrypt.genSalt(10);
  const mobileOtpHash = await bcrypt.hash(mobileOtp, salt);
  const emailOtpHash = await bcrypt.hash(emailOtp, salt);

  await prisma.registrationOTP.create({
    data: {
      mobile,
      email,
      mobileOtpHash,
      emailOtpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  });

  // Sending OTP via Email using Resend
  if (email) {
    try {
      await sendMail({
        to: email,
        ...onboardingOtpTemplate({
          name: "New Vendor",
          otp: emailOtp,
        }),
      });
      console.log(`[EMAIL SUCCESS] Sent onboarding email OTP to ${email}`);
    } catch (error) {
      console.error(
        `[EMAIL FAILED] Failed to send email OTP to ${email}:`,
        error,
      );
      throw new Error(`Failed to send Email OTP: ${error.message}`);
    }
  }

  // Actual SMS Send via Twilio:
  try {
    const twilioMsg = await twilioClient.messages.create({
      body: `Welcome! Your platform verification OTP is: ${mobileOtp}. Valid for 10 minutes.`,
      from: TWILIO_PHONE_NUMBER,
      to: mobile, // Ensuring phone number format is like "+1234567890" usually handled by frontend or Twilio defaults
    });
    console.log(
      `[SMS SUCCESS] Sent mobile OTP to ${mobile}, SID: ${twilioMsg.sid}`,
    );
  } catch (error) {
    console.error(
      `[SMS FAILED] Failed to send OTP to ${mobile}:`,
      error.message,
    );
    // You might want to throw error here, but for now we log it so it doesn't break if AuthToken is invalid
    throw new Error(`Failed to send SMS OTP: ${error.message}`);
  }

  return {
    success: true,
    message: "OTPs sent to your email and mobile successfully",
  };
}

export async function verifyOtpAndCreateUser(data) {
  const { name, mobile, email, mobileOtp, emailOtp, password } = data;

  // 1. Check if user already exists
  let user = await prisma.user.findUnique({ where: { mobileNumber: mobile } });
  if (email) {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail && (!user || user.id !== existingEmail.id)) {
      throw new Error("Email is already attached to another account");
    }
  }

  // 2. Find valid OTP
  const otps = await prisma.registrationOTP.findMany({
    where: { mobile, email, used: false },
    orderBy: { createdAt: "desc" },
    take: 1,
  });

  if (!otps.length || otps[0].expiresAt < new Date()) {
    throw new Error("Invalid or expired OTP session");
  }

  const validMobileOtp = await bcrypt.compare(mobileOtp, otps[0].mobileOtpHash);
  if (!validMobileOtp) {
    throw new Error("Invalid Mobile OTP");
  }

  const validEmailOtp = await bcrypt.compare(emailOtp, otps[0].emailOtpHash);
  if (!validEmailOtp) {
    throw new Error("Invalid Email OTP");
  }

  // Mark OTP used
  await prisma.registrationOTP.update({
    where: { id: otps[0].id },
    data: { used: true },
  });

  // 3. Create or update User
  let passwordHash = undefined;
  if (password) {
    const salt = await bcrypt.genSalt(10);
    passwordHash = await bcrypt.hash(password, salt);
  }

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        email,
        passwordHash: passwordHash || user.passwordHash,
        onboardingStatus:
          user.onboardingStatus === "pending"
            ? "identity_verified"
            : user.onboardingStatus,
      },
    });
  } else {
    user = await prisma.user.create({
      data: {
        name,
        mobileNumber: mobile,
        email,
        passwordHash,
        role: "vendor_owner",
        onboardingStatus: "identity_verified",
      },
    });
  }

  // Save/update VendorRegistration snapshot for Step 1
  console.log(`[VendorRegistration] Saving Step1 for user=${user.id}, email=${email}`);
  await prisma.vendorRegistration.create({
    data: {
      userId: user.id,
      ownerName: name,
      ownerEmail: email,
      ownerMobile: mobile,
    }
  });
  console.log(`[VendorRegistration] Step1 saved successfully for user=${user.id}`);

  return startOnboardingSession(user);
}

export async function submitStep2(userId, payload) {
  const { businessName, businessCategory, country } = payload;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const latestRegistration = await prisma.vendorRegistration.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  let latestVendorId = user.vendorId;

  if (latestRegistration && latestRegistration.vendorId) {
    // Update existing vendor for THIS specific registration
    await prisma.vendor.update({
      where: { id: latestRegistration.vendorId },
      data: { name: businessName, businessCategory, country },
    });
    latestVendorId = latestRegistration.vendorId;
  } else {
    // Create new vendor for this new registration
    const vendor = await prisma.vendor.create({
      data: { name: businessName, businessCategory, country },
    });
    latestVendorId = vendor.id;
    // Link user to this new vendor
    await prisma.user.update({
      where: { id: userId },
      data: { vendorId: latestVendorId },
    });
  }

  // Update onboarding status
  let updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { onboardingStatus: 'business_info_completed' },
  });

  console.log(`[VendorRegistration] Saving Step2 for user=${userId}, vendorId=${latestVendorId}`);

  // Update the most recent VendorRegistration snapshot with Step 2 data
  if (latestRegistration) {
    await prisma.vendorRegistration.update({
      where: { id: latestRegistration.id },
      data: {
        businessName,
        businessCategory,
        country,
        vendorId: latestVendorId,
        step2CompletedAt: new Date(),
      }
    });
  } else {
    await prisma.vendorRegistration.create({
      data: {
        userId,
        ownerName: updatedUser.name || '',
        ownerEmail: updatedUser.email || '',
        ownerMobile: updatedUser.mobileNumber || '',
        businessName,
        businessCategory,
        country,
        vendorId: latestVendorId,
        step2CompletedAt: new Date(),
      }
    });
  }

  return updatedUser;
}

export async function submitStep3(userId, payload) {
  const { whatsappBusinessId, whatsappPhoneNumberId } = payload;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { vendor: true },
  });
  if (!user || !user.vendor) throw new Error("Business info not completed");

  // Require unique whatsapp number checking
  if (whatsappPhoneNumberId) {
    const existingNum = await prisma.vendor.findFirst({
      where: { whatsappPhoneNumberId, id: { not: user.vendor.id } },
    });
    if (existingNum) {
      throw new Error(
        "WhatsApp Number is already registered by another vendor",
      );
    }
  }

  await prisma.vendor.update({
    where: { id: user.vendor.id },
    data: {
      whatsappBusinessId,
      whatsappPhoneNumberId,
      whatsappStatus: "configured",
    },
  });

  return prisma.user.update({
    where: { id: userId },
    data: { onboardingStatus: "activated" },
  });
}

function startOnboardingSession(user) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  // Create refresh token promise
  const tokenPromise = prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken, user, tokenPromise };
}
