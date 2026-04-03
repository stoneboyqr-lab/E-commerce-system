async function loadCategories() {
  const content = document.getElementById("categoriesTableContent");
  await checkAdminAuth();

  try {
    const res = await fetch(`${ADMIN_BASE_URL}/categories`, { credentials: "include" });
    const categories = await res.json();

    if (!categories.length) {
      content.innerHTML = `<div class="empty-state"><p>No categories yet</p></div>`;
      return;
    }

    content.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Slug</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${categories.map((cat) => `
            <tr>
              <td>
                ${cat.image
                  ? `<img src="${getImageUrl(cat.image)}" alt="${cat.name}">`
                  : `<div style="width:44px;height:44px;background:var(--light-2);border-radius:var(--radius);display:flex;align-items:center;justify-content:center;color:var(--text-muted)"><i class="fa-solid fa-image"></i></div>`
                }
              </td>
              <td><strong>${cat.name}</strong></td>
              <td style="color:var(--text-muted)">${cat.slug}</td>
              <td>
                <div class="action-btns">
                  <button class="action-btn edit" onclick="openEditCategory('${cat._id}', '${cat.name}')">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button class="action-btn delete" onclick="deleteCategory('${cat._id}')">
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
    content.innerHTML = `<div class="empty-state"><p>Failed to load categories</p></div>`;
  }
}

document.getElementById("addCategoryBtn").addEventListener("click", () => {
  document.getElementById("categoryModalTitle").textContent = "Add Category";
  document.getElementById("categoryId").value = "";
  document.getElementById("categoryName").value = "";
  document.getElementById("categoryMsg").textContent = "";
  document.getElementById("categoryModal").classList.add("active");
});

document.getElementById("closeCategoryModal").addEventListener("click", () => {
  document.getElementById("categoryModal").classList.remove("active");
});

document.getElementById("categoryModal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("categoryModal")) {
    document.getElementById("categoryModal").classList.remove("active");
  }
});

function openEditCategory(id, name) {
  document.getElementById("categoryModalTitle").textContent = "Edit Category";
  document.getElementById("categoryId").value = id;
  document.getElementById("categoryName").value = name;
  document.getElementById("categoryMsg").textContent = "";
  document.getElementById("categoryModal").classList.add("active");
}

document.getElementById("saveCategoryBtn").addEventListener("click", async () => {
  const id = document.getElementById("categoryId").value;
  const name = document.getElementById("categoryName").value.trim();
  const msg = document.getElementById("categoryMsg");

  if (!name) {
    msg.style.color = "var(--error)";
    msg.textContent = "Category name is required";
    return;
  }

  const formData = new FormData();
  formData.append("name", name);
  const file = document.getElementById("categoryImage").files[0];
  if (file) formData.append("image", file);

  try {
    const url = id
      ? `${ADMIN_BASE_URL}/categories/${id}`
      : `${ADMIN_BASE_URL}/categories`;
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
        document.getElementById("categoryModal").classList.remove("active");
        loadCategories();
      }, 800);
    } else {
      msg.style.color = "var(--error)";
      msg.textContent = data.message || "Failed to save category";
    }
  } catch {
    msg.style.color = "var(--error)";
    msg.textContent = "Network error";
  }
});

async function deleteCategory(id) {
  if (!confirmDelete("Delete this category?")) return;
  try {
    const res = await fetch(`${ADMIN_BASE_URL}/categories/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    showToast(data.message, "success");
    loadCategories();
  } catch {
    showToast("Failed to delete category", "error");
  }
}

loadCategories();




window.openEditCategory = openEditCategory;
window.deleteCategory = deleteCategory;