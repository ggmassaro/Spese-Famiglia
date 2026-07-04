// Logica applicativa - Spese Famiglia

const loginScreen = document.getElementById("login-screen");
const appContainer = document.getElementById("app-container");
const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");
const loginButton = document.getElementById("login-button");
const loginError = document.getElementById("login-error");
const logoutButton = document.getElementById("logout-button");
const userEmailLabel = document.getElementById("user-email");

function showApp(email) {
  loginScreen.classList.add("d-none");
  appContainer.classList.remove("d-none");
  userEmailLabel.textContent = email || "";
}

function showLogin() {
  appContainer.classList.add("d-none");
  loginScreen.classList.remove("d-none");
  loginError.classList.add("d-none");
  loginError.textContent = "";
  loginPasswordInput.value = "";
}

async function checkSession() {
  const { data } = await db.auth.getSession();
  if (data.session) {
    showApp(data.session.user.email);
  } else {
    showLogin();
  }
}

async function handleLogin() {
  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value;

  const { data, error } = await db.auth.signInWithPassword({ email, password });

  if (error) {
    loginError.textContent = "Email o password non corretti";
    loginError.classList.remove("d-none");
    return;
  }

  showApp(data.user.email);
}

async function handleLogout() {
  await db.auth.signOut();
  showLogin();
}

loginButton.addEventListener("click", handleLogin);
logoutButton.addEventListener("click", handleLogout);

checkSession();
