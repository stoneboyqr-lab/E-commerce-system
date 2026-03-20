// ── Load sale products ──
async function loadSaleProducts() {
  const grid = document.getElementById("saleProducts");
  if (!grid) return;

  try {
    const res = await fetch(`${BASE_URL}/products?onSale=true&limit=20`);
    const data = await res.json();

    if (!data.products?.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>No sale products right now</h3>
          <p>Check back soon for amazing deals</p>
          <a href="./shop.html" class="btn btn-primary">Browse All Products</a>
        </div>`;
      return;
    }

    grid.innerHTML = data.products.map(createProductCard).join("");
  } catch {
    grid.innerHTML = `<div class="empty-state"><p>Failed to load sale products</p></div>`;
  }
}

// ── Countdown to end of day ──
function startCountdown() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);

  function update() {
    const diff = midnight - new Date();
    if (diff <= 0) return;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const d = document.getElementById("days");
    const h = document.getElementById("hours");
    const m = document.getElementById("minutes");
    const s = document.getElementById("seconds");

    if (d) d.textContent = String(days).padStart(2, "0");
    if (h) h.textContent = String(hours).padStart(2, "0");
    if (m) m.textContent = String(minutes).padStart(2, "0");
    if (s) s.textContent = String(seconds).padStart(2, "0");
  }

  update();
  setInterval(update, 1000);
}

// ── Init ──
loadSaleProducts();
startCountdown();







