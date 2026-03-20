async function loadReviews() {
  const content = document.getElementById("reviewsTableContent");
  await checkAdminAuth();

  try {
    const res = await fetch(`${ADMIN_BASE_URL}/reviews`, { credentials: "include" });
    const reviews = await res.json();

    if (!reviews.length) {
      content.innerHTML = `<div class="empty-state"><p>No reviews yet</p></div>`;
      return;
    }

    content.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Product</th>
            <th>Rating</th>
            <th>Comment</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${reviews.map((r) => `
            <tr>
              <td>${r.user?.name || "Unknown"}</td>
              <td>${r.product?.title || "Unknown"}</td>
              <td style="color:var(--primary)">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</td>
              <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.comment}</td>
              <td>${formatDate(r.createdAt)}</td>
              <td>
                <button class="action-btn delete" onclick="deleteReview('${r._id}')">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  } catch {
    content.innerHTML = `<div class="empty-state"><p>Failed to load reviews</p></div>`;
  }
}

async function deleteReview(id) {
  if (!confirmDelete("Delete this review?")) return;
  try {
    const res = await fetch(`${ADMIN_BASE_URL}/reviews/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    showToast(data.message, "success");
    loadReviews();
  } catch {
    showToast("Failed to delete review", "error");
  }
}

loadReviews();


