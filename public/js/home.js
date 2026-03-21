// ── Fetch and render categories ──
async function loadCategories() {
  const grid = document.getElementById("categoriesGrid");
  if (!grid) return;

  try {
    const res = await fetch(`${BASE_URL}/categories`);
    const categories = await res.json();

    if (!categories.length) {
      grid.innerHTML = `<div class="empty-state"><p>No categories yet</p></div>`;
      return;
    }

    grid.innerHTML = categories.map((cat) => `
      <a href="./shop.html?category=${cat._id}" class="category-card">
        ${cat.image
          ? `<img src="${UPLOADS_URL}/${cat.image}" alt="${cat.name}">`
          : `<div class="category-card-icon">🛍️</div>`
        }
        <h4>${cat.name}</h4>
      </a>
    `).join("");
  } catch {
    grid.innerHTML = `<div class="empty-state"><p>Failed to load categories</p></div>`;
  }
}

// ── Fetch and render featured products ──
async function loadFeaturedProducts() {
  const grid = document.getElementById("featuredProducts");
  if (!grid) return;

  try {
    const res = await fetch(`${BASE_URL}/products?limit=8`);
    const data = await res.json();

    if (!data.products?.length) {
      grid.innerHTML = `<div class="empty-state"><h3>No products yet</h3></div>`;
      return;
    }

    grid.innerHTML = data.products.map(createProductCard).join("");
  } catch {
    grid.innerHTML = `<div class="empty-state"><p>Failed to load products</p></div>`;
  }
}

// ── Fetch and render new arrivals ──
async function loadNewArrivals() {
  const grid = document.getElementById("newArrivals");
  if (!grid) return;

  try {
    const res = await fetch(`${BASE_URL}/products?limit=4`);
    const data = await res.json();

    if (!data.products?.length) {
      grid.innerHTML = `<div class="empty-state"><h3>No products yet</h3></div>`;
      return;
    }

    grid.innerHTML = data.products.map(createProductCard).join("");
  } catch {
    grid.innerHTML = `<div class="empty-state"><p>Failed to load products</p></div>`;
  }
}

// ── Sale countdown ──
function startCountdown() {
  // Set countdown to midnight
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);

  function update() {
    const diff = midnight - new Date();
    if (diff <= 0) return;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const h = document.getElementById("hours");
    const m = document.getElementById("minutes");
    const s = document.getElementById("seconds");

    if (h) h.textContent = String(hours).padStart(2, "0");
    if (m) m.textContent = String(minutes).padStart(2, "0");
    if (s) s.textContent = String(seconds).padStart(2, "0");
  }

  update();
  setInterval(update, 1000);
}

// ── Init ──
loadCategories();
loadFeaturedProducts();
loadNewArrivals();
startCountdown();