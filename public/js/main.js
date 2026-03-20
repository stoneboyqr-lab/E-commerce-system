const BASE_URL = "http://localhost:5000/api";

// ── Toast notification ──
const toast = document.getElementById("toast");

function showToast(message, type = "default") {
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// ── Navbar scroll ──
const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 50);
});

// ── Hamburger ──
const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobileMenu");

hamburger?.addEventListener("click", () => {
  mobileMenu.classList.toggle("active");
  hamburger.classList.toggle("active");
});

// Close mobile menu on link click
document.querySelectorAll(".mobile-menu a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileMenu.classList.remove("active");
    hamburger.classList.remove("active");
  });
});

// ── Auth state ──
async function checkAuth() {
  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      credentials: "include",
    });

    if (res.ok) {
      const user = await res.json();
      updateNavForAuth(user);
      return user;
    } else {
      updateNavForGuest();
      return null;
    }
  } catch {
    updateNavForGuest();
    return null;
  }
}

function updateNavForAuth(user) {
  const navAuthBtn = document.getElementById("navAuthBtn");
  const mobileAuthBtn = document.getElementById("mobileAuthBtn");

  if (navAuthBtn) {
    navAuthBtn.textContent = user.name.split(" ")[0];
    navAuthBtn.href = user.role === "admin" ? "./admin/dashboard.html" : "./profile.html";
  }

  if (mobileAuthBtn) {
    mobileAuthBtn.textContent = user.name.split(" ")[0];
    mobileAuthBtn.href = user.role === "admin" ? "./admin/dashboard.html" : "./profile.html";
  }
}

function updateNavForGuest() {
  const navAuthBtn = document.getElementById("navAuthBtn");
  if (navAuthBtn) {
    navAuthBtn.textContent = "Login";
    navAuthBtn.href = "./login.html";
  }
}

// ── Cart count ──
async function updateCartCount() {
  try {
    const res = await fetch(`${BASE_URL}/cart`, {
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      const count = data.items?.length || 0;
      const badge = document.getElementById("cartCount");
      if (badge) badge.textContent = count;
    }
  } catch {
    // not logged in
  }
}

// ── Add to cart ──
async function addToCart(productId) {
  try {
    const res = await fetch(`${BASE_URL}/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ productId, quantity: 1 }),
    });

    const data = await res.json();

    if (res.ok) {
      showToast("Added to cart!", "success");
      updateCartCount();
    } else if (res.status === 401) {
      showToast("Please login to add items to cart", "error");
      setTimeout(() => window.location.href = "./login.html", 1500);
    } else {
      showToast(data.message || "Failed to add to cart", "error");
    }
  } catch {
    showToast("Network error", "error");
  }
}

// ── Toggle wishlist ──
async function toggleWishlist(productId, btn) {
  try {
    const res = await fetch(`${BASE_URL}/wishlist/${productId}`, {
      method: "POST",
      credentials: "include",
    });

    const data = await res.json();

    if (res.ok) {
      btn.classList.toggle("active");
      showToast(data.message, "success");
    } else if (res.status === 401) {
      showToast("Please login to save items", "error");
      setTimeout(() => window.location.href = "./login.html", 1500);
    }
  } catch {
    showToast("Network error", "error");
  }
}

// ── Product card HTML ──
function createProductCard(product) {
  const price = product.onSale && product.salePrice
    ? `<span class="current">₦${product.salePrice.toLocaleString()}</span>
       <span class="original">₦${product.price.toLocaleString()}</span>
       <span class="discount">${Math.round((1 - product.salePrice / product.price) * 100)}% OFF</span>`
    : `<span class="current">₦${product.price.toLocaleString()}</span>`;

  const image = product.images?.length
    ? `http://localhost:5000/uploads/${product.images[0]}`
    : `https://placehold.co/400x300?text=${encodeURIComponent(product.title)}`;

  const stars = "★".repeat(Math.round(product.ratings || 0)) +
                "☆".repeat(5 - Math.round(product.ratings || 0));

  return `
    <div class="product-card">
      <div class="product-card-img">
        <a href="./product.html?id=${product._id}">
          <img src="${image}" alt="${product.title}" loading="lazy">
        </a>
        <div class="product-card-badges">
          ${product.onSale ? '<span class="badge badge-sale">Sale</span>' : ""}
          ${product.stock === 0 ? '<span class="badge" style="background:#64748b;color:#fff">Out of Stock</span>' : ""}
        </div>
        <button class="product-card-wishlist toggle-wishlist-btn" data-id="${product._id}">
          <i class="fa-regular fa-heart"></i>
        </button>
      </div>
      <div class="product-card-body">
        <p class="product-card-category">${product.category?.name || "General"}</p>
        <h3 class="product-card-title">
          <a href="./product.html?id=${product._id}">${product.title}</a>
        </h3>
        <div class="product-card-rating">
          <span>${stars}</span>
          <span style="color:var(--text-muted)">(${product.reviewCount || 0})</span>
        </div>
        <div class="product-card-price">${price}</div>
        <div class="product-card-footer">
          <button class="btn btn-primary add-to-cart-btn" data-id="${product._id}"
            ${product.stock === 0 ? "disabled style='opacity:0.5;cursor:not-allowed'" : ""}>
            <i class="fa-solid fa-bag-shopping"></i> Add to Cart
          </button>
        </div>
      </div>
    </div>
  `;
}

// ── Event delegation for dynamically rendered cards ──
document.addEventListener("click", (e) => {
  // Add to cart
  const cartBtn = e.target.closest(".add-to-cart-btn");
  if (cartBtn && !cartBtn.disabled) {
    addToCart(cartBtn.dataset.id);
    return;
  }

  // Toggle wishlist
  const wishlistBtn = e.target.closest(".toggle-wishlist-btn");
  if (wishlistBtn) {
    toggleWishlist(wishlistBtn.dataset.id, wishlistBtn);
  }
});

// ── Init ──
checkAuth();
updateCartCount();

