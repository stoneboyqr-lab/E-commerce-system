const productId = new URLSearchParams(window.location.search).get("id");
let selectedRating = 0;
let quantity = 1;




// ── Load product ──
async function loadProduct() {
  const content = document.getElementById("productContent");
  if (!productId) {
    content.innerHTML = `<div class="empty-state"><h3>Product not found</h3></div>`;
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/products/${productId}`);
    const product = await res.json();

    if (!res.ok) {
      content.innerHTML = `<div class="empty-state"><h3>Product not found</h3></div>`;
      return;
    }

    document.getElementById("breadcrumbProduct").textContent = product.title;
    document.title = `${product.title} — Lvst Store`;

    const price = product.onSale && product.salePrice
      ? `<span class="current">₦${product.salePrice.toLocaleString()}</span>
         <span class="original">₦${product.price.toLocaleString()}</span>
         <span class="discount-badge">${Math.round((1 - product.salePrice / product.price) * 100)}% OFF</span>`
      : `<span class="current">₦${product.price.toLocaleString()}</span>`;

    const images = product.images?.length ? product.images : ["placeholder"];

    const mainImage = images[0] !== "placeholder"
      ? getImageUrl(images[0])
      : `https://placehold.co/600x400?text=${encodeURIComponent(product.title)}`;

    const thumbnails = images.map((img, i) => {
      const src = img !== "placeholder"
        ? getImageUrl(img)
        : `https://placehold.co/100x100?text=IMG`;
      return `
        <div class="product-thumb ${i === 0 ? "active" : ""}" data-src="${src}">
          <img src="${src}" alt="Image ${i + 1}">
        </div>`;
    }).join("");

    const stars = "★".repeat(Math.round(product.ratings || 0)) +
                  "☆".repeat(5 - Math.round(product.ratings || 0));

    const saleEnds = product.onSale && product.saleEnds
      ? `<div class="sale-ends">⏰ Sale ends: ${new Date(product.saleEnds).toLocaleDateString()}</div>`
      : "";

    content.innerHTML = `
      <div class="product-detail">
        <div class="product-images">
          <div class="product-main-img">
            <img src="${mainImage}" alt="${product.title}" id="mainProductImg">
          </div>
          ${images.length > 1 ? `<div class="product-thumbnails">${thumbnails}</div>` : ""}
        </div>
        <div class="product-info">
          <p class="product-info-category">${product.category?.name || "General"}</p>
          <h1>${product.title}</h1>
          <div class="product-info-rating">
            <span class="stars">${stars}</span>
            <span>${product.ratings || 0} (${product.reviewCount || 0} reviews)</span>
          </div>
          <div class="product-info-price">${price}</div>
          ${saleEnds}
          <p class="product-info-desc">${product.description}</p>
          <div class="product-info-stock ${product.stock > 0 ? "in-stock" : "out-stock"}">
            <i class="fa-solid fa-${product.stock > 0 ? "circle-check" : "circle-xmark"}"></i>
            ${product.stock > 0 ? `In Stock (${product.stock} available)` : "Out of Stock"}
          </div>
          ${product.stock > 0 ? `
          <div class="product-quantity">
            <label>Quantity:</label>
            <div class="qty-control">
              <button class="qty-btn" id="qtyMinus">−</button>
              <span class="qty-value" id="qtyValue" data-stock="${product.stock}">1</span>
              <button class="qty-btn" id="qtyPlus">+</button>
            </div>
          </div>` : ""}
          <div class="product-actions">
            <button class="btn btn-primary" id="addToCartBtn"
              ${product.stock === 0 ? "disabled style='opacity:0.5;cursor:not-allowed'" : ""}>
              <i class="fa-solid fa-bag-shopping"></i> Add to Cart
            </button>
            <button class="btn-wishlist" id="wishlistBtn">
              <i class="fa-regular fa-heart"></i> Wishlist
            </button>
          </div>
        </div>
      </div>
    `;

    // Attach events after HTML is rendered
    document.getElementById("qtyMinus")?.addEventListener("click", () => changeQty(-1));
    document.getElementById("qtyPlus")?.addEventListener("click", () => changeQty(1));
    document.getElementById("addToCartBtn")?.addEventListener("click", handleAddToCart);
    document.getElementById("wishlistBtn")?.addEventListener("click", handleWishlist);

    // Thumbnail click
    document.querySelectorAll(".product-thumb").forEach((thumb) => {
      thumb.addEventListener("click", () => {
        const src = thumb.dataset.src;
        document.getElementById("mainProductImg").src = src;
        document.querySelectorAll(".product-thumb").forEach((t) => t.classList.remove("active"));
        thumb.classList.add("active");
      });
    });

    loadRelatedProducts(product.category?._id);

  } catch (err) {
    content.innerHTML = `<div class="empty-state"><p>Failed to load product</p></div>`;
  }
}

