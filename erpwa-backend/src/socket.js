import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import prisma from "./prisma.js";

let io;

/**
 * Initialize Socket.IO
 */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(",").map((o) => o.trim())
        : "*",
      credentials: true,
    },
  });

  /**
   * 🔐 SOCKET AUTH MIDDLEWARE
   */
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        console.error("❌ SOCKET: Missing token");
        return next(new Error("Authentication required"));
      }

      // 🔍 Verify JWT
      const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      // ✅ SUPPORT BOTH userId AND sub
      const userId = payload.userId || payload.sub;

      if (!userId) {
        console.error("❌ SOCKET: userId missing in token");
        return next(new Error("Invalid token payload"));
      }

      // 🔍 Load user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          vendorId: true,
        },
      });

      if (!user) {
        console.error("❌ SOCKET: User not found");
        return next(new Error("Invalid user"));
      }

      // If no vendorId (user is in onboarding step 1 -> step 2), that's fine for now, they just won't join a vendor room yet.

      // 🔐 Attach user to socket
      socket.user = user;

      console.log("✅ SOCKET AUTH OK:", user.id);

      next();
    } catch (err) {
      console.error("❌ SOCKET AUTH ERROR:", err.message);
      next(new Error(err.message || "Socket authentication failed"));
    }
  });

  /**
   * 🔌 SOCKET CONNECTION
   */
  io.on("connection", async (socket) => {
    const { id: userId, vendorId } = socket.user;

    console.log("🔌 SOCKET CONNECTED:", userId);

    // 🔒 Auto-join vendor room if vendorId exists
    if (vendorId) {
      socket.join(`vendor:${vendorId}`);
    }

    /**
     * Join conversation room
     */
    socket.on("join-conversation", async (conversationId) => {
      if (!conversationId) return;

      const where = {
        id: conversationId,
        vendorId,
      };

      // 🔒 ROLE-BASED FILTERING: Sales persons only see their assigned leads
      if (socket.user.role === "sales") {
        where.lead = {
          salesPersonName: socket.user.name,
        };
      }

      const conversation = await prisma.conversation.findFirst({
        where,
        select: { vendorId: true },
      });

      if (!conversation) {
        console.warn("⚠️ SOCKET: Unauthorized conversation join blocked");
        return;
      }

      socket.join(`conversation:${conversationId}`);

      // 👁 Mark inbound messages as read
      const unread = await prisma.message.findMany({
        where: {
          conversationId,
          direction: "inbound",
          status: { not: "read" },
        },
      });

      if (unread.length) {
        await prisma.message.updateMany({
          where: { id: { in: unread.map((m) => m.id) } },
          data: { status: "read" },
        });

        unread.forEach((m) => {
          io.to(`conversation:${conversationId}`).emit("message:status", {
            whatsappMessageId: m.whatsappMessageId,
            status: "read",
          });
        });
      }
    });

    socket.on("leave-conversation", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // 🔌 Mark user as ONLINE
    await prisma.user
      .update({
        where: { id: userId },
        data: { isOnline: true },
      })
      .catch((e) => console.error("Error setting online status:", e));

    // 📢 Broadcast to vendor room AND self (only if vendorId exists)
    if (vendorId) {
      io.to(`vendor:${vendorId}`).emit("user:presence", {
        userId,
        isOnline: true,
      });
    }
    // Ensure the connecting user gets their own status update immediately
    socket.emit("user:presence", {
      userId,
      isOnline: true,
    });

    socket.on("disconnect", async (reason) => {
      console.log("❌ SOCKET DISCONNECTED:", userId, reason);

      // 🔌 Mark user as OFFLINE
      await prisma.user
        .update({
          where: { id: userId },
          data: { isOnline: false, lastLoginAt: new Date() },
        })
        .catch((e) => console.error("Error setting offline status:", e));

      // 📢 Broadcast to vendor room
      if (vendorId) {
        io.to(`vendor:${vendorId}`).emit("user:presence", {
          userId,
          isOnline: false,
        });
      }
    });
  });

  return io;
}

/**
 * Safe getter
 */
export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}
