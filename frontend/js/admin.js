// Admin JavaScript for Dashboard and Keyword Management

const API_URL = "http://localhost:5000/api";

// Store token
let authToken = localStorage.getItem("adminToken") || null;

// Check if already logged in
document.addEventListener("DOMContentLoaded", () => {
  if (authToken) {
    showDashboard();
    loadDashboardData();
  } else {
    showLogin();
  }
  
  setupTabs();
  setupEventListeners();
});

// Show Login Section
function showLogin() {
  document.getElementById("loginSection").style.display = "flex";
  document.getElementById("dashboardSection").style.display = "none";
}

// Show Dashboard
function showDashboard() {
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("dashboardSection").style.display = "block";
}

// Setup Tab Navigation
function setupTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      // Remove active class from all
      tabBtns.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));
      
      // Add active class to clicked
      btn.classList.add("active");
      const tabId = btn.getAttribute("data-tab");
      document.getElementById(tabId).classList.add("active");
    });
  });
}

// Setup Event Listeners
function setupEventListeners() {
  // Login Form
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
  
  // Logout Button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }
}

// Handle Login
async function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("loginError");
  
  errorMsg.textContent = "";
  
  try {
    const response = await fetch(`${API_URL}/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      authToken = data.token;
      localStorage.setItem("adminToken", authToken);
      showDashboard();
      loadDashboardData();
    } else {
      errorMsg.textContent = data.error || "Login failed";
    }
  } catch (err) {
    errorMsg.textContent = "Server error. Please try again.";
    console.error("Login error:", err);
  }
}

// Handle Logout
function handleLogout() {
  authToken = null;
  localStorage.removeItem("adminToken");
  showLogin();
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
}

// Load Dashboard Data
async function loadDashboardData() {
  try {
    // Load Statistics
    const statsResponse = await fetch(`${API_URL}/admin/dashboard`, {
      headers: {
        "Authorization": `Bearer ${authToken}`
      }
    });
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      if (statsData.success) {
        updateStatistics(statsData.statistics);
      }
    }
    
    // Load Keywords
    const keywordsResponse = await fetch(`${API_URL}/admin/keywords`, {
      headers: {
        "Authorization": `Bearer ${authToken}`
      }
    });
    
    if (keywordsResponse.ok) {
      const keywordsData = await keywordsResponse.json();
      if (keywordsData.success) {
        updateKeywordsDisplay(keywordsData.keywords);
      }
    }
    
    // Load Users
    loadUsers();
    
  } catch (err) {
    console.error("Error loading dashboard data:", err);
  }
}

// Load Users
async function loadUsers() {
  try {
    const response = await fetch(`${API_URL}/admin/users`, {
      headers: {
        "Authorization": `Bearer ${authToken}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        updateUsersDisplay(data.users);
      }
    }
  } catch (err) {
    console.error("Error loading users:", err);
  }
}

