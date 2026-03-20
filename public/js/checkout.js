let cartData = null;
let currentUser = null;
let appliedCoupon = JSON.parse(localStorage.getItem("appliedCoupon") || "null");
let discountAmount = parseFloat(localStorage.getItem("discountAmount") || "0");

// ── Load Paystack dynamically ──
function loadPaystackScript() {
  return new Promise((resolve) => {
    if (typeof PaystackPop !== "undefined") return resolve();
    const existing = document.querySelector('script[src*="paystack"]');
    if (existing) {
      existing.onload = resolve;
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.onload = resolve;
    script.onerror = resolve;
    document.head.appendChild(script);
  });
}

// ── Load checkout ──
async function loadCheckout() {
  const content = document.getElementById("checkoutContent");

  try {
    currentUser = await checkAuth();
    if (!currentUser) {
      content.innerHTML = `
        <div class="empty-state">
          <h3>Please login to checkout</h3>
          <a href="./login.html" class="btn btn-primary">Login</a>
        </div>`;
      return;
    }

    const res = await fetch(`${BASE_URL}/cart`, { credentials: "include" });
    cartData = await res.json();

    if (!cartData.items?.length) {
      content.innerHTML = `
        <div class="empty-state">
          <h3>Your cart is empty</h3>
          <a href="./shop.html" class="btn btn-primary">Shop Now</a>
        </div>`;
      return;
    }

    renderCheckout();
  } catch {
    content.innerHTML = `<div class="empty-state"><p>Failed to load checkout</p></div>`;
  }
}

// ── Render checkout ──
function renderCheckout() {
  const content = document.getElementById("checkoutContent");

  const itemsHTML = cartData.items.map((item) => {
    const product = item.product;
    const image = product.images?.length
      ? `${UPLOADS_URL}//${product.images[0]}`
      : `https://placehold.co/56x56?text=IMG`;

    return `
      <div class="checkout-item">
        <div class="checkout-item-img">
          <img src="${image}" alt="${product.title}">
        </div>
        <div class="checkout-item-info">
          <h4>${product.title}</h4>
          <p>Qty: ${item.quantity}</p>
        </div>
        <span class="checkout-item-price">₦${(item.price * item.quantity).toLocaleString()}</span>
      </div>
    `;
  }).join("");

  const subtotal = cartData.total;
  const total = subtotal - discountAmount;

  content.innerHTML = `
    <div class="checkout-layout">
      <div class="checkout-form-card">
        <h2><i class="fa-solid fa-location-dot"></i> Delivery Address</h2>
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" id="fullName" value="${currentUser.name}" placeholder="Full name">
        </div>
        <div class="form-group">
          <label>Phone Number</label>
          <input type="tel" id="phone" value="${currentUser.phone || ""}" placeholder="Phone number">
        </div>
        <div class="form-group">
          <label>Street Address</label>
          <input type="text" id="street" placeholder="Enter street address">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>City</label>
            <input type="text" id="city" placeholder="City">
          </div>
          <div class="form-group">
            <label>State</label>
            <input type="text" id="state" placeholder="State">
          </div>
        </div>
      </div>

      <div class="checkout-summary">
        <h2>Order Summary</h2>
        <div class="checkout-items">${itemsHTML}</div>
        <hr class="summary-divider">
        <div class="summary-row">
          <span>Subtotal</span>
          <span>₦${subtotal.toLocaleString()}</span>
        </div>
        ${discountAmount > 0 ? `
        <div class="summary-row discount">
          <span>Discount ${appliedCoupon ? `(${appliedCoupon.code})` : ""}</span>
          <span>− ₦${discountAmount.toLocaleString()}</span>
        </div>` : ""}
        <div class="summary-row">
          <span>Delivery</span>
          <span>To be confirmed</span>
        </div>
        <div class="summary-row total">
          <span>Total</span>
          <span>₦${total.toLocaleString()}</span>
        </div>
        <button class="btn btn-primary pay-btn" id="payBtn">
          <i class="fa-solid fa-lock"></i> Pay ₦${total.toLocaleString()}
        </button>
        <div class="secure-badge">
          <i class="fa-solid fa-shield-halved"></i>
          <span>Secured by Paystack</span>
        </div>
      </div>
    </div>
  `;

  document.getElementById("payBtn").addEventListener("click", handlePayment);
}

// ── Handle payment ──
async function handlePayment() {
  const street = document.getElementById("street").value.trim();
  const city = document.getElementById("city").value.trim();
  const state = document.getElementById("state").value.trim();

  if (!street || !city || !state) {
    showToast("Please fill in your delivery address", "error");
    return;
  }

  const btn = document.getElementById("payBtn");
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;

  try {
    // Initialize order
    const orderRes = await fetch(`${BASE_URL}/orders/initialize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        deliveryAddress: { street, city, state },
        couponCode: appliedCoupon?.code || null,
      }),
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok) {
      showToast(orderData.message || "Failed to initialize order", "error");
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-lock"></i> Pay ₦${(cartData.total - discountAmount).toLocaleString()}`;
      return;
    }

    // Load Paystack script dynamically
    await loadPaystackScript();

    if (typeof PaystackPop === "undefined") {
      showToast("Payment system failed to load. Please refresh.", "error");
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-lock"></i> Pay ₦${(cartData.total - discountAmount).toLocaleString()}`;
      return;
    }

    // Launch Paystack popup
    const handler = PaystackPop.setup({
      key: "pk_test_6d3d0390e7a3d5c9f52a2ef8dca629d606385986",
      email: currentUser.email,
      amount: orderData.paystackAmount,
      currency: "NGN",
      ref: `lvst_${Date.now()}`,
      callback: async (response) => {
        await verifyPayment(response.reference, orderData.order._id);
      },
      onClose: () => {
        showToast("Payment cancelled", "error");
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-lock"></i> Pay ₦${(cartData.total - discountAmount).toLocaleString()}`;
      },
    });

    handler.openIframe();

  } catch (err) {
    console.error("Payment error:", err);
    showToast("Network error", "error");
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-lock"></i> Pay ₦${(cartData.total - discountAmount).toLocaleString()}`;
  }
}

// ── Verify payment ──
async function verifyPayment(reference, orderId) {
  try {
    const res = await fetch(`${BASE_URL}/orders/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ reference, orderId }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.removeItem("appliedCoupon");
      localStorage.removeItem("discountAmount");
      showToast("Payment successful! Order confirmed.", "success");
      setTimeout(() => {
        window.location.href = "./orders.html";
      }, 1500);
    } else {
      showToast(data.message || "Payment verification failed", "error");
    }
  } catch {
    showToast("Failed to verify payment", "error");
  }
}

// ── Init ──
loadCheckout();


