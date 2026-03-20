// ── Load notifications ──
async function loadNotifications() {
  const content = document.getElementById("notificationsContent");

  try {
    const user = await checkAuth();
    if (!user) {
      content.innerHTML = `
        <div class="empty-state">
          <h3>Please login to view notifications</h3>
          <a href="./login.html" class="btn btn-primary">Login</a>
        </div>`;
      return;
    }

    const res = await fetch(`${BASE_URL}/notifications`, {
      credentials: "include",
    });

    const notifications = await res.json();

    if (!notifications.length) {
      content.innerHTML = `
        <div class="empty-state">
          <h3>No notifications yet</h3>
          <p>You'll be notified about your orders and promotions here</p>
        </div>`;
      return;
    }

    const unreadCount = notifications.filter((n) => !n.read).length;

    content.innerHTML = `
      <div class="notifications-header">
        <h2>Notifications ${unreadCount > 0 ? `<span style="color:var(--primary)">(${unreadCount} unread)</span>` : ""}</h2>
        ${unreadCount > 0 ? `
        <button class="mark-all-btn" id="markAllBtn">
          <i class="fa-solid fa-check-double"></i> Mark all as read
        </button>` : ""}
      </div>
      <div id="notificationsList">
        ${notifications.map((n) => createNotificationCard(n)).join("")}
      </div>
    `;

    // Mark all as read
    document.getElementById("markAllBtn")?.addEventListener("click", async () => {
      await fetch(`${BASE_URL}/notifications/read-all`, {
        method: "PATCH",
        credentials: "include",
      });
      loadNotifications();
    });

    // Mark single as read on click
    document.querySelectorAll(".notification-card").forEach((card) => {
      card.addEventListener("click", async () => {
        const id = card.dataset.id;
        if (card.classList.contains("unread")) {
          await fetch(`${BASE_URL}/notifications/${id}/read`, {
            method: "PATCH",
            credentials: "include",
          });
          card.classList.remove("unread");
          card.querySelector(".notification-dot").style.display = "none";
        }
      });
    });

  } catch {
    content.innerHTML = `<div class="empty-state"><p>Failed to load notifications</p></div>`;
  }
}

// ── Create notification card ──
function createNotificationCard(notification) {
  const icons = {
    order: "fa-box",
    promo: "fa-tag",
    system: "fa-bell",
  };

  const icon = icons[notification.type] || "fa-bell";
  const timeAgo = getTimeAgo(new Date(notification.createdAt));

  return `
    <div class="notification-card ${!notification.read ? "unread" : ""}" data-id="${notification._id}">
      <div class="notification-icon ${notification.type}">
        <i class="fa-solid ${icon}"></i>
      </div>
      <div class="notification-body">
        <p class="notification-message">${notification.message}</p>
        <p class="notification-time">${timeAgo}</p>
      </div>
      <div class="notification-dot"></div>
    </div>
  `;
}

// ── Time ago helper ──
function getTimeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return date.toLocaleDateString();
}

// ── Init ──
loadNotifications();


