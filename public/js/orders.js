// ── Load orders ──
async function loadOrders() {
  const content = document.getElementById("ordersContent");

  try {
    const user = await checkAuth();
    if (!user) {
      content.innerHTML = `
        <div class="empty-state">
          <h3>Please login to view your orders</h3>
          <a href="./login.html" class="btn btn-primary">Login</a>
        </div>`;
      return;
    }

    const res = await fetch(`${BASE_URL}/orders`, {
      credentials: "include",
    });

    const orders = await res.json();

    if (!orders.length) {
      content.innerHTML = `
        <div class="empty-state">
          <h3>No orders yet</h3>
          <p>Your order history will appear here</p>
          <a href="./shop.html" class="btn btn-primary">Start Shopping</a>
        </div>`;
      return;
    }

    content.innerHTML = orders.map((order) => {
      const itemsHTML = order.items.map((item) => {
        const image = item.product?.images?.length
          ? `http://localhost:5000/uploads/${item.product.images[0]}`
          : `https://placehold.co/56x56?text=IMG`;

        return `
          <div class="order-item">
            <div class="order-item-img">
              <img src="${image}" alt="${item.product?.title || 'Product'}">
            </div>
            <div class="order-item-info">
              <h4>${item.product?.title || "Product"}</h4>
              <p>Qty: ${item.quantity} × ₦${item.priceAtPurchase.toLocaleString()}</p>
            </div>
            <span class="order-item-price">₦${(item.quantity * item.priceAtPurchase).toLocaleString()}</span>
          </div>
        `;
      }).join("");

      return `
        <div class="order-card">
          <div class="order-card-header">
            <div>
              <p class="order-id">${order.orderId}</p>
              <p class="order-date">${new Date(order.createdAt).toLocaleDateString("en-NG", {
                year: "numeric", month: "long", day: "numeric"
              })}</p>
            </div>
            <div class="order-status">
              <span class="status-badge status-${order.orderStatus}">${order.orderStatus}</span>
              <span class="status-badge status-${order.paymentStatus}">${order.paymentStatus}</span>
            </div>
          </div>

          <div class="order-items">${itemsHTML}</div>

          <div class="order-card-footer">
            <div>
              <p class="order-total">Total: <span>₦${order.totalAfterDiscount.toLocaleString()}</span></p>
              ${order.deliveryAddress ? `
              <p class="order-address">
                <i class="fa-solid fa-location-dot"></i>
                ${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state}
              </p>` : ""}
            </div>
          </div>
        </div>
      `;
    }).join("");

  } catch {
    content.innerHTML = `<div class="empty-state"><p>Failed to load orders</p></div>`;
  }
}

// ── Init ──
loadOrders();