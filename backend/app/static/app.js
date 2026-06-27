const toast = document.getElementById("toast");
const loginPanel = document.getElementById("login-panel");
const registerPanel = document.getElementById("register-panel");
const profileOutput = document.getElementById("profile-output");
const usersList = document.getElementById("users-list");
const sessionEmail = document.getElementById("session-email");

const tokenKey = "lorisark_token";

const showToast = (message, tone = "default") => {
  toast.textContent = message;
  toast.classList.add("show");
  toast.style.background = tone === "error" ? "#c02626" : "#111827";
  setTimeout(() => toast.classList.remove("show"), 2800);
};

const setToken = (token) => {
  if (token) {
    localStorage.setItem(tokenKey, token);
  } else {
    localStorage.removeItem(tokenKey);
  }
};

const getToken = () => localStorage.getItem(tokenKey);

const apiFetch = async (endpoint, options = {}) => {
  const headers = options.headers || {};
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(endpoint, { ...options, headers });
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = body?.detail || body?.message || body || "Request failed";
    throw new Error(message);
  }
  return body;
};

const switchTab = (target) => {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === target);
  });
  loginPanel.classList.toggle("hidden", target !== "login");
  registerPanel.classList.toggle("hidden", target !== "register");
};

const updateSession = async () => {
  const token = getToken();
  if (!token) {
    sessionEmail.textContent = "Not signed in";
    profileOutput.innerHTML = '<p class="muted">Sign in to see your profile details.</p>';
    usersList.innerHTML = '<p class="muted">Sign in to load users.</p>';
    return;
  }

  try {
    const profile = await apiFetch("/profile");
    sessionEmail.textContent = profile.email;
    profileOutput.innerHTML = `
      <div>
        <strong>${profile.full_name}</strong>
        <small>${profile.email}</small>
      </div>
    `;
    await loadUsers();
  } catch (error) {
    showToast(error.message, "error");
  }
};

const loadUsers = async () => {
  const users = await apiFetch("/users");
  if (!Array.isArray(users) || users.length === 0) {
    usersList.innerHTML = '<p class="muted">No users registered yet.</p>';
    return;
  }
  usersList.innerHTML = users
    .map(
      (user) => `
      <div class="user-row">
        <div>
          <strong>${user.full_name}</strong>
          <small>${user.email}</small>
        </div>
        <div class="user-actions">
          <button class="secondary" data-edit="${user.id}">Edit</button>
          <button class="secondary" data-delete="${user.id}">Delete</button>
        </div>
      </div>
    `
    )
    .join("");
};

const animateReveal = () => {
  const items = document.querySelectorAll("[data-reveal]");
  items.forEach((item, index) => {
    setTimeout(() => item.classList.add("is-visible"), 120 * index);
  });
};

// Tabs
Array.from(document.querySelectorAll(".tab")).forEach((tab) => {
  tab.addEventListener("click", () => switchTab(tab.dataset.tab));
});

// Login
loginPanel.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = loginPanel.querySelector("[name='login-email']").value.trim();
  const password = loginPanel
    .querySelector("[name='login-password']")
    .value.trim();
  try {
    const data = await apiFetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setToken(data.access_token);
    showToast("Welcome back!", "success");
    await updateSession();
  } catch (error) {
    showToast(error.message, "error");
  }
});

// Register
registerPanel.addEventListener("submit", async (event) => {
  event.preventDefault();
  const full_name = registerPanel
    .querySelector("[name='register-name']")
    .value.trim();
  const email = registerPanel
    .querySelector("[name='register-email']")
    .value.trim();
  const password = registerPanel
    .querySelector("[name='register-password']")
    .value.trim();
  try {
    await apiFetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, full_name, password }),
    });
    showToast("Account created. Please log in.");
    switchTab("login");
  } catch (error) {
    showToast(error.message, "error");
  }
});

// Profile update
const profileForm = document.getElementById("profile-form");
profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const fullName = profileForm
    .querySelector("[name='profile-name']")
    .value.trim();
  const password = profileForm
    .querySelector("[name='profile-password']")
    .value.trim();

  const params = new URLSearchParams();
  params.set("full_name", fullName);
  if (password) {
    params.set("password", password);
  }

  try {
    await apiFetch(`/profile?${params.toString()}`, {
      method: "PUT",
    });
    showToast("Profile updated.");
    profileForm.reset();
    await updateSession();
  } catch (error) {
    showToast(error.message, "error");
  }
});

// Delete own account
const deleteAccountBtn = document.getElementById("delete-account");
deleteAccountBtn.addEventListener("click", async () => {
  if (!confirm("Delete your account permanently?")) {
    return;
  }
  try {
    await apiFetch("/profile", { method: "DELETE" });
    setToken(null);
    showToast("Account deleted.");
    await updateSession();
  } catch (error) {
    showToast(error.message, "error");
  }
});

// User actions
usersList.addEventListener("click", async (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;

  if (editId) {
    const fullName = prompt("New full name:");
    if (!fullName) {
      return;
    }
    try {
      await apiFetch(`/users/${editId}?full_name=${encodeURIComponent(fullName)}`, {
        method: "PUT",
      });
      showToast("User updated.");
      await loadUsers();
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  if (deleteId) {
    if (!confirm("Delete this user?")) {
      return;
    }
    try {
      await apiFetch(`/users/${deleteId}`, { method: "DELETE" });
      showToast("User deleted.");
      await loadUsers();
    } catch (error) {
      showToast(error.message, "error");
    }
  }
});

// Logout
const logoutBtn = document.getElementById("logout");
logoutBtn.addEventListener("click", async () => {
  setToken(null);
  showToast("Signed out.");
  await updateSession();
});

// Scroll helpers
const scrollTo = (id) =>
  document.getElementById(id).scrollIntoView({ behavior: "smooth" });

document.getElementById("cta-start").addEventListener("click", () => {
  scrollTo("auth-panel");
});

document.getElementById("cta-docs").addEventListener("click", async () => {
  try {
    await apiFetch("/health");
    showToast("API is healthy.");
  } catch (error) {
    showToast("API seems offline.", "error");
  }
});

document.getElementById("scroll-auth").addEventListener("click", () => {
  scrollTo("auth-panel");
});

document.getElementById("scroll-dashboard").addEventListener("click", () => {
  scrollTo("dashboard");
});

animateReveal();
updateSession();
