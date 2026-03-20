let currentPage = 1;
let currentCategory = "";
let currentSearch = "";
let currentMinPrice = "";
let currentMaxPrice = "";
let currentOnSale = false;
let totalPages = 1;

// ── Load categories in sidebar ──
async function loadSidebarCategories() {
  const list = document.getElementById("sidebarCategories");
  if (!list) return;

  try {
    const res = await fetch(`${BASE_URL}/categories`);
    const categories = await res.json();

    categories.forEach((cat) => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="#" data-category="${cat._id}">${cat.name}</a>`;
      list.appendChild(li);
    });

    // Category click
    list.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        list.querySelectorAll("a").forEach((a) => a.classList.remove("active"));
        link.classList.add("active");
        currentCategory = link.dataset.category;
        currentPage = 1;
        loadProducts();
      });
    });
  } catch {
    console.error("Failed to load categories");
  }
}

// ── Load products ──
async function loadProducts() {
  const grid = document.getElementById("shopProducts");
  const countEl = document.getElementById("shopCount");
  if (!grid) return;

  grid.innerHTML = `<div class="spinner"></div>`;

  const params = new URLSearchParams();
  params.append("page", currentPage);
  params.append("limit", 12);
  if (currentSearch) params.append("search", currentSearch);
  if (currentCategory) params.append("category", currentCategory);
  if (currentMinPrice) params.append("minPrice", currentMinPrice);
  if (currentMaxPrice) params.append("maxPrice", currentMaxPrice);
  if (currentOnSale) params.append("onSale", "true");

  try {
    const res = await fetch(`${BASE_URL}/products?${params}`);
    const data = await res.json();

    totalPages = data.pages || 1;

    if (!data.products?.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>No products found</h3>
          <p>Try adjusting your search or filters</p>
        </div>`;
      if (countEl) countEl.textContent = "0 products";
      renderPagination();
      return;
    }

    grid.innerHTML = data.products.map(createProductCard).join("");
    if (countEl) countEl.textContent = `${data.total} product${data.total !== 1 ? "s" : ""}`;
    renderPagination();
  } catch {
    grid.innerHTML = `<div class="empty-state"><p>Failed to load products</p></div>`;
  }
}

// ── Pagination ──
function renderPagination() {
  const pagination = document.getElementById("pagination");
  if (!pagination) return;

  pagination.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.classList.add("active");
    btn.addEventListener("click", () => {
      currentPage = i;
      loadProducts();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    pagination.appendChild(btn);
  }
}

// ── Search ──
let searchTimeout;
document.getElementById("searchInput")?.addEventListener("input", (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentSearch = e.target.value.trim();
    currentPage = 1;
    loadProducts();
  }, 500);
});

// ── Price filter ──
document.getElementById("applyPrice")?.addEventListener("click", () => {
  currentMinPrice = document.getElementById("minPrice").value;
  currentMaxPrice = document.getElementById("maxPrice").value;
  currentPage = 1;
  loadProducts();
});

// ── Sale filter ──
document.getElementById("onSaleFilter")?.addEventListener("change", (e) => {
  currentOnSale = e.target.checked;
  currentPage = 1;
  loadProducts();
});

// ── Clear filters ──
document.getElementById("clearFilters")?.addEventListener("click", () => {
  currentCategory = "";
  currentSearch = "";
  currentMinPrice = "";
  currentMaxPrice = "";
  currentOnSale = false;
  currentPage = 1;
  document.getElementById("searchInput").value = "";
  document.getElementById("minPrice").value = "";
  document.getElementById("maxPrice").value = "";
  document.getElementById("onSaleFilter").checked = false;
  document.querySelectorAll(".sidebar-categories a").forEach((a) => a.classList.remove("active"));
  document.querySelector(".sidebar-categories a").classList.add("active");
  loadProducts();
});

// ── Check URL params for category ──
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("category")) {
  currentCategory = urlParams.get("category");
}

// ── Init ──
loadSidebarCategories();
loadProducts();