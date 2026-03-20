const ADMIN_BASE_URL = "http://localhost:5000/api";

// ── Check admin auth ──
async function checkAdminAuth() {
  try {
    const res = await fetch(`${ADMIN_BASE_URL}/auth/me`, {
      credentials: "include",
    });

    if (!res.ok) {
      window.location.href = "../login.html";
      return null;
    }

    const user = await res.json();

    if (user.role !== "admin") {
      window.location.href = "../index.html";
      return null;
    }

    // Set admin name in topbar
    const adminNameEl = document.getElementById("adminName");
    const adminAvatarEl = document.getElementById("adminAvatar");
    if (adminNameEl) adminNameEl.textContent = user.name.split(" ")[0];
    if (adminAvatarEl) adminAvatarEl.textContent = user.name.charAt(0).toUpperCase();

    return user;
  } catch {
    window.location.href = "../login.html";
    return null;
  }
}

// ── Toast ──
function showToast(message, type = "default") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// ── Sidebar toggle for mobile ──
const adminHamburger = document.getElementById("adminHamburger");
const adminSidebar = document.getElementById("adminSidebar");

adminHamburger?.addEventListener("click", () => {
  adminSidebar.classList.toggle("active");
});

// ── Logout ──
document.getElementById("adminLogout")?.addEventListener("click", async () => {
  await fetch(`${ADMIN_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  window.location.href = "../login.html";
});

// ── Format currency ──
function formatCurrency(amount) {
  return `₦${Number(amount).toLocaleString()}`;
}

// ── Format date ──
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── Confirm delete ──
function confirmDelete(message = "Are you sure you want to delete this?") {
  return confirm(message);
}