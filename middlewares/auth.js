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
