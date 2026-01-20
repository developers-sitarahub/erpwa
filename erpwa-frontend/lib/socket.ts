import { io, Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/api";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_WS_URL || "http://localhost:5000", {
      path: "/socket.io",
      transports: ["websocket"],
      autoConnect: false,
      withCredentials: true,
    });
  }
  return socket;
}

/**
 * ✅ SAFE CONNECT
 * - always refresh token
 * - reconnects if token changes
 */
export function connectSocket() {
  const token = getAccessToken();
  if (!token) return;

  const s = getSocket();

  s.auth = { token };

  if (!s.connected) {
    s.connect();
  }
}

/**
 * ✅ CLEAN DISCONNECT
 */
export function disconnectSocket() {
  const s = getSocket();
  if (s.connected) {
    s.disconnect();
  }
}
