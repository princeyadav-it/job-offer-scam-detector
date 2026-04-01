document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const fileInput = document.getElementById("fileInput");
  const fileName = document.getElementById("fileName");
  const verifyBtn = document.getElementById("verifyBtn");
  const loader = document.getElementById("loader");
  const resultBox = document.getElementById("resultBox");
  const resultStatus = document.getElementById("resultStatus");
  const resultMsg = document.getElementById("resultMsg");
  const downloadReportBtn = document.getElementById("downloadReportBtn");
  const detailedAnalysis = document.getElementById("detailedAnalysis");
  const domainDetails = document.getElementById("domainDetails");
  const mlDetails = document.getElementById("mlDetails");

  // Store current result for PDF download
  let currentResult = null;

  // ================= SCROLL-BASED UI CONTROLS =================
  const chatbotToggle = document.getElementById("chatbotToggle");
  const backToTopBtn = document.querySelector(".back-to-top");
  let scrollTimeout;
  
  function handleScroll() {
    const scrollY = window.scrollY;
    
    // Show back-to-top button when scrolling down
    if (scrollY > 300) {
      backToTopBtn.style.opacity = '1';
      backToTopBtn.style.pointerEvents = 'auto';
    } else {
      backToTopBtn.style.opacity = '0';
      backToTopBtn.style.pointerEvents = 'none';
    }
    
    // Auto-hide back-to-top after 3 seconds of no scrolling
    clearTimeout(scrollTimeout);
    if (scrollY > 300) {
      scrollTimeout = setTimeout(() => {
        backToTopBtn.style.opacity = '0';
        backToTopBtn.style.pointerEvents = 'none';
      }, 3000);
    }
  }
  
  // Add scroll event listener with passive optimization
  window.addEventListener("scroll", handleScroll, { passive: true });
  
  // Initial check
  handleScroll();

  // Toggle mobile menu
  window.toggleMenu = () => {
    const nav = document.getElementById("navMenu");
    nav.classList.toggle("active");
  };

  // Back to Top function
  window.scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ================= FILE SELECT =================
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert("Please select a valid PDF or Image file.");
        fileInput.value = "";
        fileName.textContent = "No file selected";
        fileName.style.color = "#ef4444";
        return;
      }
      fileName.textContent = "Selected: " + file.name;
      fileName.style.color = "#22c55e";
      console.log("File selected:", file.name);
    } else {
      fileName.textContent = "No file selected";
      fileName.style.color = "#ef4444";
    }
  });

  // ================= VERIFY BUTTON =================
  verifyBtn.addEventListener("click", async () => {
    if (fileInput.files.length === 0) {
      alert("Please select an offer letter file first.");
      return;
    }

    console.log("Starting verification...");

    // Reset UI
    resultBox.style.display = "none";
    resultBox.className = "result";
    loader.style.display = "block";
    downloadReportBtn.style.display = "none";
    detailedAnalysis.style.display = "none";

    // Create FormData to send file to backend
    const formData = new FormData();
    formData.append("offerLetter", fileInput.files[0]);

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch("http://localhost:5000/api/verify", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      loader.style.display = "none";
      resultBox.style.display = "block";

      if (data.success) {
        const result = data.aiResult;
        currentResult = result;
        
        console.log("Verification result:", result);

        if (result.status === "Genuine") {
          resultBox.classList.add("genuine");
          document.getElementById("resultIcon").className = "fas fa-check-circle";
          resultStatus.textContent = "✅ " + result.status;
          resultMsg.textContent = "This offer letter appears to be genuine with low risk indicators.";
          document.getElementById("confidence").textContent = "🔥 Confidence: " + result.confidence + "%";
          document.getElementById("tips").textContent = "💡 " + result.reasons.join(", ");
        } else if (result.status === "Suspected") {
          resultBox.classList.add("suspected");
          document.getElementById("resultIcon").className = "fas fa-exclamation-triangle";
          resultStatus.textContent = "⚠️ " + result.status;
          resultMsg.textContent = "This offer letter has some suspicious elements. Please verify carefully.";
          document.getElementById("confidence").textContent = "🔥 Confidence: " + result.confidence + "%";
          document.getElementById("tips").textContent = "💡 " + result.reasons.join(", ");
        } else {
          resultBox.classList.add("fake");
          document.getElementById("resultIcon").className = "fas fa-times-circle";
          resultStatus.textContent = "❌ " + result.status;
          resultMsg.textContent = "This offer letter shows high-risk scam indicators. Do not proceed.";
          document.getElementById("confidence").textContent = "🔥 Confidence: " + result.confidence + "%";
          document.getElementById("tips").textContent = "💡 " + result.reasons.join(", ");
        }

        displayDetailedAnalysis(result);
        downloadReportBtn.style.display = "inline-block";

      } else {
        resultBox.classList.add("fake");
        document.getElementById("resultIcon").className = "fas fa-times-circle";
        resultStatus.textContent = "❌ Error";
        resultMsg.textContent = data.error || "Failed to verify offer letter";
        document.getElementById("confidence").textContent = "Confidence: 0%";
        document.getElementById("tips").textContent = "Tip: Please try again with a valid file.";
      }

      console.log("Result shown successfully.");

    } catch (error) {
      console.error("Error:", error);
      loader.style.display = "none";
      resultBox.style.display = "block";
      resultBox.classList.add("fake");
      document.getElementById("resultIcon").className = "fas fa-times-circle";
      resultStatus.textContent = "❌ Error";
      resultMsg.textContent = "Failed to connect to server. Make sure the backend is running.";
      document.getElementById("confidence").textContent = "Confidence: 0%";
      document.getElementById("tips").textContent = "Tip: Start the backend server and try again.";
    }
  });

  // ================= DISPLAY DETAILED ANALYSIS =================
  function displayDetailedAnalysis(result) {
    detailedAnalysis.style.display = "block";
    
    const domainCheck = result.domain_check;
    if (domainCheck && domainCheck.found) {
      const isLegitimate = domainCheck.is_legitimate;
      const isSuspicious = domainCheck.is_suspicious;
      const domains = domainCheck.domains || [];
      
      let statusIcon = "";
      let statusText = "";
      if (isLegitimate) {
        statusIcon = "✅";
        statusText = "Verified Legitimate";
      } else if (isSuspicious) {
        statusIcon = "⚠️";
        statusText = "Suspicious";
      } else {
        statusIcon = "❓";
        statusText = "Unknown";
      }
      
      domainDetails.innerHTML = `
        <p><strong>📧 Domain Found:</strong> ${domains.join(", ") || "N/A"}</p>
        <p><strong>🎯 Status:</strong> ${statusIcon} ${statusText}</p>
        <p><strong>✅ Is Legitimate:</strong> ${isLegitimate ? "✅ Yes" : "❌ No"}</p>
        <p><strong>❌ Is Suspicious:</strong> ${isSuspicious ? "❌ Yes" : "✅ No"}</p>
        <p><strong>💡 Reason:</strong> ${domainCheck.reason || "No reason provided"}</p>
      `;
    } else {
      domainDetails.innerHTML = `
        <p><strong>Domain Found:</strong> ❌ No</p>
        <p><strong>Status:</strong> ❌ No company email domain found in document</p>
        <p><strong>Recommendation:</strong> Verify company details manually</p>
      `;
    }

    const detailed = result.detailed_analysis;
    if (detailed) {
      const scamKeywords = detailed.scam_keywords_found || [];
      const suspiciousPhrases = detailed.suspicious_phrases_found || [];
      
      mlDetails.innerHTML = `
        <p><strong>🤖 ML Model Prediction:</strong> ${detailed.ml_prediction || "N/A"}</p>
        <p><strong>📊 ML Model Confidence:</strong> ${detailed.ml_confidence || 0}%</p>
        <p><strong>🚨 Scam Keywords Found:</strong> ${scamKeywords.length > 0 ? "❌ " + scamKeywords.join(", ") : "✅ None"}</p>
        <p><strong>⚠️ Suspicious Phrases:</strong> ${suspiciousPhrases.length > 0 ? "❌ " + suspiciousPhrases.join(", ") : "✅ None"}</p>
      `;
    } else {
      mlDetails.innerHTML = `<p>No detailed ML analysis available</p>`;
    }
  }

  // ================= DOWNLOAD REPORT =================
  downloadReportBtn.addEventListener("click", async () => {
    if (!currentResult) {
      alert("No result available to download");
      return;
    }

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch("http://localhost:5000/api/generate-report", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ result: currentResult })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `offer_verification_report_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Failed to generate report");
      }
    } catch (error) {
      console.error("Error downloading report:", error);
      alert("Error downloading report. Make sure backend is running.");
    }
  });

  // ================= CHATBOT FUNCTIONALITY =================
  const chatbotWindow = document.getElementById("chatbotWindow");
  const chatbotClose = document.getElementById("chatbotClose");
  const chatbotInput = document.getElementById("chatbotInput");
  const chatbotSend = document.getElementById("chatbotSend");
  const chatbotMessages = document.getElementById("chatbotMessages");

  // Toggle chatbot
  chatbotToggle.addEventListener("click", () => {
    chatbotWindow.classList.toggle("active");
  });

  chatbotClose.addEventListener("click", () => {
    chatbotWindow.classList.remove("active");
  });

  // Send message
  async function sendMessage() {
    const message = chatbotInput.value.trim();
    if (!message) return;

    addMessage(message, "user");
    chatbotInput.value = "";
    addMessage("Thinking...", "bot", true);

    try {
      const response = await fetch("http://localhost:5000/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message })
      });

      const data = await response.json();
      
      if (chatbotMessages.lastElementChild) {
        chatbotMessages.lastElementChild.remove();
      }
      
      if (data.success) {
        addMessage(data.response, "bot");
      } else {
        addMessage("Sorry, I couldn't process your request. Please try again.", "bot");
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      if (chatbotMessages.lastElementChild) {
        chatbotMessages.lastElementChild.remove();
      }
      addMessage("I'm having trouble connecting. Make sure the backend is running!", "bot");
    }
  }

  function addMessage(text, sender, isLoading = false) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `chatbot-message ${sender}`;
    if (isLoading) {
      messageDiv.innerHTML = `<p><i class="fas fa-spinner fa-spin"></i> ${text}</p>`;
    } else {
      messageDiv.innerHTML = `<p>${text}</p>`;
    }
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  chatbotSend.addEventListener("click", sendMessage);
  chatbotInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
});
