import dotenv from "dotenv";
dotenv.config();

import express from "express";
import expressLayouts from "express-ejs-layouts";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import methodOverride from 'method-override';

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import invoiceRoutes from "./routes/InvoiceRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import pagesRoutes from "./routes/pageRoutes.js";

const PORT = process.env.PORT || 3000;

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB Atlas connected ✅"))
.catch(err => console.log("MongoDB Atlas error ❌", err));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: "mongodb://127.0.0.1:27017/transportBilling" }),
  cookie: { maxAge: 1000 * 60 * 60 }
}));

// Flash messages & locals
app.use((req, res, next) => {
  res.locals.success = req.session.success;
  res.locals.error = req.session.error;
  res.locals.username = req.session.username || null;
  res.locals.role = req.session.role || null;
  delete req.session.success;
  delete req.session.error;
  next();
});



// Routes
app.use("/", pagesRoutes);
app.use("/", authRoutes);
app.use("/invoices", invoiceRoutes);
app.use("/admin", adminRoutes);
app.use("/user", userRoutes);

app.listen(PORT, () => console.log("Server running at http://localhost:3000"));
