async function loadOrders() {
  const content = document.getElementById("ordersTableContent");
  await checkAdminAuth();

  try {
    const res = await fetch(`${ADMIN_BASE_URL}/orders/admin/all`, {
      credentials: "include",
    });

    const orders = await res.json();

    if (!orders.length) {
      content.innerHTML = `<div class="empty-state"><p>No orders yet</p></div>`;
      return;
    }

    content.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map((order) => `
            <tr>
              <td><strong>${order.orderId}</strong></td>
              <td>
                <div>${order.user?.name || "Guest"}</div>
                <div style="font-size:0.75rem;color:var(--text-muted)">${order.user?.email || ""}</div>
              </td>
              <td>${order.items.length} item${order.items.length !== 1 ? "s" : ""}</td>
              <td>${formatCurrency(order.totalAfterDiscount)}</td>
              <td><span class="status-badge status-${order.paymentStatus}">${order.paymentStatus}</span></td>
              <td>
                <select class="status-select" data-id="${order._id}" style="padding:6px 10px;border:2px solid var(--light-3);border-radius:var(--radius);font-size:0.82rem;font-family:inherit;cursor:pointer">
                  <option value="pending" ${order.orderStatus === "pending" ? "selected" : ""}>Pending</option>
                  <option value="processing" ${order.orderStatus === "processing" ? "selected" : ""}>Processing</option>
                  <option value="shipped" ${order.orderStatus === "shipped" ? "selected" : ""}>Shipped</option>
                  <option value="delivered" ${order.orderStatus === "delivered" ? "selected" : ""}>Delivered</option>
                  <option value="cancelled" ${order.orderStatus === "cancelled" ? "selected" : ""}>Cancelled</option>
                </select>
              </td>
              <td>${formatDate(order.createdAt)}</td>
              <td>
                <button class="action-btn view" onclick="viewOrderDetails('${order._id}')">
                  <i class="fa-solid fa-eye"></i>
                </button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    // Status change
    document.querySelectorAll(".status-select").forEach((select) => {
      select.addEventListener("change", async () => {
        const id = select.dataset.id;
        const orderStatus = select.value;
        try {
          const res = await fetch(`${ADMIN_BASE_URL}/orders/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ orderStatus }),
          });
          const data = await res.json();
          showToast(data.message, "success");
        } catch {
          showToast("Failed to update status", "error");
        }
      });
    });

  } catch {
    content.innerHTML = `<div class="empty-state"><p>Failed to load orders</p></div>`;
  }
}

function viewOrderDetails(id) {
  showToast(`Order ID: ${id}`, "default");
}

loadOrders();
