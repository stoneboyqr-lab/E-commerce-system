let currentUser = null;

// ── Load profile ──
async function loadProfile() {
  const content = document.getElementById("profileContent");

  try {
    currentUser = await checkAuth();
    if (!currentUser) {
      window.location.href = "./login.html";
      return;
    }

    // Get order count
    const ordersRes = await fetch(`${BASE_URL}/orders`, { credentials: "include" });
    const orders = await ordersRes.json();

    // Get wishlist count
    const wishlistRes = await fetch(`${BASE_URL}/wishlist`, { credentials: "include" });
    const wishlist = await wishlistRes.json();

    const initial = currentUser.name.charAt(0).toUpperCase();

    content.innerHTML = `
      <div class="profile-layout">

        <!-- Sidebar -->
        <div class="profile-sidebar">
          <div class="profile-avatar">${initial}</div>
          <p class="profile-name">${currentUser.name}</p>
          <p class="profile-email">${currentUser.email}</p>

          <nav class="profile-nav">
            <button class="profile-nav-item active" data-tab="overview">
              <i class="fa-solid fa-chart-pie"></i> Overview
            </button>
            <button class="profile-nav-item" data-tab="edit">
              <i class="fa-regular fa-user"></i> Edit Profile
            </button>
            <button class="profile-nav-item" data-tab="address">
              <i class="fa-solid fa-location-dot"></i> Address
            </button>
            <button class="profile-nav-item" data-tab="password">
              <i class="fa-solid fa-lock"></i> Change Password
            </button>
            <hr class="profile-nav-divider">
            <a href="./orders.html" class="profile-nav-item">
              <i class="fa-solid fa-box"></i> My Orders
            </a>
            <a href="./wishlist.html" class="profile-nav-item">
              <i class="fa-regular fa-heart"></i> Wishlist
            </a>
            <hr class="profile-nav-divider">
            <button class="profile-nav-item logout-btn" id="logoutBtn">
              <i class="fa-solid fa-right-from-bracket"></i> Logout
            </button>
          </nav>
        </div>

        <!-- Main -->
        <div class="profile-main" id="profileMain">
          <!-- Overview tab loads by default -->
        </div>

      </div>
    `;

    // Load overview by default
    loadTab("overview", orders, wishlist);

    // Tab navigation
    document.querySelectorAll(".profile-nav-item[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".profile-nav-item[data-tab]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        loadTab(btn.dataset.tab, orders, wishlist);
      });
    });

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", async () => {
      await fetch(`${BASE_URL}/auth/logout`, { method: "POST", credentials: "include" });
      window.location.href = "./index.html";
    });

  } catch {
    content.innerHTML = `<div class="empty-state"><p>Failed to load profile</p></div>`;
  }
}

