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
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
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
    <header class="site-header">
      <div class="header-inner">
        <a class="logo" href="index.html">Circle</a>
        <nav class="nav-links">
          <a href="index.html" class="${path === "index.html" || path === "" ? "active" : ""}">Feed</a>
          ${
            user
              ? `<a href="profile.html?username=${user.username}" class="${path === "profile.html" ? "active" : ""}">Profile</a>
                 <a href="#" id="logout-link">Logout</a>`
              : `<a href="login.html">Login</a>
                 <a href="register.html">Register</a>`
          }
        </nav>
      </div>
    </header>
  `;

  const logoutLink = document.getElementById("logout-link");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }
}

document.addEventListener("DOMContentLoaded", renderHeader);
