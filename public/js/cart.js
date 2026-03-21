let cartData = null;
let appliedCoupon = null;
let discountAmount = 0;

// ── Load cart ──
async function loadCart() {
  const content = document.getElementById("cartContent");

  try {
    const user = await checkAuth();
    if (!user) {
      content.innerHTML = `
        <div class="empty-state">
          <h3>Please login to view your cart</h3>
          <p>You need to be logged in to access your cart</p>
          <a href="./login.html" class="btn btn-primary">Login</a>
        </div>`;
      return;
    }

    const res = await fetch(`${BASE_URL}/cart`, {
      credentials: "include",
    });

    cartData = await res.json();

    if (!cartData.items?.length) {
      content.innerHTML = `
        <div class="empty-state">
          <h3>Your cart is empty</h3>
          <p>Add some products to get started</p>
          <a href="./shop.html" class="btn btn-primary">Shop Now</a>
        </div>`;
      return;
    }

    renderCart();
  } catch {
    content.innerHTML = `<div class="empty-state"><p>Failed to load cart</p></div>`;
  }
}

// ── Render cart ──
function renderCart() {
  const content = document.getElementById("cartContent");

  const itemsHTML = cartData.items.map((item) => {
    const product = item.product;
    const image = product.images?.length
      ? `${UPLOADS_URL}/${product.images[0]}`
      : `https://placehold.co/100x100?text=${encodeURIComponent(product.title)}`;

    const itemTotal = item.price * item.quantity;

    return `
      <div class="cart-item" data-id="${item._id}">
        <div class="cart-item-img">
          <a href="./product.html?id=${product._id}">
            <img src="${image}" alt="${product.title}">
          </a>
        </div>
        <div class="cart-item-info">
          <h3><a href="./product.html?id=${product._id}">${product.title}</a></h3>
          <p class="cart-item-price">₦${item.price.toLocaleString()} each</p>
          <div class="cart-item-qty">
            <button class="cart-qty-btn" data-id="${item._id}" data-change="-1">−</button>
            <span class="cart-qty-value">${item.quantity}</span>
            <button class="cart-qty-btn" data-id="${item._id}" data-change="1">+</button>
          </div>
        </div>
        <div class="cart-item-actions">
          <span class="cart-item-total">₦${itemTotal.toLocaleString()}</span>
          <button class="cart-remove-btn" data-id="${item._id}">
            <i class="fa-solid fa-trash"></i> Remove
          </button>
        </div>
      </div>
    `;
  }).join("");

  const subtotal = cartData.total;
  const total = subtotal - discountAmount;

  const summaryHTML = `
    <div class="cart-summary">
      <h3>Order Summary</h3>
      <div class="summary-row">
        <span>Subtotal (${cartData.items.length} items)</span>
        <span>₦${subtotal.toLocaleString()}</span>
      </div>
      ${discountAmount > 0 ? `
      <div class="summary-row" style="color: var(--success)">
        <span>Discount</span>
        <span>− ₦${discountAmount.toLocaleString()}</span>
      </div>` : ""}
      <div class="summary-row">
        <span>Delivery</span>
        <span>Calculated at checkout</span>
      </div>
      <div class="summary-row total">
        <span>Total</span>
        <span>₦${total.toLocaleString()}</span>
      </div>

      <div class="coupon-section">
        <label>Have a coupon?</label>
        <div class="coupon-input">
          <input type="text" id="couponCode" placeholder="Enter code">
          <button id="applyCoupon">Apply</button>
        </div>
        <div id="couponMessage"></div>
      </div>

      <a href="./checkout.html" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:8px">
        Proceed to Checkout <i class="fa-solid fa-arrow-right"></i>
      </a>
      <a href="./shop.html" class="btn btn-outline" style="width:100%;justify-content:center;margin-top:12px">
        Continue Shopping
      </a>
    </div>
  `;

  content.innerHTML = `
    <div class="cart-layout">
      <div>
        <div class="cart-header">
          <h2>Cart (${cartData.items.length})</h2>
          <button class="clear-cart-btn" id="clearCartBtn">
            <i class="fa-solid fa-trash"></i> Clear All
          </button>
        </div>
        <div class="cart-items">${itemsHTML}</div>
      </div>
      ${summaryHTML}
    </div>
  `;

  attachCartEvents();
}

// ── Attach events ──
function attachCartEvents() {
  // Qty buttons
  document.querySelectorAll(".cart-qty-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const itemId = btn.dataset.id;
      const change = parseInt(btn.dataset.change);
      const item = cartData.items.find((i) => i._id === itemId);
      if (!item) return;

      const newQty = item.quantity + change;
      await updateCartItem(itemId, newQty);
    });
  });

  // Remove buttons
  document.querySelectorAll(".cart-remove-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await removeCartItem(btn.dataset.id);
    });
  });

  // Clear cart
  document.getElementById("clearCartBtn")?.addEventListener("click", async () => {
    if (!confirm("Clear all items from cart?")) return;
    await clearCart();
  });

  // Apply coupon
  document.getElementById("applyCoupon")?.addEventListener("click", async () => {
    const code = document.getElementById("couponCode").value.trim();
    if (!code) return;
    await applyCoupon(code);
  });
}

// ── Update cart item ──
async function updateCartItem(itemId, quantity) {
  try {
    if (quantity <= 0) {
      await removeCartItem(itemId);
      return;
    }

    const res = await fetch(`${BASE_URL}/cart/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ quantity }),
    });

    if (res.ok) {
      const item = cartData.items.find((i) => i._id === itemId);
      if (item) item.quantity = quantity;
      cartData.total = cartData.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
      renderCart();
      updateCartCount();
    }
  } catch {
    showToast("Failed to update cart", "error");
  }
}

// ── Remove cart item ──
async function removeCartItem(itemId) {
  try {
    const res = await fetch(`${BASE_URL}/cart/${itemId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      cartData.items = cartData.items.filter((i) => i._id !== itemId);
      cartData.total = cartData.items.reduce((acc, i) => acc + i.price * i.quantity, 0);

      if (!cartData.items.length) {
        loadCart();
      } else {
        renderCart();
      }
      updateCartCount();
      showToast("Item removed", "success");
    }
  } catch {
    showToast("Failed to remove item", "error");
  }
}

// ── Clear cart ──
async function clearCart() {
  try {
    const res = await fetch(`${BASE_URL}/cart`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      loadCart();
      updateCartCount();
      showToast("Cart cleared", "success");
    }
  } catch {
    showToast("Failed to clear cart", "error");
  }
}

// ── Apply coupon ──
async function applyCoupon(code) {
  const msgEl = document.getElementById("couponMessage");

  try {
    const res = await fetch(`${BASE_URL}/coupons/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code, orderTotal: cartData.total }),
    });

    const data = await res.json();

    if (res.ok) {
      appliedCoupon = data.coupon;
      discountAmount = data.discountAmount;
      msgEl.innerHTML = `<span class="coupon-success">✔ ${data.message} — ₦${data.discountAmount.toLocaleString()} off</span>`;

      // Store for checkout
      localStorage.setItem("appliedCoupon", JSON.stringify(appliedCoupon));
      localStorage.setItem("discountAmount", discountAmount);

      renderCart();
    } else {
      msgEl.innerHTML = `<span class="coupon-error">${data.message}</span>`;
    }
  } catch {
    msgEl.innerHTML = `<span class="coupon-error">Failed to apply coupon</span>`;
  }
}

// ── Init ──
loadCart();