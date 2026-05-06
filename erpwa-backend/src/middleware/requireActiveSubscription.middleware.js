export function requireActiveSubscription(req, res, next) {
  // Pass if super admin (super admins don't use this, but just in case)
  if (req.user?.role === "super_admin") return next();

  const isExpired =
    req.user?.vendor?.subscriptionEnd &&
    new Date(req.user.vendor.subscriptionEnd).getTime() <= new Date().getTime();

  if (isExpired) {
    return res.status(403).json({
      message: "Subscription expired. Please upgrade your plan to access this service.",
      code: "SUBSCRIPTION_EXPIRED",
    });
  }

  next();
}
