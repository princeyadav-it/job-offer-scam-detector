const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json()); // VERY IMPORTANT

const verifyRoute = require("./routes/verify");
const chatbotRoute = require("./routes/chatbot");
const adminRoute = require("./routes/admin");
const authRoute = require("./routes/auth");
const usersRoute = require("./routes/users");

app.use("/api", verifyRoute);
app.use("/api", chatbotRoute);
app.use("/api", adminRoute);
app.use("/api", authRoute);
app.use("/api", usersRoute);

app.get("/", (req, res) => {
  res.send("Backend server is running ✅");
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/offer_verifier";

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
