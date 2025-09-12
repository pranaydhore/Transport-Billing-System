// middlewares/auth.js

// export function isAuthenticated(req, res, next) {
//   if (req.session.userId) return next();
//   res.redirect("/login");
// }


// export function isAdmin(req, res, next) {
//   if (req.session && req.session.role === "admin") return next();
//   res.send("Access denied. You are not an admin.");
// }

export const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  req.session.error = "You must be logged in";
  res.redirect("/login");
};

export const isAdmin = (req, res, next) => {
  if (req.session.role === "admin") {
    return next();
  }
  req.session.error = "Access denied!";
  res.redirect("/login");
};

// middleware/auth.js
import User from "../models/User.js";

// Middleware to check if user is authenticated
export const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    req.session.error = "Please login to access this page";
    return res.redirect("/login");
  }
  next();
};

// Middleware to check if user is admin
export const requireAdmin = (req, res, next) => {
  if (!req.session.userId) {
    req.session.error = "Please login to access this page";
    return res.redirect("/login");
  }
  
  if (req.session.role !== "admin") {
    req.session.error = "Admin access required";
    return res.redirect("/login");
  }
  
  next();
};

// Middleware to redirect authenticated users away from auth pages
export const redirectIfAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    if (req.session.role === "admin") {
      return res.redirect("/admin");
    } else {
      return res.redirect("/invoices");
    }
  }
  next();
};

// Middleware to attach user data to request
export const attachUser = async (req, res, next) => {
  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId).select("-password");
      req.user = user;
      
      // Make user data available to all templates
      res.locals.user = user;
      res.locals.isAuthenticated = true;
      res.locals.isAdmin = user?.role === "admin";
    } catch (err) {
      console.error("Error fetching user:", err);
      // Clear invalid session
      req.session.userId = null;
      req.session.role = null;
      req.session.username = null;
    }
  } else {
    res.locals.isAuthenticated = false;
    res.locals.isAdmin = false;
  }
  
  next();
};

// Middleware to handle flash messages
export const flashMessages = (req, res, next) => {
  res.locals.success = req.session.success;
  res.locals.error = req.session.error;
  res.locals.warning = req.session.warning;
  res.locals.info = req.session.info;
  
  // Clear messages after passing to template
  req.session.success = null;
  req.session.error = null;
  req.session.warning = null;
  req.session.info = null;
  
  next();
};

// Rate limiting middleware for auth routes
const authAttempts = new Map();

export const rateLimitAuth = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    
    if (!authAttempts.has(key)) {
      authAttempts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const attempts = authAttempts.get(key);
    
    if (now > attempts.resetTime) {
      // Reset the counter
      attempts.count = 1;
      attempts.resetTime = now + windowMs;
      return next();
    }
    
    if (attempts.count >= maxAttempts) {
      req.session.error = `Too many login attempts. Please try again in ${Math.ceil((attempts.resetTime - now) / 60000)} minutes.`;
      return res.redirect("/login");
    }
    
    attempts.count++;
    next();
  };
};

// Middleware to log authentication events
export const logAuthEvents = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    if (req.method === 'POST' && (req.path === '/login' || req.path === '/signup' || req.path === '/admin-login')) {
      const success = !req.session.error;
      const event = {
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        email: req.body.email,
        success: success,
        error: req.session.error || null
      };
      
      console.log('Auth Event:', JSON.stringify(event, null, 2));
      
      // You can save this to a database or log file
      // saveAuthLog(event);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Security headers middleware
export const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

// Session validation middleware
export const validateSession = async (req, res, next) => {
  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      
      if (!user) {
        // User doesn't exist anymore, clear session
        req.session.destroy((err) => {
          if (err) console.error('Session destroy error:', err);
        });
        req.session.error = "Your session has expired. Please login again.";
        return res.redirect("/login");
      }
      
      // Update session data if user role changed
      if (req.session.role !== user.role) {
        req.session.role = user.role;
      }
      
    } catch (err) {
      console.error('Session validation error:', err);
    }
  }
  
  next();
};