import prisma from "../prisma.js";
import { hashPassword } from "../utils/password.js";
import { sendMail } from "../utils/mailer.js";
import jwt from "jsonwebtoken";

// Force restart for prisma client update

// List all users for the current vendor
export const listUsers = async (req, res) => {
    try {
        const whereClause = {
            vendorId: req.user.vendorId,
        };

        if (req.query.role) {
            whereClause.role = req.query.role;
        }

        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                isOnline: true,
                lastLoginAt: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        });

        res.json(users);
    } catch (error) {
        console.error("List users error:", error);
        res.status(500).json({ message: "Failed to list users" });
    }
};

// Create a new user (sales person)
export const createUser = async (req, res) => {
    const { name, email, role, password } = req.body;

    if (!name || !email || !role || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        // Check if email exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ message: "Email already in use" });
        }

        const passwordHash = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                role,
                passwordHash,
                vendorId: req.user.vendorId,
                passwordHash,
                vendorId: req.user.vendorId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                isOnline: true,
                lastLoginAt: true,
                createdAt: true,
            },
        });

        // Generate Invite Token (reusing password reset logic)
        console.log("🔑 Generating Invite Token with RESET SECRET for user:", user.id);
        const inviteToken = jwt.sign(
            { sub: user.id, type: "invite", role: role },
            process.env.PASSWORD_RESET_TOKEN_SECRET,
            { expiresIn: "36500d" }
        );

        const inviteLink = `${process.env.FRONTEND_URL}/create-password?token=${inviteToken}`;

        // Send welcome email with Link
        try {
            await sendMail({
                to: email,
                subject: "Welcome to WhatsApp ERP - Activate Your Account",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563EB;">Welcome to the Team, ${name}!</h2>
                        <p>Your account has been created successfully.</p>
                        <p>To get started, please click the link below to set your secure password and activate your account:</p>
                        
                        <div style="margin: 30px 0; text-align: center;">
                            <a href="${inviteLink}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Set Your Password</a>
                        </div>

                        <p style="font-size: 14px; color: #666;">Or copy this link to your browser:</p>
                        <p style="font-size: 14px; color: #666; word-break: break-all;">${inviteLink}</p>
                        
                        <p style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #999;">
                            This link is valid for 7 days.
                        </p>
                    </div>
                `
            });
        } catch (mailError) {
            console.error("Failed to send welcome email:", mailError);
            // Don't fail the request if email fails, just log it
        }

        res.status(201).json(user);
    } catch (error) {
        console.error("Create user error:", error);
        res.status(500).json({ message: "Failed to create user" });
    }
};

// Update user details
export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, role, password, status } = req.body;

    try {
        const userToUpdate = await prisma.user.findUnique({
            where: { id, vendorId: req.user.vendorId },
        });

        if (!userToUpdate) {
            return res.status(404).json({ message: "User not found" });
        }

        // Prevent unauthorized editing of Vendor Owner
        if (userToUpdate.role === "vendor_owner") {
            if (req.user.id !== userToUpdate.id) {
                return res.status(403).json({ message: "Only the Vendor Owner can edit their own account" });
            }
            // Also prevent owner from changing their own role/status accidentally via this API if needed, 
            // though UI restricts it. Let's force role to stay vendor_owner for safety.
            if (role && role !== "vendor_owner") {
                return res.status(400).json({ message: "Vendor Owner cannot change their role" });
            }
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        if (status) {
            // updateData.status = status;
        }
        if (password) {
            updateData.passwordHash = await hashPassword(password);
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                isOnline: true,
                lastLoginAt: true,
            },
        });

        res.json(user);
    } catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({ message: "Failed to update user" });
    }
};

// Delete user
export const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        if (id === req.user.id) {
            return res.status(400).json({ message: "Cannot delete yourself" });
        }

        const userToDelete = await prisma.user.findUnique({
            where: { id, vendorId: req.user.vendorId },
        });

        if (!userToDelete) {
            return res.status(404).json({ message: "User not found" });
        }

        if (userToDelete.role === "vendor_owner") {
            return res.status(403).json({ message: "Cannot delete the Vendor Owner" });
        }

        // Restrict vendor_admin from deleting other admins
        if (req.user.role === "vendor_admin" && userToDelete.role === "vendor_admin") {
            return res.status(403).json({ message: "Admins cannot delete other Admins" });
        }

        await prisma.user.delete({
            where: { id },
        });

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        // ...
        console.error("Delete user error:", error);
        res.status(500).json({ message: "Failed to delete user" });
    }
};
