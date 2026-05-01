const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const root = __dirname;
const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(root, "data");
const dataFile = path.join(dataDir, "texts.json");
const port = Number(process.env.PORT) || (process.env.RENDER ? 10000 : 3000);
const adminPassword = process.env.ADMIN_PASSWORD || "change-moi";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

async function ensureDataFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, "[]\n", "utf8");
  }
}

async function readTexts() {
  await ensureDataFile();
  const raw = await fs.readFile(dataFile, "utf8");
  const parsed = JSON.parse(raw || "[]");
  return Array.isArray(parsed) ? parsed : [];
}

async function writeTexts(texts) {
  await ensureDataFile();
  await fs.writeFile(dataFile, `${JSON.stringify(texts, null, 2)}\n`, "utf8");
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, status, message) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(message);
}

async function readJsonBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 80_000) {
      throw new Error("Payload too large");
    }
  }

  return body ? JSON.parse(body) : {};
}

function isAdmin(request) {
  return request.headers["x-admin-password"] === adminPassword;
}

function publicEntry(entry) {
  return {
    id: entry.id,
    title: entry.title || "",
    text: entry.text,
    createdAt: entry.createdAt
  };
}

function normalizeIncomingText(value) {
  return String(value || "").trim().slice(0, 6000);
}

async function handleApi(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/texts") {
    const texts = await readTexts();
    const published = texts
      .filter((entry) => entry.status === "published")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(publicEntry);
    sendJson(response, 200, published);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/texts") {
    const body = await readJsonBody(request);
    const text = normalizeIncomingText(body.text);
    if (!text) {
      sendJson(response, 400, { error: "Texte vide." });
      return;
    }

    const texts = await readTexts();
    const entry = {
      id: crypto.randomUUID(),
      title: String(body.title || "").trim().slice(0, 120),
      text,
      createdAt: new Date().toISOString(),
      status: "published"
    };
    texts.unshift(entry);
    await writeTexts(texts);
    sendJson(response, 201, publicEntry(entry));
    return;
  }

  if (url.pathname === "/api/admin/texts") {
    if (!isAdmin(request)) {
      sendJson(response, 401, { error: "Mot de passe administrateur requis." });
      return;
    }

    if (request.method === "GET") {
      const texts = await readTexts();
      sendJson(response, 200, texts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      return;
    }
  }

  const adminMatch = url.pathname.match(/^\/api\/admin\/texts\/([^/]+)$/);
  if (adminMatch) {
    if (!isAdmin(request)) {
      sendJson(response, 401, { error: "Mot de passe administrateur requis." });
      return;
    }

    const id = decodeURIComponent(adminMatch[1]);
    const texts = await readTexts();
    const index = texts.findIndex((entry) => entry.id === id);
    if (index === -1) {
      sendJson(response, 404, { error: "Texte introuvable." });
      return;
    }

    if (request.method === "PATCH") {
      const body = await readJsonBody(request);
      if (!["published", "hidden"].includes(body.status)) {
        sendJson(response, 400, { error: "Statut invalide." });
        return;
      }

      texts[index].status = body.status;
      await writeTexts(texts);
      sendJson(response, 200, texts[index]);
      return;
    }

    if (request.method === "DELETE") {
      const [removed] = texts.splice(index, 1);
      await writeTexts(texts);
      sendJson(response, 200, removed);
      return;
    }
  }

  sendJson(response, 404, { error: "Route inconnue." });
}

async function serveStatic(response, url) {
  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const resolved = path.normalize(path.join(root, requested));

  if (!resolved.startsWith(root)) {
    sendText(response, 403, "Acces refuse.");
    return;
  }

  try {
    const data = await fs.readFile(resolved);
    const extension = path.extname(resolved).toLowerCase();
    response.writeHead(200, {
      "Content-Type": mimeTypes[extension] || "application/octet-stream"
    });
    response.end(data);
  } catch {
    sendText(response, 404, "Fichier introuvable.");
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url);
      return;
    }

    await serveStatic(response, url);
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { error: "Erreur serveur." });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`archives textuelles: http://localhost:${port}`);
  if (adminPassword === "change-moi") {
    console.log("Definis ADMIN_PASSWORD avant l'hebergement pour proteger la moderation.");
  }
});
