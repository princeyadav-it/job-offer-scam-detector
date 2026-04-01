const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// JWT Secret - Use the same as admin.js for admin verification
const JWT_SECRET = process.env.JWT_SECRET || "ai-offer-letter-verifier-secret-key-2024";

// Middleware to verify admin token
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ success: false, error: "No token provided" });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ success: false, error: "Access denied" });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
};

/*
 GET /api/admin/users
 Get all registered users (protected)
*/
router.get("/admin/users", verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    
    res.json({
      success: true,
      users: users,
      total: users.length
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch users"
    });
  }
});

/*
 GET /api/admin/users/count
 Get total registered users count (protected)
*/
router.get("/admin/users/count", verifyAdmin, async (req, res) => {
  try {
    const count = await User.countDocuments();
    
    res.json({
      success: true,
      totalUsers: count
    });
  } catch (error) {
    console.error("Get user count error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get user count"
    });
  }
});

/*
 DELETE /api/admin/users/:id
 Delete a user account (protected)
*/
router.delete("/admin/users/:id", verifyAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    await User.findByIdAndDelete(userId);
    
    res.json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete user"
    });
  }
});

module.exports = router;
