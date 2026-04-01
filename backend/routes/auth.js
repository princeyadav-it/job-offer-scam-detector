const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// JWT Secret - use environment variable or default (matching admin route)
const JWT_SECRET = process.env.JWT_SECRET || "ai-offer-letter-verifier-secret-key-2024";
const JWT_EXPIRES_IN = "24h";

// Middleware to verify user token
const verifyUser = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ success: false, error: "No token provided" });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "user") {
      return res.status(403).json({ success: false, error: "Access denied" });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
};

/*
 POST /api/auth/signup
 Register a new user
*/
router.post("/auth/signup", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    console.log("Signup request received:", { fullName, email });

    // Validate required fields
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Full Name, Email, and Password are required"
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format"
      });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Email already registered"
      });
    }

    // Create new user
    const newUser = new User({
      fullName,
      email: email.toLowerCase(),
      password
    });

    // Save user (password will be hashed by pre-save middleware)
    await newUser.save();

    console.log("User saved successfully:", newUser._id);

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: "user" },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token: token,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        createdAt: newUser.createdAt
      }
    });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error during registration"
    });
  }
});

/*
 POST /api/auth/login
 User login
*/
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login request received:", { email });

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and Password are required"
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    console.log("User logged in successfully:", user._id);

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: "user" },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: "Login successful",
      token: token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error during login"
    });
  }
});

/*
 GET /api/auth/verify
 Verify user token (protected)
*/
router.get("/auth/verify", verifyUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error"
    });
  }
});

/*
 POST /api/auth/logout
 User logout (client-side token removal)
*/
router.post("/auth/logout", verifyUser, (req, res) => {
  res.json({
    success: true,
    message: "Logout successful"
  });
});

module.exports = router;
module.exports.verifyUser = verifyUser;
