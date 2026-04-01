const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

// Path to keywords data file
const dataDir = path.join(__dirname, "../data");
const keywordsFile = path.join(dataDir, "keywords.json");

// Secret key for JWT (in production, use environment variable)
const JWT_SECRET = "ai-offer-letter-verifier-secret-key-2024";

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

// Helper function to read keywords data
const readKeywordsData = () => {
  try {
    const data = fs.readFileSync(keywordsFile, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
};

// Helper function to write keywords data
const writeKeywordsData = (data) => {
  try {
    fs.writeFileSync(keywordsFile, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error("Error writing keywords file:", err);
    return false;
  }
};

/*
 POST /api/admin/login
 Admin login endpoint
*/
router.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      error: "Username and password are required" 
    });
  }
  
  const data = readKeywordsData();
  if (!data) {
    return res.status(500).json({ 
      success: false, 
      error: "Unable to read database" 
    });
  }
  
  // Check credentials (simple comparison - in production use bcrypt)
  if (username === data.admin.username && password === "admin123") {
    // Generate JWT token
    const token = jwt.sign(
      { username: username, role: "admin" },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    
    return res.json({
      success: true,
      message: "Login successful",
      token: token
    });
  }
  
  return res.status(401).json({ 
    success: false, 
    error: "Invalid credentials" 
  });
});

/*
 GET /api/admin/dashboard
 Get admin dashboard statistics (protected)
*/
router.get("/admin/dashboard", verifyAdmin, (req, res) => {
  const data = readKeywordsData();
  if (!data) {
    return res.status(500).json({ 
      success: false, 
      error: "Unable to read database" 
    });
  }
  
  const stats = data.statistics || {
    total_checks: 0,
    genuine_count: 0,
    suspected_count: 0,
    fake_count: 0
  };
  
  // Calculate scam detection percentage
  const scam_percentage = stats.total_checks > 0 
    ? ((stats.fake_count + stats.suspected_count) / stats.total_checks * 100).toFixed(2)
    : 0;
  
  res.json({
    success: true,
    statistics: {
      ...stats,
      scam_detection_percentage: parseFloat(scam_percentage)
    }
  });
});

/*
 GET /api/admin/keywords
 Get all keywords (protected)
*/
router.get("/admin/keywords", verifyAdmin, (req, res) => {
  const data = readKeywordsData();
  if (!data) {
    return res.status(500).json({ 
      success: false, 
      error: "Unable to read database" 
    });
  }
  
  res.json({
    success: true,
    keywords: {
      scam_keywords: data.scam_keywords || [],
      suspicious_phrases: data.suspicious_phrases || [],
      suspicious_domains: data.suspicious_domains || [],
      legitimate_domains: data.legitimate_domains || []
    }
  });
});

/*
 POST /api/admin/keywords/scam
 Add a new scam keyword (protected)
*/
router.post("/admin/keywords/scam", verifyAdmin, (req, res) => {
  const { keyword } = req.body;
  
  if (!keyword || typeof keyword !== "string") {
    return res.status(400).json({ 
      success: false, 
      error: "Valid keyword is required" 
    });
  }
  
  const data = readKeywordsData();
  if (!data) {
    return res.status(500).json({ 
      success: false, 
      error: "Unable to read database" 
    });
  }
  
  const normalizedKeyword = keyword.toLowerCase().trim();
  
  // Check if keyword already exists
  if (data.scam_keywords.includes(normalizedKeyword)) {
    return res.status(400).json({ 
      success: false, 
      error: "Keyword already exists" 
    });
  }
  
  // Add keyword
  data.scam_keywords.push(normalizedKeyword);
  
  if (!writeKeywordsData(data)) {
    return res.status(500).json({ 
      success: false, 
      error: "Failed to save keyword" 
    });
  }
  
  res.json({
    success: true,
    message: "Scam keyword added successfully",
    keyword: normalizedKeyword
  });
});

/*
 DELETE /api/admin/keywords/scam
 Remove a scam keyword (protected)
*/
router.delete("/admin/keywords/scam", verifyAdmin, (req, res) => {
  const { keyword } = req.body;
  
  if (!keyword || typeof keyword !== "string") {
    return res.status(400).json({ 
      success: false, 
      error: "Valid keyword is required" 
    });
  }
  
  const data = readKeywordsData();
  if (!data) {
    return res.status(500).json({ 
      success: false, 
      error: "Unable to read database" 
    });
  }
  
  const normalizedKeyword = keyword.toLowerCase().trim();
  const index = data.scam_keywords.indexOf(normalizedKeyword);
  
  if (index === -1) {
    return res.status(404).json({ 
      success: false, 
      error: "Keyword not found" 
    });
  }
  
  // Remove keyword
  data.scam_keywords.splice(index, 1);
  
  if (!writeKeywordsData(data)) {
    return res.status(500).json({ 
      success: false, 
      error: "Failed to save changes" 
    });
  }
  
  res.json({
    success: true,
    message: "Scam keyword removed successfully",
    keyword: normalizedKeyword
  });
});

/*
 POST /api/admin/keywords/phrase
 Add a new suspicious phrase (protected)
*/
router.post("/admin/keywords/phrase", verifyAdmin, (req, res) => {
  const { phrase } = req.body;
  
  if (!phrase || typeof phrase !== "string") {
    return res.status(400).json({ 
      success: false, 
      error: "Valid phrase is required" 
    });
  }
  
  const data = readKeywordsData();
  if (!data) {
    return res.status(500).json({ 
      success: false, 
      error: "Unable to read database" 
    });
  }
  
  const normalizedPhrase = phrase.toLowerCase().trim();
  
  if (data.suspicious_phrases.includes(normalizedPhrase)) {
    return res.status(400).json({ 
      success: false, 
      error: "Phrase already exists" 
    });
  }
  
  data.suspicious_phrases.push(normalizedPhrase);
  
  if (!writeKeywordsData(data)) {
    return res.status(500).json({ 
      success: false, 
      error: "Failed to save phrase" 
    });
  }
  
  res.json({
    success: true,
    message: "Suspicious phrase added successfully"
  });
});

