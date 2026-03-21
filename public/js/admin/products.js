let allCategories = [];

async function loadProducts() {
  const content = document.getElementById("productsTableContent");
  await checkAdminAuth();

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetch(`${ADMIN_BASE_URL}/products?limit=100`, { credentials: "include" }),
      fetch(`${ADMIN_BASE_URL}/categories`, { credentials: "include" }),
    ]);

    const productsData = await productsRes.json();
    allCategories = await categoriesRes.json();

    // Populate category select
    const select = document.getElementById("productCategory");
    allCategories.forEach((cat) => {
      select.innerHTML += `<option value="${cat._id}">${cat.name}</option>`;
    });

    const products = productsData.products;

    if (!products?.length) {
      content.innerHTML = `<div class="empty-state"><p>No products yet</p></div>`;
      return;
    }

    content.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Title</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Sale</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${products.map((p) => `
            <tr>
              <td>
                ${p.images?.length
                  ? `<img src="${UPLOADS_URL}/${p.images[0]}" alt="${p.title}">`
                  : `<div style="width:44px;height:44px;background:var(--light-2);border-radius:var(--radius);display:flex;align-items:center;justify-content:center;color:var(--text-muted)"><i class="fa-solid fa-image"></i></div>`
                }
              </td>
              <td><strong>${p.title}</strong></td>
              <td>${p.category?.name || "-"}</td>
              <td>${formatCurrency(p.price)}</td>
              <td>
                <span style="color:${p.stock > 0 ? "var(--success)" : "var(--error)"};font-weight:600">
                  ${p.stock}
                </span>
              </td>
              <td>
                <span class="status-badge ${p.onSale ? "status-delivered" : "status-cancelled"}">
                  ${p.onSale ? "On Sale" : "No"}
                </span>
              </td>
              <td>
                <div class="action-btns">
                  <button class="action-btn edit" onclick="openEditProduct('${p._id}')">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button class="action-btn toggle" onclick="toggleProductSale('${p._id}')">
                    <i class="fa-solid fa-tag"></i>
                  </button>
                  <button class="action-btn delete" onclick="deleteProduct('${p._id}')">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  } catch {
    content.innerHTML = `<div class="empty-state"><p>Failed to load products</p></div>`;
  }
}

// ── Open modal ──
document.getElementById("addProductBtn").addEventListener("click", () => {
  document.getElementById("productModalTitle").textContent = "Add Product";
  document.getElementById("productId").value = "";
  document.getElementById("productTitle").value = "";
  document.getElementById("productDescription").value = "";
  document.getElementById("productPrice").value = "";
  document.getElementById("productStock").value = "";
  document.getElementById("productCategory").value = "";
  document.getElementById("productSalePrice").value = "";
  document.getElementById("productSaleEnds").value = "";
  document.getElementById("productOnSale").value = "false";
  document.getElementById("productMsg").textContent = "";
  document.getElementById("productModal").classList.add("active");
});

document.getElementById("closeProductModal").addEventListener("click", () => {
  document.getElementById("productModal").classList.remove("active");
});

document.getElementById("productModal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("productModal")) {
    document.getElementById("productModal").classList.remove("active");
  }
});

// ── Open edit ──
async function openEditProduct(id) {
  try {
    const res = await fetch(`${ADMIN_BASE_URL}/products/${id}`, { credentials: "include" });
    const p = await res.json();

    document.getElementById("productModalTitle").textContent = "Edit Product";
    document.getElementById("productId").value = p._id;
    document.getElementById("productTitle").value = p.title;
    document.getElementById("productDescription").value = p.description;
    document.getElementById("productPrice").value = p.price;
    document.getElementById("productStock").value = p.stock;
    document.getElementById("productCategory").value = p.category?._id || "";
    document.getElementById("productSalePrice").value = p.salePrice || "";
    document.getElementById("productSaleEnds").value = p.saleEnds ? p.saleEnds.split("T")[0] : "";
    document.getElementById("productOnSale").value = p.onSale ? "true" : "false";
    document.getElementById("productMsg").textContent = "";
    document.getElementById("productModal").classList.add("active");
  } catch {
    showToast("Failed to load product", "error");
  }
}

// ── Save product ──
document.getElementById("saveProductBtn").addEventListener("click", async () => {
  const id = document.getElementById("productId").value;
  const msg = document.getElementById("productMsg");

  const formData = new FormData();
  formData.append("title", document.getElementById("productTitle").value);
  formData.append("description", document.getElementById("productDescription").value);
  formData.append("price", document.getElementById("productPrice").value);
  formData.append("stock", document.getElementById("productStock").value);
  formData.append("category", document.getElementById("productCategory").value);
  formData.append("salePrice", document.getElementById("productSalePrice").value);
  formData.append("saleEnds", document.getElementById("productSaleEnds").value);
  formData.append("onSale", document.getElementById("productOnSale").value);

  const files = document.getElementById("productImages").files;
  for (const file of files) {
    formData.append("images", file);
  }

  try {
    const url = id
      ? `${ADMIN_BASE_URL}/products/${id}`
      : `${ADMIN_BASE_URL}/products`;
    const method = id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      credentials: "include",
      body: formData,
    });

    const data = await res.json();

    if (res.ok) {
      msg.style.color = "var(--success)";
      msg.textContent = data.message;
      setTimeout(() => {
        document.getElementById("productModal").classList.remove("active");
        loadProducts();
      }, 800);
    } else {
      msg.style.color = "var(--error)";
      msg.textContent = data.message || "Failed to save product";
    }
  } catch {
    msg.style.color = "var(--error)";
    msg.textContent = "Network error";
  }
});

// ── Toggle sale ──
async function toggleProductSale(id) {
  try {
    const res = await fetch(`${ADMIN_BASE_URL}/products/${id}/toggle-sale`, {
      method: "PATCH",
      credentials: "include",
    });
    const data = await res.json();
    showToast(data.message, "success");
    loadProducts();
  } catch {
    showToast("Failed to toggle sale", "error");
  }
}

// ── Delete product ──
async function deleteProduct(id) {
  if (!confirmDelete("Delete this product?")) return;
  try {
    const res = await fetch(`${ADMIN_BASE_URL}/products/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    showToast(data.message, "success");
    loadProducts();
  } catch {
    showToast("Failed to delete product", "error");
  }
}

loadProducts();




window.openEditProduct = openEditProduct;
window.deleteProduct = deleteProduct;
window.toggleProductSale = toggleProductSale;