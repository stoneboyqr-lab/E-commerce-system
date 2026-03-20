// ── Login ──
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const btn = document.getElementById("loginBtn");

  btn.disabled = true;
  btn.innerHTML = `Logging in... <i class="fa-solid fa-spinner fa-spin"></i>`;
  if (loginError) loginError.textContent = "";

  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      showToast("Login successful!", "success");
      setTimeout(() => {
        if (data.user.role === "admin") {
          window.location.href = "./admin/dashboard.html";
        } else {
          window.location.href = "./index.html";
        }
      }, 800);
    } else {
      if (loginError) loginError.textContent = data.message;
      btn.disabled = false;
      btn.innerHTML = `Login <i class="fa-solid fa-arrow-right"></i>`;
    }
  } catch {
    if (loginError) loginError.textContent = "Network error. Please try again.";
    btn.disabled = false;
    btn.innerHTML = `Login <i class="fa-solid fa-arrow-right"></i>`;
  }
});

// ── Register ──
const registerForm = document.getElementById("registerForm");
const registerError = document.getElementById("registerError");

registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const btn = document.getElementById("registerBtn");

  if (password !== confirmPassword) {
    if (registerError) registerError.textContent = "Passwords do not match";
    return;
  }

  if (password.length < 6) {
    if (registerError) registerError.textContent = "Password must be at least 6 characters";
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `Creating account... <i class="fa-solid fa-spinner fa-spin"></i>`;
  if (registerError) registerError.textContent = "";

  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, phone, password }),
    });

    const data = await res.json();

    if (res.ok) {
      showToast("Account created successfully!", "success");
      setTimeout(() => {
        window.location.href = "./index.html";
      }, 800);
    } else {
      if (registerError) registerError.textContent = data.message;
      btn.disabled = false;
      btn.innerHTML = `Create Account <i class="fa-solid fa-arrow-right"></i>`;
    }
  } catch {
    if (registerError) registerError.textContent = "Network error. Please try again.";
    btn.disabled = false;
    btn.innerHTML = `Create Account <i class="fa-solid fa-arrow-right"></i>`;
  }
});

// ── Toggle password visibility ──
document.getElementById("togglePassword")?.addEventListener("click", () => {
  const passwordInput = document.getElementById("password");
  const icon = document.querySelector("#togglePassword i");

  if (!passwordInput) return;
  
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    icon.className = "fa-regular fa-eye-slash";
  } else {
    passwordInput.type = "password";
    icon.className = "fa-regular fa-eye";
  }
});

// ── Redirect if already logged in ──
(async () => {
  const user = await checkAuth();
  if (user) {
    window.location.href = user.role === "admin"
      ? "./admin/dashboard.html"
      : "./index.html";
  }
})();