/*
 DELETE /api/admin/keywords/phrase
 Remove a suspicious phrase (protected)
*/
router.delete("/admin/keywords/phrase", verifyAdmin, (req, res) => {
  const { phrase } = req.body;
  
  if (!phrase || typeof phrase !== "string") {
    return res.status(400).json({ 
      success: false, 
      error: "Valid phrase is required" 
    });
  }
  
  const data = readKeywordsData();
  if (!data) {
    return res.status(500).json({ 
      success: false, 
      error: "Unable to read database" 
    });
  }
  
  const normalizedPhrase = phrase.toLowerCase().trim();
  const index = data.suspicious_phrases.indexOf(normalizedPhrase);
  
  if (index === -1) {
    return res.status(404).json({ 
      success: false, 
      error: "Phrase not found" 
    });
  }
  
  data.suspicious_phrases.splice(index, 1);
  
  if (!writeKeywordsData(data)) {
    return res.status(500).json({ 
      success: false, 
      error: "Failed to save changes" 
    });
  }
  
  res.json({
    success: true,
    message: "Suspicious phrase removed successfully"
  });
});

/*
 POST /api/admin/keywords/domain
 Add a new domain (suspicious or legitimate) (protected)
*/
router.post("/admin/keywords/domain", verifyAdmin, (req, res) => {
  const { domain, type } = req.body;
  
  if (!domain || typeof domain !== "string") {
    return res.status(400).json({ 
      success: false, 
      error: "Valid domain is required" 
    });
  }
  
  if (!type || !["suspicious", "legitimate"].includes(type)) {
    return res.status(400).json({ 
      success: false, 
      error: "Type must be 'suspicious' or 'legitimate'" 
    });
  }
  
  const data = readKeywordsData();
  if (!data) {
    return res.status(500).json({ 
      success: false, 
      error: "Unable to read database" 
    });
  }
  
  const normalizedDomain = domain.toLowerCase().trim();
  const targetList = type === "suspicious" ? "suspicious_domains" : "legitimate_domains";
  
  if (data[targetList].includes(normalizedDomain)) {
    return res.status(400).json({ 
      success: false, 
      error: "Domain already exists in " + type + " list" 
    });
  }
  
  data[targetList].push(normalizedDomain);
  
  if (!writeKeywordsData(data)) {
    return res.status(500).json({ 
      success: false, 
      error: "Failed to save domain" 
    });
  }
  
  res.json({
    success: true,
    message: "Domain added to " + type + " list successfully"
  });
});

/*
 DELETE /api/admin/keywords/domain
 Remove a domain (protected)
*/
router.delete("/admin/keywords/domain", verifyAdmin, (req, res) => {
  const { domain, type } = req.body;
  
  if (!domain || typeof domain !== "string") {
    return res.status(400).json({ 
      success: false, 
      error: "Valid domain is required" 
    });
  }
  
  if (!type || !["suspicious", "legitimate"].includes(type)) {
    return res.status(400).json({ 
      success: false, 
      error: "Type must be 'suspicious' or 'legitimate'" 
    });
  }
  
  const data = readKeywordsData();
  if (!data) {
    return res.status(500).json({ 
      success: false, 
      error: "Unable to read database" 
    });
  }
  
  const normalizedDomain = domain.toLowerCase().trim();
  const targetList = type === "suspicious" ? "suspicious_domains" : "legitimate_domains";
  const index = data[targetList].indexOf(normalizedDomain);
  
  if (index === -1) {
    return res.status(404).json({ 
      success: false, 
      error: "Domain not found in " + type + " list" 
    });
  }
  
  data[targetList].splice(index, 1);
  
  if (!writeKeywordsData(data)) {
    return res.status(500).json({ 
      success: false, 
      error: "Failed to save changes" 
    });
  }
  
  res.json({
    success: true,
    message: "Domain removed from " + type + " list successfully"
  });
});

/*
 POST /api/admin/stats
 Update statistics after verification (called internally)
*/
router.post("/admin/stats", (req, res) => {
  const { status } = req.body;
  
  if (!status || !["Genuine", "Suspected", "Fake"].includes(status)) {
    return res.status(400).json({ 
      success: false, 
      error: "Valid status is required" 
    });
  }
  
  const data = readKeywordsData();
  if (!data) {
    return res.status(500).json({ 
      success: false, 
      error: "Unable to read database" 
    });
  }
  
  // Initialize statistics if not exists
  if (!data.statistics) {
    data.statistics = {
      total_checks: 0,
      genuine_count: 0,
      suspected_count: 0,
      fake_count: 0
    };
  }
  
  // Update statistics
  data.statistics.total_checks++;
  if (status === "Genuine") {
    data.statistics.genuine_count++;
  } else if (status === "Suspected") {
    data.statistics.suspected_count++;
  } else if (status === "Fake") {
    data.statistics.fake_count++;
  }
  
  if (!writeKeywordsData(data)) {
    return res.status(500).json({ 
      success: false, 
      error: "Failed to update statistics" 
    });
  }
  
  res.json({
    success: true,
    message: "Statistics updated"
  });
});

module.exports = router;
