// ── Auth guard: if already logged in → go to chat ────────────────────────────
(async () => {
  const { data: { session } } = await window._sb.auth.getSession();
  if (session) window.location.href = "index.html";
})();

// ── Tab switcher ──────────────────────────────────────────────────────────────
function switchTab(tab) {
  const isLogin = tab === "login";
  document.getElementById("loginForm").style.display  = isLogin ? "block" : "none";
  document.getElementById("signupForm").style.display = isLogin ? "none"  : "block";
  document.getElementById("tabLogin").classList.toggle("active",  isLogin);
  document.getElementById("tabSignup").classList.toggle("active", !isLogin);
  clearErrors();
}

function clearErrors() {
  ["loginError","signupError","signupSuccess"].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.style.display = "none"; el.textContent = ""; }
  });
}
function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg; el.style.display = "block";
}
function showSuccess(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg; el.style.display = "block";
}
function setLoading(btnId, loading, label) {
  const btn = document.getElementById(btnId);
  btn.disabled = loading;
  btn.textContent = loading ? "Please wait…" : label;
}

// ── Login ─────────────────────────────────────────────────────────────────────
async function handleLogin() {
  clearErrors();
  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  if (!email || !password) return showError("loginError", "Please fill in all fields.");
  setLoading("loginBtn", true, "Login");
  const { error } = await window._sb.auth.signInWithPassword({ email, password });
  setLoading("loginBtn", false, "Login");
  if (error) return showError("loginError", error.message);
  window.location.href = "index.html";
}

// ── Signup ────────────────────────────────────────────────────────────────────
async function handleSignup() {
  clearErrors();
  const name     = document.getElementById("signupName").value.trim();
  const email    = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  if (!name || !email || !password) return showError("signupError", "Please fill in all fields.");
  if (password.length < 6) return showError("signupError", "Password must be at least 6 characters.");
  setLoading("signupBtn", true, "Create Account");
  const { error } = await window._sb.auth.signUp({
    email, password,
    options: { data: { full_name: name } }
  });
  setLoading("signupBtn", false, "Create Account");
  if (error) return showError("signupError", error.message);
  showSuccess("signupSuccess", "✅ Account created! Check your email to confirm, then log in.");
}

// ── Forgot Password ───────────────────────────────────────────────────────────
async function handleForgotPassword() {
  const email = document.getElementById("loginEmail").value.trim();
  if (!email) return showError("loginError", "Enter your email above first.");
  const { error } = await window._sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/login.html"
  });
  if (error) return showError("loginError", error.message);
  const el = document.getElementById("loginError");
  el.textContent = "✅ Password reset email sent!";
  el.style.display = "block";
  el.style.color = "#22c55e";
}

// ── Enter key support ─────────────────────────────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const isLogin = document.getElementById("loginForm").style.display !== "none";
  if (isLogin) handleLogin(); else handleSignup();
});
