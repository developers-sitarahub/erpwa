export function requireRoles(allowedRoles = []) {
  return (req, res, next) => {
    // Must be authenticated
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Role check
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action",
      });
    }

    // Vendor context check (for vendor-scoped actions)
    if (!req.user.vendorId) {
      return res.status(400).json({
        message: "Vendor not initialized for this account",
      });
    }

    next();
  };
}
