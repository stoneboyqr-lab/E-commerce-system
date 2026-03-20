
checkAdminAuth();

document.getElementById("sendNotifBtn").addEventListener("click", async () => {
  const message = document.getElementById("notifMessage").value.trim();
  const type = document.getElementById("notifType").value;
  const msg = document.getElementById("notifMsg");

  if (!message) {
    msg.style.color = "var(--error)";
    msg.textContent = "Message is required";
    return;
  }

  try {
    const res = await fetch(`${ADMIN_BASE_URL}/notifications/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message, type }),
    });

    const data = await res.json();

    if (res.ok) {
      msg.style.color = "var(--success)";
      msg.textContent = data.message;
      document.getElementById("notifMessage").value = "";
      showToast(data.message, "success");
    } else {
      msg.style.color = "var(--error)";
      msg.textContent = data.message || "Failed to send notification";
    }
  } catch {
    msg.style.color = "var(--error)";
    msg.textContent = "Network error";
  }
});
