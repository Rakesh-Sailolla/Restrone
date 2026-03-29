function isAdmin(req, res, next) {

  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }

  if (req.user.role !== "admin") {
    return res.redirect("/");
  }

  next();
}

module.exports = isAdmin ;