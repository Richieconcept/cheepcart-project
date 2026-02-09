export const adminOnly = (req, res, next) => {
  // At this point, req.user already exists (from protect)
  if (req.user && req.user.role === "admin") {
    return next();
  }

  res.status(403);
  throw new Error("Access denied. Admins only.");
};