// ── Load tab content ──
function loadTab(tab, orders, wishlist) {
  const main = document.getElementById("profileMain");

  if (tab === "overview") {
    main.innerHTML = `
      <div class="profile-stats">
        <div class="profile-stat-card">
          <i class="fa-solid fa-box"></i>
          <span class="profile-stat-num">${orders.length || 0}</span>
          <span class="profile-stat-label">Orders</span>
        </div>
        <div class="profile-stat-card">
          <i class="fa-regular fa-heart"></i>
          <span class="profile-stat-num">${wishlist.products?.length || 0}</span>
          <span class="profile-stat-label">Wishlist</span>
        </div>
        <div class="profile-stat-card">
          <i class="fa-solid fa-truck"></i>
          <span class="profile-stat-num">${orders.filter(o => o.orderStatus === "delivered").length || 0}</span>
          <span class="profile-stat-label">Delivered</span>
        </div>
      </div>

      <div class="profile-card">
        <h2><i class="fa-regular fa-user"></i> Account Info</h2>
        <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:8px">
          <strong>Name:</strong> ${currentUser.name}
        </p>
        <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:8px">
          <strong>Email:</strong> ${currentUser.email}
        </p>
        <p style="color:var(--text-muted);font-size:0.9rem">
          <strong>Phone:</strong> ${currentUser.phone || "Not set"}
        </p>
      </div>
    `;
  }

  if (tab === "edit") {
    main.innerHTML = `
      <div class="profile-card">
        <h2><i class="fa-regular fa-user"></i> Edit Profile</h2>
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" id="editName" value="${currentUser.name}">
        </div>
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" id="editEmail" value="${currentUser.email}">
        </div>
        <div class="form-group">
          <label>Phone Number</label>
          <input type="tel" id="editPhone" value="${currentUser.phone || ""}">
        </div>
        <button class="btn btn-primary" id="saveProfileBtn">
          <i class="fa-solid fa-floppy-disk"></i> Save Changes
        </button>
        <p class="profile-msg" id="profileMsg"></p>
      </div>
    `;

    document.getElementById("saveProfileBtn").addEventListener("click", async () => {
      const name = document.getElementById("editName").value.trim();
      const email = document.getElementById("editEmail").value.trim();
      const phone = document.getElementById("editPhone").value.trim();
      const msg = document.getElementById("profileMsg");

      try {
        const res = await fetch(`${BASE_URL}/auth/me`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name, email, phone }),
        });

        const data = await res.json();

        if (res.ok) {
          msg.className = "profile-msg success";
          msg.textContent = "Profile updated successfully";
          currentUser.name = name;
          currentUser.email = email;
          document.querySelector(".profile-name").textContent = name;
          document.querySelector(".profile-email").textContent = email;
          document.querySelector(".profile-avatar").textContent = name.charAt(0).toUpperCase();
        } else {
          msg.className = "profile-msg error";
          msg.textContent = data.message || "Failed to update profile";
        }
      } catch {
        msg.className = "profile-msg error";
        msg.textContent = "Network error";
      }
    });
  }

  if (tab === "address") {
    main.innerHTML = `
      <div class="profile-card">
        <h2><i class="fa-solid fa-location-dot"></i> Delivery Address</h2>
        <div class="form-group">
          <label>Street Address</label>
          <input type="text" id="street" value="${currentUser.address?.street || ""}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>City</label>
            <input type="text" id="city" value="${currentUser.address?.city || ""}">
          </div>
          <div class="form-group">
            <label>State</label>
            <input type="text" id="state" value="${currentUser.address?.state || ""}">
          </div>
        </div>
        <button class="btn btn-primary" id="saveAddressBtn">
          <i class="fa-solid fa-floppy-disk"></i> Save Address
        </button>
        <p class="profile-msg" id="addressMsg"></p>
      </div>
    `;

    document.getElementById("saveAddressBtn").addEventListener("click", async () => {
      const street = document.getElementById("street").value.trim();
      const city = document.getElementById("city").value.trim();
      const state = document.getElementById("state").value.trim();
      const msg = document.getElementById("addressMsg");

      try {
        const res = await fetch(`${BASE_URL}/auth/me`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ address: { street, city, state } }),
        });

        const data = await res.json();

        if (res.ok) {
          msg.className = "profile-msg success";
          msg.textContent = "Address saved successfully";
        } else {
          msg.className = "profile-msg error";
          msg.textContent = data.message || "Failed to save address";
        }
      } catch {
        msg.className = "profile-msg error";
        msg.textContent = "Network error";
      }
    });
  }

  if (tab === "password") {
    main.innerHTML = `
      <div class="profile-card">
        <h2><i class="fa-solid fa-lock"></i> Change Password</h2>
        <div class="form-group">
          <label>Current Password</label>
          <input type="password" id="currentPassword" placeholder="Enter current password">
        </div>
        <div class="form-group">
          <label>New Password</label>
          <input type="password" id="newPassword" placeholder="Enter new password">
        </div>
        <div class="form-group">
          <label>Confirm New Password</label>
          <input type="password" id="confirmPassword" placeholder="Confirm new password">
        </div>
        <button class="btn btn-primary" id="changePasswordBtn">
          <i class="fa-solid fa-lock"></i> Update Password
        </button>
        <p class="profile-msg" id="passwordMsg"></p>
      </div>
    `;

    document.getElementById("changePasswordBtn").addEventListener("click", async () => {
      const currentPassword = document.getElementById("currentPassword").value;
      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      const msg = document.getElementById("passwordMsg");

      if (newPassword !== confirmPassword) {
        msg.className = "profile-msg error";
        msg.textContent = "New passwords do not match";
        return;
      }

      if (newPassword.length < 6) {
        msg.className = "profile-msg error";
        msg.textContent = "Password must be at least 6 characters";
        return;
      }

      try {
        const res = await fetch(`${BASE_URL}/auth/change-password`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ currentPassword, newPassword }),
        });

        const data = await res.json();

        if (res.ok) {
          msg.className = "profile-msg success";
          msg.textContent = "Password updated successfully";
          document.getElementById("currentPassword").value = "";
          document.getElementById("newPassword").value = "";
          document.getElementById("confirmPassword").value = "";
        } else {
          msg.className = "profile-msg error";
          msg.textContent = data.message || "Failed to update password";
        }
      } catch {
        msg.className = "profile-msg error";
        msg.textContent = "Network error";
      }
    });
  }
}

// ── Init ──
loadProfile();

