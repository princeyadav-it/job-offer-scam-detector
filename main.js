document.addEventListener("DOMContentLoaded", () => {

  const fileInput = document.getElementById("fileInput");
  const fileName = document.getElementById("fileName");
  const verifyBtn = document.getElementById("verifyBtn");
  const loader = document.getElementById("loader");

  const resultBox = document.getElementById("resultBox");
  const resultStatus = document.getElementById("resultStatus");
  const resultMsg = document.getElementById("resultMsg");

  // ================= FILE SELECT =================
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      fileName.textContent = "Selected: " + fileInput.files[0].name;
      fileName.style.color = "#22c55e";
    } else {
      fileName.textContent = "No file selected";
      fileName.style.color = "#ef4444";
    }
  });

  // ================= VERIFY BUTTON =================
  verifyBtn.addEventListener("click", () => {

    if (fileInput.files.length === 0) {
      alert("Please select an offer letter file first.");
      return;
    }

    // Reset UI
    resultBox.style.display = "none";
    resultBox.className = "result";
    loader.style.display = "block";

    // Fake AI processing delay
    setTimeout(() => {

      loader.style.display = "none";
      resultBox.style.display = "block";

      const outcomes = ["Genuine", "Suspected", "Fake"];
      const result = outcomes[Math.floor(Math.random() * outcomes.length)];

      if (result === "Genuine") {
        resultBox.classList.add("genuine");
        resultStatus.innerHTML = "Genuine ✅";
        resultMsg.textContent =
          "This offer letter matches standard company formats and shows low risk.";
      }

      if (result === "Suspected") {
        resultBox.classList.add("suspected");
        resultStatus.innerHTML = "Suspected ⚠️";
        resultMsg.textContent =
          "Some details look suspicious. Please verify company credentials carefully.";
      }

      if (result === "Fake") {
        resultBox.classList.add("fake");
        resultStatus.innerHTML = "Fake ❌";
        resultMsg.textContent =
          "This offer letter shows strong scam indicators. Do not proceed.";
      }

    }, 2500); // 2.5 sec AI analysis simulation

  });

});

