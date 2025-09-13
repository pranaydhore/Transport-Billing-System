import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const router = express.Router();

// Admin email (always lowercase)
const ADMIN_EMAIL = "admin@gmail.com";

// ================== SIGNUP ==================
router.get("/signup", (req, res) => res.render("signup"));

router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    // normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // assign role
    const role = normalizedEmail === ADMIN_EMAIL ? "admin" : "user";

    const user = new User({
      username,
      email: normalizedEmail,
      password: hashedPassword,
      role,
    });
    await user.save();

    req.session.success = "Account created! Login now.";
    res.redirect("/login");
  } catch (err) {
    console.log(err);
    req.session.error = "Error creating user";
    res.redirect("/signup");
  }
});

router.get("/login", (req, res) => res.render("login"));

// ================== LOGIN ==================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      req.session.error = "User not found";
      return res.redirect("/login");
    }

    // ---------- Paste here ----------
    // If admin is stored in plain text (old entry), hash it once
    if (normalizedEmail === ADMIN_EMAIL && !user.password.startsWith("$2b$")) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      user.password = hashedPassword;
      await user.save();
      console.log("Fixed admin password hash ✅");
    }
    // --------------------------------

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      req.session.error = "Invalid password";
      return res.redirect("/login");
    }

    // force admin role if email matches ADMIN_EMAIL
    if (normalizedEmail === ADMIN_EMAIL) {
      user.role = "admin";
      await user.save();
    }

    req.session.userId = user._id;
    req.session.role = user.role;
    req.session.username = user.username;

    req.session.success = `Welcome back, ${user.username}!`;
    if (user.role === "admin") res.redirect("/admin");
    else res.redirect("/invoices");
  } catch (err) {
    console.log(err);
    req.session.error = "Login error";
    res.redirect("/login");
  }
});

// ================== LOGOUT ==================
router.get("/logout", (req, res) => {
  // Store a temporary message in session
  req.session.success = "You have successfully logged out.";

  // Destroy only the user-related data, keep session for flash message
  req.session.userId = null;
  req.session.role = null;
  req.session.username = null;

  res.redirect("/");
});


export default router;
