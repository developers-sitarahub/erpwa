import jwt from "jsonwebtoken";

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(
      authHeader.split(" ")[1],
      process.env.ACCESS_TOKEN_SECRET
    );

    req.user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
