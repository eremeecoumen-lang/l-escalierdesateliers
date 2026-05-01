const passwordInput = document.querySelector("#adminPassword");
const loginBtn = document.querySelector("#loginBtn");
const loginPanel = document.querySelector("#loginPanel");
const adminList = document.querySelector("#adminList");
const adminMessage = document.querySelector("#adminMessage");

let adminPassword = sessionStorage.getItem("archives-admin-password") || "";

function setMessage(message) {
  adminMessage.textContent = message;
}

function adminHeaders() {
  return { "x-admin-password": adminPassword };
}

function formatDate(value) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

async function requestAdmin(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...adminHeaders(),
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Erreur HTTP ${response.status}`);
  }

  return response.json();
}

async function loadTexts() {
  const texts = await requestAdmin("/api/admin/texts");
  renderTexts(texts);
  loginPanel.hidden = true;
  adminList.hidden = false;
}

function renderTexts(texts) {
  adminList.replaceChildren();

  if (!texts.length) {
    const empty = document.createElement("p");
    empty.className = "admin-message";
    empty.textContent = "Aucun texte pour le moment.";
    adminList.append(empty);
    return;
  }

  texts.forEach((entry) => {
    const item = document.createElement("article");
    const meta = document.createElement("div");
    const text = document.createElement("p");
    const actions = document.createElement("div");
    const toggleBtn = document.createElement("button");
    const deleteBtn = document.createElement("button");

    item.className = `admin-item ${entry.status === "hidden" ? "hidden-text" : ""}`;
    meta.className = "admin-meta";
    text.className = "admin-text";
    actions.className = "admin-actions";

    meta.textContent = `${entry.status === "hidden" ? "masqué" : "publié"} · ${formatDate(entry.createdAt)}`;
    text.textContent = entry.text;
    toggleBtn.type = "button";
    toggleBtn.textContent = entry.status === "hidden" ? "Republier" : "Masquer";
    deleteBtn.type = "button";
    deleteBtn.textContent = "Supprimer";

    toggleBtn.addEventListener("click", async () => {
      await requestAdmin(`/api/admin/texts/${encodeURIComponent(entry.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: entry.status === "hidden" ? "published" : "hidden" })
      });
      await loadTexts();
    });

    deleteBtn.addEventListener("click", async () => {
      if (!confirm("Supprimer définitivement ce texte ?")) {
        return;
      }

      await requestAdmin(`/api/admin/texts/${encodeURIComponent(entry.id)}`, {
        method: "DELETE"
      });
      await loadTexts();
    });

    actions.append(toggleBtn, deleteBtn);
    item.append(meta, text, actions);
    adminList.append(item);
  });
}

loginBtn.addEventListener("click", async () => {
  adminPassword = passwordInput.value;
  sessionStorage.setItem("archives-admin-password", adminPassword);
  setMessage("");

  try {
    await loadTexts();
  } catch (error) {
    setMessage(error.message);
  }
});

if (adminPassword) {
  passwordInput.value = adminPassword;
  loadTexts().catch(() => {
    sessionStorage.removeItem("archives-admin-password");
    adminPassword = "";
  });
}
