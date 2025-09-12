import express from "express";
import User from "../models/User.js";
import Invoice from "../models/Invoice.js";
import { isAuthenticated, isAdmin } from "../middlewares/auth.js";

const router = express.Router();

// Admin dashboard
router.get("/admin", isAuthenticated, isAdmin, async (req, res) => {
  const users = await User.find();
  const invoices = await Invoice.find();
  res.render("admin_dashboard", { users, invoices });
});

// Change user role
router.post("/admin/user/:id/role", isAuthenticated, isAdmin, async (req, res) => {
  const { role } = req.body; // "user" or "admin"
  await User.findByIdAndUpdate(req.params.id, { role });
  res.redirect("/admin");
});

// Delete user
router.post("/admin/user/:id/delete", isAuthenticated, isAdmin, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.redirect("/admin");
});

// Delete invoice
router.post("/admin/invoice/:id/delete", isAuthenticated, isAdmin, async (req, res) => {
  await Invoice.findByIdAndDelete(req.params.id);
  res.redirect("/admin");
});

export default router;
