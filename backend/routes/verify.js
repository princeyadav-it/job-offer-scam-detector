const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const jwt = require("jsonwebtoken");

// JWT Secret - Use the same as auth.js for user verification
const JWT_SECRET = process.env.JWT_SECRET || "ai-offer-letter-verifier-secret-key-2024";

// Middleware to verify user token
const verifyUser = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ success: false, error: "No token provided. Please login." });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "user") {
      return res.status(403).json({ success: false, error: "Access denied" });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Invalid token. Please login." });
  }
};

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
    }
  }
});

/*
 POST /api/verify
 Node.js → Python (Extract Text) → Python (ML Prediction) → Result
 Protected route - requires user authentication
*/
router.post("/verify", verifyUser, upload.single('offerLetter'), (req, res) => {
  
  // Check if file was uploaded
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "No file uploaded. Please upload a PDF or Image file."
    });
  }

  const filePath = req.file.path;
  console.log("File uploaded:", req.file.filename);

  // Step 1: Extract text from the uploaded file
  const extractScriptPath = path.join(__dirname, "../ml/extract_text.py");
  const extractProcess = spawn("python", [extractScriptPath, filePath]);

  let extractedText = "";
  let extractError = "";

  extractProcess.stdout.on("data", (data) => {
    extractedText += data.toString();
  });

  extractProcess.stderr.on("data", (data) => {
    extractError += data.toString();
  });

  extractProcess.on("close", (code) => {
    if (extractError) {
      // Clean up uploaded file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(500).json({
        success: false,
        error: "Failed to extract text from file: " + extractError
      });
    }

    try {
      const extractResult = JSON.parse(extractedText);
      
      if (extractResult.error) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return res.status(400).json({
          success: false,
          error: extractResult.error
        });
      }

      const offerText = extractResult.text;
      console.log("Text extracted successfully, length:", offerText.length);

      // Step 2: Run ML prediction with extracted text
      const predictScriptPath = path.join(__dirname, "../ml/predict.py");
      const predictProcess = spawn("python", [predictScriptPath, offerText]);

      let resultData = "";
      let predictError = "";

      predictProcess.stdout.on("data", (data) => {
        resultData += data.toString();
      });

      predictProcess.stderr.on("data", (data) => {
        predictError += data.toString();
      });

      predictProcess.on("close", (code) => {
        // Clean up uploaded file
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        if (predictError) {
          return res.status(500).json({
            success: false,
            error: "ML prediction failed: " + predictError
          });
        }

        try {
          const aiResult = JSON.parse(resultData);

          // Update statistics in background (non-blocking)
          fetch("http://localhost:5000/api/admin/stats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: aiResult.status })
          }).catch(err => console.log("Stats update error:", err));

          res.json({
            success: true,
            aiResult
          });

        } catch (err) {
          res.status(500).json({
            success: false,
            error: "Invalid ML response"
          });
        }
      });

    } catch (err) {
      // Clean up uploaded file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      res.status(500).json({
        success: false,
        error: "Failed to process file"
      });
    }
  });
});

/*
 POST /api/generate-report
 Generate PDF report from verification results
 Protected route - requires user authentication
*/
router.post("/generate-report", verifyUser, (req, res) => {
  const { result } = req.body;
  
  if (!result) {
    return res.status(400).json({
      success: false,
      error: "No result data provided"
    });
  }

  // Call Python script to generate PDF
  const generatePdfScriptPath = path.join(__dirname, "../ml/generate_pdf.py");
  
  // Pass result as JSON string to Python
  const generateProcess = spawn("python", [generatePdfScriptPath, JSON.stringify(result)]);

  let pdfPath = "";
  let pdfError = "";

  generateProcess.stdout.on("data", (data) => {
    pdfPath += data.toString();
  });

  generateProcess.stderr.on("data", (data) => {
    pdfError += data.toString();
  });

  generateProcess.on("close", (code) => {
    if (pdfError) {
      console.error("PDF generation error:", pdfError);
      return res.status(500).json({
        success: false,
        error: "Failed to generate PDF report"
      });
    }

    // Clean up the path (remove newline characters)
    pdfPath = pdfPath.trim();
    
    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      return res.status(500).json({
        success: false,
        error: "PDF file was not created"
      });
    }

    // Send the file to client
    res.download(pdfPath, `offer_letter_verification_report_${Date.now()}.pdf`, (err) => {
      if (err) {
        console.error("Error sending PDF:", err);
        return res.status(500).json({
          success: false,
          error: "Failed to send PDF report"
        });
      }
      
      // Clean up the PDF file after sending
      try {
        fs.unlinkSync(pdfPath);
      } catch (unlinkErr) {
        console.error("Error deleting PDF:", unlinkErr);
      }
    });
  });
});

module.exports = router;
