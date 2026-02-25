import prisma from '../prisma.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import jwt from 'jsonwebtoken';
import { generateOtp, hashOtp } from '../utils/otp.js';
import { sendMail } from '../utils/mailer.js';
import { passwordResetOtpTemplate } from '../emails/passwordResetOtp.template.js';
import { vendorActivatedWithPasswordTemplate } from '../emails/vendorActivatedWithPassword.template.js';
import crypto from 'crypto';

/* ============================================================
 * POST /api/super-admin/login
 * ============================================================ */
export async function superAdminLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const admin = await prisma.superAdmin.findUnique({ where: { email } });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const valid = await comparePassword(password, admin.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate a dedicated Super Admin JWT stored in a httpOnly cookie
    const token = jwt.sign(
      { sub: admin.id, email: admin.email, name: admin.name, role: 'super_admin' },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '8h' }
    );

    res.cookie('saToken', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });

    return res.json({
      message: 'Login successful',
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (err) {
    console.error('superAdminLogin error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/* ============================================================
 * POST /api/super-admin/logout
 * ============================================================ */
export function superAdminLogout(req, res) {
  res.clearCookie('saToken');
  return res.json({ message: 'Logged out' });
}

/* ============================================================
 * GET /api/super-admin/me
 * ============================================================ */
export function superAdminMe(req, res) {
  return res.json({ admin: req.superAdmin });
}

/* ============================================================
 * GET /api/super-admin/vendors
 * Returns all vendors with user count and owner info
 * ============================================================ */
export async function getVendors(req, res) {
  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          where: { role: 'vendor_owner' },
          select: { id: true, name: true, email: true, mobileNumber: true, createdAt: true, onboardingStatus: true },
          take: 1,
        },
        _count: { select: { users: true } },
      },
    });

    const result = vendors.map((v) => ({
      id: v.id,
      name: v.name,
      businessCategory: v.businessCategory,
      country: v.country,
      whatsappStatus: v.whatsappStatus,
      createdAt: v.createdAt,
      subscriptionStart: v.subscriptionStart,
      subscriptionEnd: v.subscriptionEnd,
      userCount: v._count.users,
      owner: v.users[0] ?? null,
    }));

    return res.json(result);
  } catch (err) {
    console.error('getVendors error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/* ============================================================
 * PUT /api/super-admin/vendors/:id/activate
 * Activates a vendor by setting its owner's onboardingStatus to 'activated'
 * ============================================================ */
export async function activateVendor(req, res) {
  try {
    const { id } = req.params;

    // Find the vendor_owner of this vendor
    const owner = await prisma.user.findFirst({
      where: { vendorId: id, role: 'vendor_owner' },
    });

    if (!owner) {
      return res.status(404).json({ message: 'Vendor owner not found' });
    }

    // Generate an 8-character alphanumeric password
    const plainPassword = crypto.randomBytes(4).toString('hex');
    const passwordHash = await hashPassword(plainPassword);

    // Set onboardingStatus to 'activated' and assign the new password
    await prisma.user.update({
      where: { id: owner.id },
      data: { 
        onboardingStatus: 'activated',
        passwordHash,
      },
    });

    // Start the trial period for the Vendor
    const subscriptionStart = new Date();
    const subscriptionEnd = new Date(subscriptionStart.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days

    await prisma.vendor.update({
      where: { id: id },
      data: {
        subscriptionStart,
        subscriptionEnd,
      },
    });

    // Send activation email with generated credentials to the vendor owner
    if (owner.email) {
      try {
        await sendMail({
          to: owner.email,
          ...vendorActivatedWithPasswordTemplate({ 
            name: owner.name || 'Vendor',
            email: owner.email,
            password: plainPassword
          }),
        });
        console.log(`[EMAIL SUCCESS] Sent activation email & password to ${owner.email}`);
      } catch (err) {
        console.error(`[EMAIL FAILED] Failed to send activation email to ${owner.email}:`, err);
        // We don't throw here to avoid preventing the activation itself if email fails
      }
    }

    return res.json({ message: 'Vendor activated successfully and password sent via email.' });
  } catch (err) {
    console.error('activateVendor error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/* ============================================================
 * GET /api/super-admin/vendors/:id/registration
 * Returns the VendorRegistration snapshot for a vendor
 * ============================================================ */
export async function getVendorRegistration(req, res) {
  try {
    const { id } = req.params;

    const registration = await prisma.vendorRegistration.findFirst({
      where: { vendorId: id },
      orderBy: { createdAt: 'desc' },
    });

    // Fallback: look up via userId (in case step2 wasn't completed yet)
    if (!registration) {
      const owner = await prisma.user.findFirst({
        where: { vendorId: id, role: 'vendor_owner' },
        select: { id: true },
      });
      if (owner) {
        const regByUser = await prisma.vendorRegistration.findFirst({
          where: { userId: owner.id },
          orderBy: { createdAt: 'desc' },
        });
        if (regByUser) return res.json(regByUser);
      }
      // If truly nothing stored (old vendor before this feature), return data from User/Vendor tables
      const vendor = await prisma.vendor.findUnique({
        where: { id },
        include: {
          users: {
            where: { role: 'vendor_owner' },
            select: { name: true, email: true, mobileNumber: true, createdAt: true, onboardingStatus: true },
            take: 1,
          },
        },
      });
      if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
      const o = vendor.users[0];
      return res.json({
        ownerName: o?.name ?? null,
        ownerEmail: o?.email ?? null,
        ownerMobile: o?.mobileNumber ?? null,
        businessName: vendor.name,
        businessCategory: vendor.businessCategory,
        country: vendor.country,
        step1CompletedAt: o?.createdAt ?? null,
        step2CompletedAt: null,
        _fallback: true,
      });
    }

    return res.json(registration);
  } catch (err) {
    console.error('getVendorRegistration error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/* ============================================================
 * GET /api/super-admin/stats
 * Platform-wide statistics
 * ============================================================ */
export async function getStats(req, res) {
  try {
    const [vendors, users, leads] = await Promise.all([
      prisma.vendor.count(),
      prisma.user.count(),
      prisma.lead.count(),
    ]);

    return res.json({ vendors, users, leads });
  } catch (err) {
    console.error('getStats error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/* ============================================================
 * POST /api/super-admin/change-password/request-otp
 * Sends a 6-digit OTP to the super admin's current email.
 * Returns a signed "otp envelope" JWT (stateless – no DB row).
 * ============================================================ */
export async function requestChangePasswordOtp(req, res) {
  try {
    const adminId = req.superAdmin.sub;
    const admin = await prisma.superAdmin.findUnique({ where: { id: adminId } });
    if (!admin) return res.status(404).json({ message: 'Super admin not found' });

    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    console.log(`🔑 [SuperAdmin OTP] Generated OTP for ${admin.email}: ${otp}`);

    // Sign a short-lived envelope containing the hash
    const otpToken = jwt.sign(
      { sub: adminId, otpHash, purpose: 'sa_change_password' },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '10m' }
    );

    const mailResult = await sendMail({
      to: admin.email,
      ...passwordResetOtpTemplate({ name: admin.name || 'Super Admin', otp }),
    });

    if (mailResult?.error) {
      console.error('❌ Failed to send OTP email to super admin:', mailResult.error);
      return res.status(500).json({ message: 'Failed to send OTP email. Please try again.' });
    }

    console.log(`✅ OTP email sent to super admin: ${admin.email} | Resend ID: ${mailResult?.data?.id}`);
    return res.json({ message: 'OTP sent to your email', otpToken });
  } catch (err) {
    console.error('requestChangePasswordOtp error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/* ============================================================
 * POST /api/super-admin/change-password/verify-otp
 * Body: { otpToken, otp }
 * Returns a resetToken (valid 15 min) if correct.
 * ============================================================ */
export async function verifyChangePasswordOtp(req, res) {
  try {
    const { otpToken, otp } = req.body;
    if (!otpToken || !otp) {
      return res.status(400).json({ message: 'otpToken and otp are required' });
    }

    let payload;
    try {
      payload = jwt.verify(otpToken, process.env.ACCESS_TOKEN_SECRET);
    } catch {
      return res.status(401).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (payload.purpose !== 'sa_change_password') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    if (hashOtp(otp) !== payload.otpHash) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Issue a resetToken (15 min)
    const resetToken = jwt.sign(
      { sub: payload.sub, purpose: 'sa_reset_password' },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    return res.json({ message: 'OTP verified', resetToken });
  } catch (err) {
    console.error('verifyChangePasswordOtp error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/* ============================================================
 * POST /api/super-admin/change-password/reset
 * Header: Authorization: Bearer <resetToken>
 * Body: { newPassword }
 * ============================================================ */
export async function resetSuperAdminPassword(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Missing reset token' });

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch {
      return res.status(401).json({ message: 'Reset token expired. Please start again.' });
    }

    if (payload.purpose !== 'sa_reset_password') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.superAdmin.update({
      where: { id: payload.sub },
      data: { passwordHash },
    });

    // Clear the session cookie — force re-login
    res.clearCookie('saToken');
    return res.json({ message: 'Password updated successfully. Please login again.' });
  } catch (err) {
    console.error('resetSuperAdminPassword error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/* ============================================================
 * PUT /api/super-admin/profile
 * Body: { name?, email? }
 * Updates profile (name and/or email). Protected route.
 * ============================================================ */
export async function updateSuperAdminProfile(req, res) {
  try {
    const adminId = req.superAdmin.sub;
    const { name, email } = req.body;

    const updateData = {};
    if (name?.trim()) updateData.name = name.trim();
    if (email?.trim()) {
      // Check email not taken by another super admin
      const existing = await prisma.superAdmin.findFirst({
        where: { email: email.trim(), NOT: { id: adminId } },
      });
      if (existing) return res.status(400).json({ message: 'Email already in use' });
      updateData.email = email.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    const updated = await prisma.superAdmin.update({
      where: { id: adminId },
      data: updateData,
      select: { id: true, email: true, name: true },
    });

    return res.json({ message: 'Profile updated', admin: updated });
  } catch (err) {
    console.error('updateSuperAdminProfile error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
