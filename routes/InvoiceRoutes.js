import express from "express";
import Invoice from "../models/Invoice.js";
import { isAuthenticated, isAdmin } from "../middlewares/auth.js";
import User from "../models/User.js";

const router = express.Router();

// ---------- ADMIN DASHBOARD ----------
router.get("/admin", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const users = await User.find().lean();
    const userInvoices = await Invoice.find().lean();
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

// ---------- ALL INVOICES ----------
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const invoices = req.session.role === "admin"
      ? await Invoice.find().lean()
      : await Invoice.find({ user: req.session.userId }).lean();
    res.render("invoices", { invoices });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// ---------- NEW INVOICE FORM ----------
router.get("/new", isAuthenticated, (req, res) => {
  res.render("new_invoice");
});

// ---------- CREATE INVOICE ----------
router.post("/new", isAuthenticated, async (req, res) => {
  try {
    const { clientName, driverName, agentName, items, totalAmount } = req.body;

    if (!clientName || !driverName || !agentName || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: "All fields and entries are required" });
    }

    const invoice = new Invoice({
      clientName,
      driverName,
      agentName,
      items,
      totalAmount,
      user: req.session.userId,
      invoiceDate: new Date().toISOString().split("T")[0],
      invoiceTime: new Date().toTimeString().slice(0,5)
    });

    await invoice.save();
    res.json({ success: true, invoiceId: invoice._id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------- VIEW SINGLE INVOICE ----------
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).lean();
    if (!invoice) return res.status(404).send("Invoice not found");
    if (req.session.role !== "admin" && invoice.user.toString() !== req.session.userId)
      return res.status(403).send("Unauthorized");

    res.render("view_invoice", { invoice });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// ---------- EDIT INVOICE FORM ----------
router.get("/:id/edit", isAuthenticated, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).lean();
    if (!invoice) return res.status(404).send("Invoice not found");
    if (req.session.role !== "admin" && invoice.user.toString() !== req.session.userId)
      return res.status(403).send("Unauthorized");

    res.render("edit_invoice", { invoice });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// ---------- UPDATE INVOICE (AJAX) ----------
router.put("/:id", isAuthenticated, async (req, res) => {
  try {
    const { clientName, driverName, agentName, items, totalAmount } = req.body;

    console.log("Update request body:", req.body); // 🔍 Debug log

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
    if (req.session.role !== "admin" && invoice.user.toString() !== req.session.userId)
      return res.status(403).json({ success: false, message: "Unauthorized" });

    invoice.clientName = clientName;
    invoice.driverName = driverName;
    invoice.agentName = agentName;
    invoice.items = items;
    invoice.totalAmount = totalAmount;

    await invoice.save();

    res.json({ success: true, message: "Invoice updated successfully" });
  } catch (err) {
    console.error("❌ Update error:", err); // 🔍 full error in server logs
    res.status(500).json({ 
      success: false, 
      message: err.message,   // return real error message to frontend
      stack: err.stack        // optional: send stack for debugging (remove in production)
    });
  }
});




// ---------- DELETE INVOICE (AJAX) ----------
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).send("Invoice not found");
    if (req.session.role !== "admin" && invoice.user.toString() !== req.session.userId)
      return res.status(403).send("Unauthorized");

    await invoice.deleteOne();

    // ✅ Redirect to invoices after delete
    res.redirect("/invoices");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


// ---------- VIEW INVOICE PDF ----------
router.get("/:id/pdf", isAuthenticated, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).lean();
    if (!invoice) return res.status(404).send("Invoice not found");

    res.render("invoicePdf", { invoice });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

export default router;
