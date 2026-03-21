async function loadUsers() {
  const content = document.getElementById("usersTableContent");
  await checkAdminAuth();

  try {
    const res = await fetch(`${ADMIN_BASE_URL}/admin/users`, {
      credentials: "include",
    });

    const users = await res.json();

    if (!users.length) {
      content.innerHTML = `<div class="empty-state"><p>No users yet</p></div>`;
      return;
    }

    content.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${users.map((user) => `
            <tr>
              <td><strong>${user.name}</strong></td>
              <td>${user.email}</td>
              <td>${user.phone || "-"}</td>
              <td>
                <span class="status-badge ${user.role === "admin" ? "status-delivered" : "status-processing"}">
                  ${user.role}
                </span>
              </td>
              <td>
                <span class="status-badge ${user.isActive ? "status-delivered" : "status-cancelled"}">
                  ${user.isActive ? "Active" : "Banned"}
                </span>
              </td>
              <td>${formatDate(user.createdAt)}</td>
              <td>
                <div class="action-btns">
                  ${user.role !== "admin" ? `
                  <button class="action-btn toggle" onclick="toggleBanUser('${user._id}', ${user.isActive})">
                    <i class="fa-solid fa-${user.isActive ? "ban" : "check"}"></i>
                  </button>
                  <button class="action-btn delete" onclick="deleteUser('${user._id}')">
                    <i class="fa-solid fa-trash"></i>
                  </button>` : "<span style='color:var(--text-muted);font-size:0.8rem'>Admin</span>"}
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  } catch {
    content.innerHTML = `<div class="empty-state"><p>Failed to load users</p></div>`;
  }
}

async function toggleBanUser(id, isActive) {
  const action = isActive ? "ban" : "unban";
  if (!confirmDelete(`Are you sure you want to ${action} this user?`)) return;

  try {
    const res = await fetch(`${ADMIN_BASE_URL}/admin/users/${id}/toggle-ban`, {
      method: "PATCH",
      credentials: "include",
    });
    const data = await res.json();
    showToast(data.message, "success");
    loadUsers();
  } catch {
    showToast("Failed to update user", "error");
  }
}

async function deleteUser(id) {
  if (!confirmDelete("Delete this user permanently?")) return;
  try {
    const res = await fetch(`${ADMIN_BASE_URL}/admin/users/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    showToast(data.message, "success");
    loadUsers();
  } catch {
    showToast("Failed to delete user", "error");
  }
}

loadUsers();





window.toggleBanUser = toggleBanUser;
window.deleteUser = deleteUser;