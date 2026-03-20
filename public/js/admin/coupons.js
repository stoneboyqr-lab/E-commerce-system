async function loadCoupons() {
  const content = document.getElementById("couponsTableContent");
  await checkAdminAuth();

  try {
    const res = await fetch(`${ADMIN_BASE_URL}/coupons`, { credentials: "include" });
    const coupons = await res.json();

    if (!coupons.length) {
      content.innerHTML = `<div class="empty-state"><p>No coupons yet</p></div>`;
      return;
    }

    content.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Type</th>
            <th>Discount</th>
            <th>Min Order</th>
            <th>Used</th>
            <th>Expires</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${coupons.map((c) => `
            <tr>
              <td><strong>${c.code}</strong></td>
              <td>${c.type}</td>
              <td>${c.type === "percentage" ? `${c.discount}%` : formatCurrency(c.discount)}</td>
              <td>${formatCurrency(c.minOrderAmount)}</td>
              <td>${c.usedCount}${c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
              <td>${c.expiresAt ? formatDate(c.expiresAt) : "Never"}</td>
              <td>
                <span class="status-badge ${c.isActive ? "status-delivered" : "status-cancelled"}">
                  ${c.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td>
                <div class="action-btns">
                  <button class="action-btn toggle" onclick="toggleCoupon('${c._id}')">
                    <i class="fa-solid fa-${c.isActive ? "ban" : "check"}"></i>
                  </button>
                  <button class="action-btn delete" onclick="deleteCoupon('${c._id}')">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  } catch {
    content.innerHTML = `<div class="empty-state"><p>Failed to load coupons</p></div>`;
  }
}

document.getElementById("addCouponBtn").addEventListener("click", () => {
  document.getElementById("couponModal").classList.add("active");
});

document.getElementById("closeCouponModal").addEventListener("click", () => {
  document.getElementById("couponModal").classList.remove("active");
});

document.getElementById("couponModal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("couponModal")) {
    document.getElementById("couponModal").classList.remove("active");
  }
});

document.getElementById("saveCouponBtn").addEventListener("click", async () => {
  const msg = document.getElementById("couponMsg");

  const body = {
    code: document.getElementById("couponCode").value.trim().toUpperCase(),
    type: document.getElementById("couponType").value,
    discount: document.getElementById("couponDiscount").value,
    minOrderAmount: document.getElementById("couponMinOrder").value || 0,
    usageLimit: document.getElementById("couponLimit").value || null,
    expiresAt: document.getElementById("couponExpiry").value || null,
  };

  try {
    const res = await fetch(`${ADMIN_BASE_URL}/coupons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.ok) {
      msg.style.color = "var(--success)";
      msg.textContent = data.message;
      setTimeout(() => {
        document.getElementById("couponModal").classList.remove("active");
        loadCoupons();
      }, 800);
    } else {
      msg.style.color = "var(--error)";
      msg.textContent = data.message || "Failed to save coupon";
    }
  } catch {
    msg.style.color = "var(--error)";
    msg.textContent = "Network error";
  }
});

async function toggleCoupon(id) {
  try {
    const res = await fetch(`${ADMIN_BASE_URL}/coupons/${id}/toggle`, {
      method: "PATCH",
      credentials: "include",
    });
    const data = await res.json();
    showToast(data.message, "success");
    loadCoupons();
  } catch {
    showToast("Failed to toggle coupon", "error");
  }
}

async function deleteCoupon(id) {
  if (!confirmDelete("Delete this coupon?")) return;
  try {
    const res = await fetch(`${ADMIN_BASE_URL}/coupons/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    showToast(data.message, "success");
    loadCoupons();
  } catch {
    showToast("Failed to delete coupon", "error");
  }
}

loadCoupons();



