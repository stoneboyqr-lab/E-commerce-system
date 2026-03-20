// ── Load wishlist ──
async function loadWishlist() {
  const content = document.getElementById("wishlistContent");

  try {
    const user = await checkAuth();
    if (!user) {
      content.innerHTML = `
        <div class="empty-state">
          <h3>Please login to view your wishlist</h3>
          <a href="./login.html" class="btn btn-primary">Login</a>
        </div>`;
      return;
    }

    const res = await fetch(`${BASE_URL}/wishlist`, {
      credentials: "include",
    });

    const data = await res.json();

    if (!data.products?.length) {
      content.innerHTML = `
        <div class="empty-state">
          <h3>Your wishlist is empty</h3>
          <p>Save products you love by clicking the heart icon</p>
          <a href="./shop.html" class="btn btn-primary">Browse Products</a>
        </div>`;
      return;
    }

    content.innerHTML = `
      <div class="wishlist-header">
        <h2>Saved Products</h2>
        <span class="wishlist-count">${data.products.length} item${data.products.length !== 1 ? "s" : ""}</span>
      </div>
      <div class="products-grid" id="wishlistGrid"></div>
    `;

    document.getElementById("wishlistGrid").innerHTML =
      data.products.map(createProductCard).join("");

  } catch {
    content.innerHTML = `<div class="empty-state"><p>Failed to load wishlist</p></div>`;
  }
}

// ── Init ──
loadWishlist();


