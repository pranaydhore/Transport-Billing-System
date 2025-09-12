import express from "express";
import User from "../models/User.js"; // make sure User model is imported
import { isAuthenticated } from "../middlewares/auth.js";
const router = express.Router();

// Home page
router.get("/", (req, res) => {
  res.render("home"); // home.ejs must exist
});

// About page
router.get("/about", (req, res) => {
  res.render("about");
});

// Reports page
router.get("/reports", (req, res) => {
  res.render("reports");
});

// profile page

router.get("/profile", isAuthenticated, async (req, res) => {
  try {
    // Fetch logged-in user from session
    const user = await User.findById(req.session.userId);
    if (!user) return res.redirect("/login");

    res.render("profile", { user }); // pass 'user' to EJS
  } catch (err) {
    console.error(err);
    res.redirect("/login");
  }
});

// invoices 
router.get("/", isAuthenticated, async (req, res) => {
  try {
    let invoices;
    
    if (req.session.role === "admin") {
      // Admin sees all invoices
      invoices = await Invoice.find().populate("user", "username email");
    } else {
      // Normal user sees only their invoices
      invoices = await Invoice.find({ user: req.session.userId });
    }

    res.render("invoices", { invoices });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


export default router;
