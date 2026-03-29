const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");

// REGISTER PAGE
router.get("/register", (req, res) => {
  res.render("register.ejs");
});

// REGISTER USER
router.post("/register", async (req, res) => {
  try {
    const { username, mobile, email, password, confirmPassword } = req.body;

    // password match check
    if (password !== confirmPassword) {
      req.flash("error", "Passwords do not match");
      return res.redirect("/register");
    }

    const user = new User({
      username,
      mobile,
      email,
      password // ⚠️ plain password (model will hash)
    });

    if (email === "admin@gmail.com") {
      user.role = "admin";
    }

    await user.save();

    req.flash("success", "Account created successfully. Please login.");
    res.redirect("/login");

  } catch (err) {

    if (err.code === 11000) {
      if (err.keyPattern.email) {
        req.flash("error", "Email already registered");
      }
      if (err.keyPattern.mobile) {
        req.flash("error", "Mobile number already registered");
      }
      return res.redirect("/register");
    }

    console.error(err);
    req.flash("error", "Something went wrong");
    res.redirect("/register");
  }
});

// LOGIN PAGE
router.get("/login", (req, res) => {
  res.render("login.ejs");
});

// LOGIN
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/products",
    failureRedirect: "/login",
    failureFlash: "Invalid email or password"
  })
);

// LOGOUT
router.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);

    req.flash("success", "Logged out successfully");
    res.redirect("/login");
  });
});

module.exports = router;