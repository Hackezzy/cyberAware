// Page script for Log In. Handles both logging into an existing account
// and creating a new one from the same form.

import { login, register } from "./js/lib/auth.js";
import { syncWithServerIfLoggedIn } from "./js/lib/progress-store.js";

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
const errorEl = document.getElementById("auth-error");
const statusEl = document.getElementById("auth-status");

function setBusy(busy) {
  loginBtn.disabled = busy;
  registerBtn.disabled = busy;
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
  statusEl.hidden = true;
}

async function handle(action, label) {
  errorEl.hidden = true;
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    showError("Enter a username and password.");
    return;
  }

  setBusy(true);
  statusEl.hidden = false;
  statusEl.textContent = `${label}…`;

  try {
    await action(username, password);
    statusEl.textContent = "Success — syncing your progress…";
    await syncWithServerIfLoggedIn();
    window.location.href = "/progress.html";
  } catch (error) {
    showError(error.message || `Couldn't ${label.toLowerCase()}. Is the backend running?`);
    setBusy(false);
  }
}

loginBtn.addEventListener("click", () => handle(login, "Logging in"));
registerBtn.addEventListener("click", () => handle(register, "Creating your account"));
