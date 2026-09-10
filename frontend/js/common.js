const API_BASE = "/api";

function getToken() { return localStorage.getItem("token"); }
function getUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}
function setAuth(userData) {
  const { token, ...user } = userData;
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html";
}
function requireAuth() {
  if (!getToken()) window.location.href = "login.html";
}

async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

function timeAgo(dateStr) {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  const intervals = [
    ["y", 31536000], ["mo", 2592000], ["d", 86400], ["h", 3600], ["m", 60],
  ];
  for (const [label, secs] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count}${label} ago`;
  }
  return "just now";
}

function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.remove("show"), 2000);
}

function renderHeader() {
  const placeholder = document.getElementById("header-placeholder");
  if (!placeholder) return;

  const user = getUser();
  const path = window.location.pathname.split("/").pop();

  placeholder.innerHTML = `
    <header class="site-header" style="position: relative; z-index: 50;">
      <div class="header-inner" style="display: flex; justify-content: space-between; align-items: center;">
        <a class="logo" href="index.html"> <img id="logo" src="images/circlelogo.png" alt="Circle Logo" /> Circle</a>
        
        <!-- Search Bar (Now alone in the center) -->
        <div style="display: flex; align-items: center;">
          <div style="position: relative;">
            <input type="text" id="globalSearch" placeholder="Search users..." style="padding: 6px 12px; border-radius: 20px; border: 1px solid #334155; background: #0F172A; color: white; width: 200px; outline: none;">
            <div id="searchResults" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: #1E293B; border-radius: 8px; margin-top: 5px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); overflow: hidden;"></div>
          </div>
        </div>

        <!-- Navigation Links & Notification Bell -->
        <nav class="nav-links" style="display: flex; align-items: center; gap: 15px;">
          <a href="index.html" class="${path === "index.html" || path === "" ? "active" : ""}">Feed</a>
          ${
            user
              ? `
                 <a href="profile.html?username=${user.username}" class="${path === "profile.html" ? "active" : ""}">Profile</a>
                 
                 <!-- Sleek SVG Notification Bell -->
                 <div style="position: relative; display: flex; align-items: center;">
                   <button id="notifBellBtn" style="background: none; border: none; color: inherit; cursor: pointer; position: relative; padding: 4px; display: flex; align-items: center; transition: opacity 0.2s;">
                     <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                       <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                       <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                     </svg>
                     <span id="notifBadge" style="display: none; position: absolute; top: -2px; right: -2px; background: #E11D48; color: white; font-size: 0.6rem; font-weight: bold; padding: 2px 5px; border-radius: 10px;"></span>
                   </button>
                   
                   <div id="notifDropdown" style="display: none; position: absolute; top: 100%; right: -10px; width: 280px; background: #1E293B; border-radius: 8px; margin-top: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); max-height: 350px; overflow-y: auto; text-align: left; color: white; z-index: 100;">
                     <div style="padding: 10px; border-bottom: 1px solid #334155; font-weight: bold;">Notifications</div>
                     <div id="notifList"></div>
                   </div>
                 </div>

                 <a href="#" id="logout-link">Logout</a>`
              : `<a href="login.html">Login</a>
                 <a href="register.html">Register</a>`
          }
        </nav>
      </div>
    </header>
  `;

  // Attach Header Event Listeners
  if (user) {
    setupSearchAndNotifications();
    document.getElementById("logout-link").addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }
}

// Logic for Search and Notifications
function setupSearchAndNotifications() {
  const searchInput = document.getElementById("globalSearch");
  const searchResults = document.getElementById("searchResults");
  const notifBtn = document.getElementById("notifBellBtn");
  const notifDropdown = document.getElementById("notifDropdown");
  const notifList = document.getElementById("notifList");
  const notifBadge = document.getElementById("notifBadge");

  // Search Logic
  let searchTimeout;
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    if (!query) {
      searchResults.style.display = "none";
      return;
    }

    searchTimeout = setTimeout(async () => {
      try {
        const users = await apiFetch(`/users/search/query?q=${query}`);
        if (users.length === 0) {
          searchResults.innerHTML = `<div style="padding: 10px; color: var(--text-secondary); text-align: center;">No users found</div>`;
        } else {
          searchResults.innerHTML = users.map(u => `
            <a href="profile.html?username=${u.username}" style="display: flex; align-items: center; padding: 10px; text-decoration: none; border-bottom: 1px solid #334155; color: white;">
              <img src="${u.avatar}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover; margin-right: 10px;">
              <div>
                <div style="font-weight: bold; font-size: 0.9rem;">${escapeHtml(u.name)}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">@${u.username}</div>
              </div>
            </a>
          `).join("");
        }
        searchResults.style.display = "block";
      } catch (err) {
        console.error("Search error", err);
      }
    }, 300); // 300ms debounce
  });

  // Hide search results if clicked outside
  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.style.display = "none";
    }
    if (notifBtn && notifDropdown && !notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
      notifDropdown.style.display = "none";
    }
  });

  // Notification Logic
  async function fetchNotifications() {
    try {
      const notifs = await apiFetch("/users/me/notifications");
      const unreadCount = notifs.filter(n => !n.read).length;
      
      if (unreadCount > 0) {
        notifBadge.textContent = unreadCount;
        notifBadge.style.display = "block";
      } else {
        notifBadge.style.display = "none";
      }

      if (notifs.length === 0) {
        notifList.innerHTML = `<div style="padding: 15px; text-align: center; color: var(--text-secondary);">No notifications yet</div>`;
        return;
      }

      notifList.innerHTML = notifs.map(n => `
        <a href="profile.html?username=${n.sender.username}" style="display: flex; align-items: center; padding: 12px; text-decoration: none; border-bottom: 1px solid #334155; background: ${n.read ? 'transparent' : 'rgba(225, 29, 72, 0.1)'}; color: white; transition: background 0.2s;">
          <img src="${n.sender.avatar}" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover; margin-right: 12px;">
          <div style="font-size: 0.9rem;">
            <strong>${escapeHtml(n.sender.name)}</strong> started following you.
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${timeAgo(n.createdAt)}</div>
          </div>
        </a>
      `).join("");
    } catch (err) {
      console.error("Notification error", err);
    }
  }

  // Toggle Dropdown and mark as read
  notifBtn.addEventListener("click", async () => {
    const isHidden = notifDropdown.style.display === "none";
    notifDropdown.style.display = isHidden ? "block" : "none";
    
    if (isHidden && notifBadge.style.display === "block") {
      try {
        await apiFetch("/users/me/notifications/read", { method: "PUT" });
        notifBadge.style.display = "none"; 
      } catch (err) {
        console.error(err);
      }
    }
  });

  // Fetch notifications on load
  fetchNotifications();
}

document.addEventListener("DOMContentLoaded", renderHeader);