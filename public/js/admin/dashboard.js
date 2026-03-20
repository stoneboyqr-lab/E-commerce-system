async function loadDashboard() {
  const content = document.getElementById("dashboardContent");

  const user = await checkAdminAuth();
  if (!user) return;

  try {
    const res = await fetch(`${ADMIN_BASE_URL}/admin/dashboard`, {
      credentials: "include",
    });

    const data = await res.json();

    content.innerHTML = `
      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon revenue"><i class="fa-solid fa-naira-sign"></i></div>
          <div class="stat-info">
            <h3>${formatCurrency(data.totalRevenue)}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orders"><i class="fa-solid fa-receipt"></i></div>
          <div class="stat-info">
            <h3>${data.totalOrders}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon users"><i class="fa-solid fa-users"></i></div>
          <div class="stat-info">
            <h3>${data.totalUsers}</h3>
            <p>Total Customers</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon products"><i class="fa-solid fa-box"></i></div>
          <div class="stat-info">
            <h3>${data.totalProducts}</h3>
            <p>Total Products</p>
          </div>
        </div>
      </div>

      <!-- Recent Orders -->
      <div class="admin-card">
        <div class="admin-card-header">
          <h2>Recent Orders</h2>
          <a href="./orders.html" class="btn btn-outline" style="padding:8px 16px;font-size:0.85rem">View All</a>
        </div>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${data.recentOrders.map((order) => `
                <tr>
                  <td><strong>${order.orderId}</strong></td>
                  <td>${order.user?.name || "Guest"}</td>
                  <td>${formatCurrency(order.totalAfterDiscount)}</td>
                  <td><span class="status-badge status-${order.paymentStatus}">${order.paymentStatus}</span></td>
                  <td><span class="status-badge status-${order.orderStatus}">${order.orderStatus}</span></td>
                  <td>${formatDate(order.createdAt)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

  } catch {
    content.innerHTML = `<div class="empty-state"><p>Failed to load dashboard</p></div>`;
  }
}

loadDashboard();












