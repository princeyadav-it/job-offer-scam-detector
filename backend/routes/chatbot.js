

const express = require("express");
const router = express.Router();

// FAQ data for the chatbot
const faqData = {
  "what is this": "This is an AI-Based Offer Letter & Company Verifier that helps you verify job offer letters using Artificial Intelligence and Machine Learning.",
  
  "how does it work": "Simply upload your job offer letter (PDF or Image), and our AI system will analyze it for suspicious keywords, company details, email domains, and document patterns to determine if it's Genuine, Suspected, or Fake.",
  
  "how to use": "1. Go to the Verify section\n2. Upload your offer letter (PDF or Image)\n3. Click 'Verify Offer Letter'\n4. Wait for the AI analysis\n5. View the results and download a PDF report",
  
  "is it free": "Yes, this service is currently free to use for all job seekers.",
  
  "what file formats": "We accept PDF, JPG, and PNG file formats for offer letter verification.",
  
  "how accurate": "Our AI model has been trained on thousands of real and fake offer letters. The accuracy varies, but it provides a good preliminary screening. Always verify company details independently.",
  
  "what do the results mean": "The results show:\n- Genuine: Low risk indicators\n- Suspected: Medium risk, some suspicious elements\n- Fake: High risk, multiple red flags detected\n\nEach result includes confidence level and specific reasons.",
  
  "can i download report": "Yes! After verification, you can download a PDF report with detailed analysis of your offer letter.",
  
  "is my data safe": "We process your documents locally and do not store them permanently. Your privacy is important to us.",
  
  "what are scam keywords": "Scam keywords are suspicious words or phrases often found in fake offer letters like 'urgent', 'guaranteed', 'no experience required', 'high salary', 'easy money', etc.",
  
  "what is suspicious email domain": "Suspicious email domains are free email services like Gmail, Yahoo, Hotmail, etc., which are commonly used by scammers. Legitimate companies usually use their own corporate email domains.",
  
  "how to identify fake offer": "Look for these red flags:\n- Free email domains (gmail, yahoo)\n- Urgency language\n- Unrealistic salary promises\n- Requests for money\n- Poor grammar/spelling\n- No company website verification",
  
  "contact": "For support, you can reach us at princeyadav80910@gmail.com or call +91 8591063262.",
  
  "thank": "You're welcome! If you have more questions, feel free to ask.",
  
  "thanks": "You're welcome! If you have more questions, feel free to ask.",
  
  "bye": "Goodbye! Stay safe and best of luck with your job search!"
};

// Default responses for unmatched queries
const defaultResponses = [
  "I'm not sure about that. Try asking about how to use the verifier, what the results mean, or how to identify fake offers.",
  "That's an interesting question! You can ask me about:\n- How the verifier works\n- What the results mean\n- How to identify fake offers\n- What file formats are accepted",
  "I don't have information about that. You can ask me about the verification process, results interpretation, or general FAQ about the system."
];

/*
 POST /api/chatbot
 Chatbot API endpoint for answering questions
*/
router.post("/chatbot", (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({
      success: false,
      error: "No message provided"
    });
  }

  // Normalize the message
  const normalizedMessage = message.toLowerCase().trim();
  
  // Find matching FAQ response
  let response = null;
  
  // Check for exact or partial matches
  for (const [key, value] of Object.entries(faqData)) {
    if (normalizedMessage.includes(key)) {
      response = value;
      break;
    }
  }
  
  // If no match found, return a default response
  if (!response) {
    // Use a pseudo-random response based on message length
    const index = normalizedMessage.length % defaultResponses.length;
    response = defaultResponses[index];
  }
  
  // Add typing delay simulation (optional)
  setTimeout(() => {
    res.json({
      success: true,
      response: response,
      timestamp: new Date().toISOString()
    });
  }, 500); // 500ms delay to simulate thinking
});

/*
 GET /api/chatbot/topics
 Get list of available topics the chatbot can answer
*/
router.get("/chatbot/topics", (req, res) => {
  const topics = Object.keys(faqData).map(topic => ({
    topic: topic,
    preview: faqData[topic].substring(0, 50) + "..."
  }));
  
  res.json({
    success: true,
    topics: topics
  });
});

module.exports = router;