// ── Quantity ──
function changeQty(change) {
  const qtyEl = document.getElementById("qtyValue");
  if (!qtyEl) return;
  const stock = parseInt(qtyEl.dataset.stock || 99);
  quantity = Math.min(stock, Math.max(1, quantity + change));
  qtyEl.textContent = quantity;
}

// ── Add to cart ──
async function handleAddToCart() {
  try {
    const res = await fetch(`${BASE_URL}/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ productId, quantity }),
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

// ── Wishlist ──
async function handleWishlist() {
  const btn = document.getElementById("wishlistBtn");
  try {
    const res = await fetch(`${BASE_URL}/wishlist/${productId}`, {
      method: "POST",
      credentials: "include",
    });

    const data = await res.json();

    if (res.ok) {
      btn.classList.toggle("active");
      btn.innerHTML = btn.classList.contains("active")
        ? `<i class="fa-solid fa-heart"></i> Saved`
        : `<i class="fa-regular fa-heart"></i> Wishlist`;
      showToast(data.message, "success");
    } else if (res.status === 401) {
      showToast("Please login to save items", "error");
      setTimeout(() => window.location.href = "./login.html", 1500);
    }
  } catch {
    showToast("Network error", "error");
  }
}

// ── Load reviews ──
async function loadReviews() {
  const content = document.getElementById("reviewsContent");
  const formWrap = document.getElementById("reviewFormWrap");

  try {
    const res = await fetch(`${BASE_URL}/reviews/${productId}`);
    const reviews = await res.json();

    if (!reviews.length) {
      content.innerHTML = `
        <div class="empty-state">
          <p>No reviews yet. Be the first to review this product!</p>
        </div>`;
    } else {
      content.innerHTML = reviews.map((r) => `
        <div class="review-card">
          <div class="review-card-header">
            <span class="review-card-user">${r.user?.name || "Anonymous"}</span>
            <span class="review-card-date">${new Date(r.createdAt).toLocaleDateString()}</span>
          </div>
          <div class="review-card-stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</div>
          <p class="review-card-comment">${r.comment}</p>
        </div>
      `).join("");
    }

    const user = await checkAuth();
    if (user) formWrap.style.display = "block";

  } catch {
    content.innerHTML = `<div class="empty-state"><p>Failed to load reviews</p></div>`;
  }
}

// ── Star rating ──
document.querySelectorAll(".star-rating i").forEach((star) => {
  star.addEventListener("click", () => {
    selectedRating = parseInt(star.dataset.value);
    document.querySelectorAll(".star-rating i").forEach((s, i) => {
      s.className = i < selectedRating ? "fa-solid fa-star active" : "fa-regular fa-star";
    });
  });
});

// ── Submit review ──
document.getElementById("submitReview")?.addEventListener("click", async () => {
  const comment = document.getElementById("reviewComment").value.trim();

  if (!selectedRating) return showToast("Please select a rating", "error");
  if (!comment) return showToast("Please write a comment", "error");

  try {
    const res = await fetch(`${BASE_URL}/reviews/${productId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ rating: selectedRating, comment }),
    });

    const data = await res.json();

    if (res.ok) {
      showToast("Review submitted!", "success");
      document.getElementById("reviewComment").value = "";
      selectedRating = 0;
      document.querySelectorAll(".star-rating i").forEach((s) => {
        s.className = "fa-regular fa-star";
      });
      loadReviews();
    } else {
      showToast(data.message, "error");
    }
  } catch {
    showToast("Network error", "error");
  }
});

// ── Related products ──
async function loadRelatedProducts(categoryId) {
  const grid = document.getElementById("relatedProducts");
  if (!categoryId || !grid) return;

  try {
    const res = await fetch(`${BASE_URL}/products?category=${categoryId}&limit=4`);
    const data = await res.json();

    const related = data.products?.filter((p) => p._id !== productId);

    if (!related?.length) {
      grid.innerHTML = `<div class="empty-state"><p>No related products</p></div>`;
      return;
    }

    grid.innerHTML = related.map(createProductCard).join("");
  } catch {
    grid.innerHTML = `<div class="empty-state"><p>Failed to load related products</p></div>`;
  }
}

// ── Init ──
loadProduct();
loadReviews();