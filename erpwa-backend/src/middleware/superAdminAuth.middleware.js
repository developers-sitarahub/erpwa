import jwt from 'jsonwebtoken';

export function superAdminAuth(req, res, next) {
  const token = req.cookies?.saToken;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No super admin token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (decoded.role !== 'super_admin') {
      return res.status(403).json({ message: 'Forbidden: Not a super admin' });
    }

    req.superAdmin = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
}