// Update Users Display with Modern Responsive Table
function updateUsersDisplay(users) {
  const totalUsers = document.getElementById("totalUsers");
  const usersTableBody = document.getElementById("usersTableBody");
  
  if (totalUsers) {
    totalUsers.textContent = users.length;
  }
  
  if (usersTableBody) {
    if (users.length === 0) {
      usersTableBody.innerHTML = '<tr class="empty-row"><td colspan="5"><i class="fas fa-users"></i> No users registered yet</td></tr>';
    } else {
      usersTableBody.innerHTML = users.map(user => {
        // Format dates properly
        const dateCreated = user.createdAt ? formatDate(user.createdAt) : 'N/A';
        const lastLogin = user.lastLogin ? formatDate(user.lastLogin) : 'Never';
        
        return `
          <tr>
            <td class="name-cell" data-label="Full Name">
              <i class="fas fa-user-circle" style="margin-right: 8px; color: #6366f1;"></i>
              ${escapeHtml(user.fullName)}
            </td>
            <td class="email-cell" data-label="Email">
              <i class="fas fa-envelope" style="margin-right: 8px; color: #64748b;"></i>
              ${escapeHtml(user.email)}
            </td>
            <td class="date-cell" data-label="Date Created">
              <i class="fas fa-calendar-alt" style="margin-right: 8px; color: #64748b;"></i>
              ${dateCreated}
            </td>
            <td class="date-cell" data-label="Last Login">
              <i class="fas fa-clock" style="margin-right: 8px; color: #64748b;"></i>
              ${lastLogin}
            </td>
            <td class="actions-cell" data-label="Actions">
              <button class="btn-delete" onclick="deleteUser('${user._id}')" data-tooltip="Delete User">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }
}

// Helper function to format dates
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Delete User
async function deleteUser(userId) {
  if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert("User deleted successfully");
      loadUsers();
    } else {
      alert(data.error || "Failed to delete user");
    }
  } catch (err) {
    console.error("Error deleting user:", err);
    alert("Server error");
  }
}

window.deleteUser = deleteUser;

// Update Statistics Display
function updateStatistics(stats) {
  document.getElementById("totalChecks").textContent = stats.total_checks || 0;
  document.getElementById("genuineCount").textContent = stats.genuine_count || 0;
  document.getElementById("suspectedCount").textContent = stats.suspected_count || 0;
  document.getElementById("fakeCount").textContent = stats.fake_count || 0;
  document.getElementById("scamPercentage").textContent = (stats.scam_detection_percentage || 0) + "%";
}

// Update Keywords Display
function updateKeywordsDisplay(keywords) {
  // Scam Keywords
  const scamKeywordsList = document.getElementById("scamKeywordsList");
  scamKeywordsList.innerHTML = keywords.scam_keywords.map(kw => 
    `<div class="keyword-item">
      <span>${escapeHtml(kw)}</span>
      <button onclick="removeKeyword('scam', '${escapeHtml(kw)}')">
        <i class="fas fa-trash"></i>
      </button>
    </div>`
  ).join("");
  
  // Suspicious Phrases
  const suspiciousPhrasesList = document.getElementById("suspiciousPhrasesList");
  suspiciousPhrasesList.innerHTML = keywords.suspicious_phrases.map(phrase => 
    `<div class="keyword-item">
      <span>${escapeHtml(phrase)}</span>
      <button onclick="removeKeyword('phrase', '${escapeHtml(phrase)}')">
        <i class="fas fa-trash"></i>
      </button>
    </div>`
  ).join("");
  
  // Suspicious Domains
  const suspiciousDomainsList = document.getElementById("suspiciousDomainsList");
  suspiciousDomainsList.innerHTML = keywords.suspicious_domains.map(domain => 
    `<div class="keyword-item">
      <span>${escapeHtml(domain)}</span>
      <button onclick="removeKeyword('domain', '${escapeHtml(domain)}', 'suspicious')">
        <i class="fas fa-trash"></i>
      </button>
    </div>`
  ).join("");
  
  // Legitimate Domains
  const legitimateDomainsList = document.getElementById("legitimateDomainsList");
  legitimateDomainsList.innerHTML = keywords.legitimate_domains.map(domain => 
    `<div class="keyword-item">
      <span>${escapeHtml(domain)}</span>
      <button onclick="removeKeyword('domain', '${escapeHtml(domain)}', 'legitimate')">
        <i class="fas fa-trash"></i>
      </button>
    </div>`
  ).join("");
}

// Add Keyword
async function addKeyword(type, domainType = null) {
  let endpoint, inputId, payload = {};
  
  if (type === "scam") {
    const input = document.getElementById("newScamKeyword");
    if (!input.value.trim()) return alert("Please enter a keyword");
    endpoint = `${API_URL}/admin/keywords/scam`;
    payload = { keyword: input.value.trim() };
    input.value = "";
  } else if (type === "phrase") {
    const input = document.getElementById("newSuspiciousPhrase");
    if (!input.value.trim()) return alert("Please enter a phrase");
    endpoint = `${API_URL}/admin/keywords/phrase`;
    payload = { phrase: input.value.trim() };
    input.value = "";
  } else if (type === "domain") {
    const input = document.getElementById(domainType === "suspicious" ? "newSuspiciousDomain" : "newLegitimateDomain");
    if (!input.value.trim()) return alert("Please enter a domain");
    endpoint = `${API_URL}/admin/keywords/domain`;
    payload = { domain: input.value.trim(), type: domainType };
    input.value = "";
  }
  
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert(data.message);
      loadDashboardData(); // Reload to show changes
    } else {
      alert(data.error || "Failed to add");
    }
  } catch (err) {
    console.error("Error adding keyword:", err);
    alert("Server error");
  }
}

// Remove Keyword
async function removeKeyword(type, value, domainType = null) {
  if (!confirm(`Are you sure you want to remove "${value}"?`)) return;
  
  let endpoint, payload = {};
  
  if (type === "scam") {
    endpoint = `${API_URL}/admin/keywords/scam`;
    payload = { keyword: value };
  } else if (type === "phrase") {
    endpoint = `${API_URL}/admin/keywords/phrase`;
    payload = { phrase: value };
  } else if (type === "domain") {
    endpoint = `${API_URL}/admin/keywords/domain`;
    payload = { domain: value, type: domainType };
  }
  
  try {
    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert(data.message);
      loadDashboardData(); // Reload to show changes
    } else {
      alert(data.error || "Failed to remove");
    }
  } catch (err) {
    console.error("Error removing keyword:", err);
    alert("Server error");
  }
}

// Make functions global for onclick handlers
window.addKeyword = addKeyword;
window.removeKeyword = removeKeyword;
