import express from "express";
import User from "../models/User.js";
import Invoice from "../models/Invoice.js";
import { isAuthenticated, isAdmin } from "../middlewares/auth.js";

const router = express.Router();

// Admin dashboard
router.get("/", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).lean();

    const userInvoices = {};
    for (let user of users) {
      const invoices = await Invoice.find({ user: user._id }).lean();
      userInvoices[user._id] = invoices;
    }

    res.render("admin_dashboard", {
      users,
      userInvoices,
      username: req.session.username
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

export default router;
