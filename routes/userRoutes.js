import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import User from "../models/User.js";

const router = express.Router();

// User profile
router.get("/profile", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    res.render("profile", { user });
  } catch (err) {
    console.log(err);
    res.send("Error loading profile");
  }
});

export default router;
