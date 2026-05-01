const SOUND_STORAGE_KEY = "helical-text-staircase-sound-v1";
const SOUND_FILE = "assets/scroll-wheel.mp3";
const SOUND_START = 8.18;
const SOUND_DURATION = 185;
const SOUND_RUSH_DURATION = 150;

const app = document.querySelector(".app");
const staircase = document.querySelector("#staircase");
const staircaseShell = document.querySelector(".staircase-shell");
const emptyState = document.querySelector("#emptyState");
const textInput = document.querySelector("#textInput");
const counter = document.querySelector("#counter");
const activeText = document.querySelector("#activeText");
const reader = document.querySelector(".reader");
const positionLabel = document.querySelector("#positionLabel");
const dateLabel = document.querySelector("#dateLabel");
const floor = document.querySelector("#floor");
const olderBtn = document.querySelector("#olderBtn");
const newerBtn = document.querySelector("#newerBtn");
const searchBtn = document.querySelector("#searchBtn");
const searchPanel = document.querySelector("#searchPanel");
const searchInput = document.querySelector("#searchInput");
const searchResults = document.querySelector("#searchResults");
const searchCloseBtn = document.querySelector("#searchCloseBtn");
const soundBtn = document.querySelector("#soundBtn");
const immersiveBtn = document.querySelector("#immersiveBtn");
const sectionSteps = document.querySelector("#sectionSteps");
const sectionMap = document.querySelector(".section-map");
const sectionTicks = document.querySelector("#sectionTicks");
const sectionMarker = document.querySelector("#sectionMarker");
const sectionMapCount = document.querySelector("#sectionMapCount");
const sectionFrontRail = document.querySelector("#sectionFrontRail");
const sectionBackRail = document.querySelector("#sectionBackRail");
const sectionTotalLabel = document.querySelector("#sectionTotalLabel");
const textDialog = document.querySelector("#textDialog");
const dialogMeta = document.querySelector("#dialogMeta");
const dialogTitle = document.querySelector("#dialogTitle");
const dialogText = document.querySelector("#dialogText");
const dialogCloseBtn = document.querySelector("#dialogCloseBtn");
const dialogReaderBtn = document.querySelector("#dialogReaderBtn");
const dialogNewerBtn = document.querySelector("#dialogNewerBtn");
const dialogOlderBtn = document.querySelector("#dialogOlderBtn");
const sectionMapTip = document.querySelector("#sectionMapTip");
const textLimit = Number(textInput?.maxLength) || 6000;
const svgNamespace = "http://www.w3.org/2000/svg";

let entries = loadEntries();
let activeIndex = 0;
let lastActiveIndex = 0;
let renderFrame = 0;
let motionTimer;
let rushTimer;
let lastMoveAt = 0;
let lastMoveDirection = 0;
let moveStreak = 0;
let soundPlayers = [];
let soundPlayerIndex = 0;
let soundEnabled = localStorage.getItem(SOUND_STORAGE_KEY) !== "off";
let lastJumpDistance = 1;

function loadEntries() {
  return getDefaultEntries();
}

function getDefaultEntries() {
  const source = Array.isArray(window.ARCHIVES_TEXTUELLES) ? window.ARCHIVES_TEXTUELLES : [];
  return source
    .filter((entry) => entry && typeof entry.text === "string" && entry.text.trim())
    .map((entry, index) =>
      normalizeEntry(
        {
          ...entry,
          text: entry.text.trim(),
          createdAt: entry.createdAt || "2026-01-01T00:00:00.000Z"
        },
        index
      )
    );
}

function normalizeEntry(entry, index = 0) {
  return {
    id: entry.id || `entry-${entry.createdAt}-${index}`,
    title: entry.title || "",
    text: entry.text,
    createdAt: entry.createdAt
  };
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

function clampActiveIndex() {
  activeIndex = Math.max(0, Math.min(activeIndex, entries.length - 1));
}

function getArchiveProgress(index = activeIndex) {
  return entries.length <= 1 ? 0 : Math.max(0, Math.min(1, index / (entries.length - 1)));
}

function getEra(progress = getArchiveProgress()) {
  if (progress > 0.82) {
    return "foundation";
  }

  if (progress > 0.58) {
    return "deep";
  }

  if (progress > 0.28) {
    return "middle";
  }

  return "recent";
}

function updateMotionDuration(jumpDistance = 1, isRushing = false) {
  const duration = isRushing ? 920 : Math.min(2600, 1320 + Math.max(0, jumpDistance - 1) * 34);
  document.documentElement.style.setProperty("--step-duration", `${duration}ms`);
}

function smoothStep(value) {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

function getStepMetrics(distance) {
  const magnitude = Math.abs(distance);
  const stageWidth = Math.min(window.innerWidth, 1080);
  const radius = Math.min(stageWidth * 0.28, 320);
  let x = 0;
  let y = 0;
  let z = 0;
  let rotateZ = 0;
  let scale = 1;
  let blur = 0;
  let opacity = 1;
  let brightness = 1;

  if (distance < 0) {
    const angle = distance * 38 - 12;
    const radians = angle * (Math.PI / 180);
    const orbitRadius = Math.max(radius - magnitude * 20, radius * 0.42);
    x = Math.sin(radians) * orbitRadius * 0.58;
    y = -112 - magnitude * 39 + Math.cos(radians) * 32;
    z = -magnitude * 225;
    rotateZ = angle * 0.12;
    scale = Math.max(0.38, 0.92 - magnitude * 0.1);
    blur = Math.min(7, 0.9 + magnitude * 0.62);
    opacity = Math.max(0.13, 0.56 - magnitude * 0.055);
    brightness = Math.max(0.9, 0.99 - magnitude * 0.018);
  }

  if (distance > 0) {
    const angle = distance * 44 - 18;
    const radians = angle * (Math.PI / 180);
    const orbitRadius = Math.max(radius - magnitude * 16, radius * 0.46);
    x = Math.sin(radians) * orbitRadius * 0.76;
    y = 74 + magnitude * 44 + Math.cos(radians) * 42;
    z = -magnitude * 170;
    rotateZ = angle * 0.11;
    scale = Math.max(0.38, 0.93 - magnitude * 0.086);
    blur = Math.min(6.5, magnitude * 0.58);
    opacity = Math.max(0.14, 0.82 - magnitude * 0.082);
    brightness = Math.max(0.92, 1 - magnitude * 0.012);
  }

  if (distance === 0) {
    x = 0;
    y = 16;
    z = 46;
    rotateZ = -1.5;
    scale = 1;
    blur = 0;
    opacity = 1;
    brightness = 1.04;
  }

  return { x, y, z, rotateZ, scale, blur, opacity, brightness };
}

function applyStepPosition(step, distance, isDeparted) {
  const metrics = getStepMetrics(distance);
  step.style.transform = `translate(-50%, -50%) translate3d(${metrics.x}px, ${metrics.y}px, ${metrics.z}px) rotateZ(${metrics.rotateZ}deg) scale(${metrics.scale})`;
  step.style.filter = `blur(${metrics.blur}px) brightness(${metrics.brightness})`;
  step.style.opacity = metrics.opacity;
  step.style.setProperty("--depth", String(Math.abs(distance)));
  step.style.zIndex = String(isDeparted ? 80 : 140 - Math.abs(distance));
  step.classList.toggle("active", distance === 0);
  step.classList.toggle("departed", isDeparted);
  step.classList.toggle("older-step", distance > 0);
  step.classList.toggle("newer-step", distance < 0);
  step.hidden = Math.abs(distance) > 9;
}

function createStep(entry, index) {
  const step = document.createElement("li");
  const stepIndex = document.createElement("span");
  const button = document.createElement("button");
  const time = document.createElement("time");
  const paragraph = document.createElement("p");

  step.className = "step";
  step.dataset.id = entry.id;
  stepIndex.className = "step-index";
  button.type = "button";
  button.setAttribute("aria-label", `Aller a la marche ${index + 1}`);
  button.addEventListener("click", () => {
    const nextIndex = entries.findIndex((item) => item.id === entry.id);
    if (nextIndex === -1) {
      return;
    }

    if (nextIndex === activeIndex) {
      openTextDialog(nextIndex);
      return;
    }

    lastActiveIndex = activeIndex;
    activeIndex = nextIndex;
    lastJumpDistance = Math.abs(nextIndex - lastActiveIndex);
    updateMotionDuration(lastJumpDistance, false);
    pulseMotion(false);
    playStepSound(nextIndex > lastActiveIndex ? 1 : -1, false, nextIndex);
    render();
  });

  time.className = "step-time";
  paragraph.className = "step-text";
  button.append(time, paragraph);
  step.append(stepIndex, button);

  return step;
}

function updateStepContent(step, entry, index) {
  const stepIndex = step.querySelector(".step-index");
  const button = step.querySelector("button");
  const time = step.querySelector("time");
  const paragraph = step.querySelector("p");

  stepIndex.textContent = String(index + 1).padStart(2, "0");
  button.setAttribute("aria-label", `Aller a la marche ${index + 1}`);
  time.dateTime = entry.createdAt;
  time.textContent = formatDate(entry.createdAt);
  paragraph.textContent = entry.text;
}

function getSectionPoint(t) {
  const angle = -Math.PI / 2 + t * Math.PI * 8.75;
  return {
    x: 90 + Math.sin(angle) * 24,
    y: 18 + t * 126
  };
}

function getSectionBackPoint(t) {
  const point = getSectionPoint(t);
  return {
    x: 180 - point.x,
    y: point.y
  };
}

function updateSectionMap() {
  const total = Math.max(entries.length, 1);
  const segmentCount = 160;
  let path = "";
  let backPath = "";

  for (let i = 0; i <= segmentCount; i += 1) {
    const point = getSectionPoint(i / segmentCount);
    const backPoint = getSectionBackPoint(i / segmentCount);

    if (i === 0) {
      path = `M ${point.x} ${point.y}`;
      backPath = `M ${backPoint.x} ${backPoint.y}`;
      continue;
    }

    path += ` L ${point.x} ${point.y}`;
    backPath += ` L ${backPoint.x} ${backPoint.y}`;
  }

  sectionFrontRail.setAttribute("d", path);
  sectionBackRail.setAttribute("d", backPath);
  sectionTicks.replaceChildren();

  let stepsPath = "";
  const stepCount = 24;
  for (let i = 0; i <= stepCount; i += 1) {
    const t = i / stepCount;
    const point = getSectionPoint(t);
    const treadStart = 90;
    const treadEnd = point.x;
    stepsPath += `${i === 0 ? "M" : " M"} ${treadStart} ${point.y} L ${treadEnd} ${point.y}`;
  }
  sectionSteps.setAttribute("d", stepsPath);

  if (!entries.length) {
    sectionTicks.replaceChildren();
    sectionMarker.style.opacity = "0";
    sectionMapCount.textContent = "0/0";
    sectionMap.style.setProperty("--map-progress", "0");
    sectionTotalLabel.textContent = "↓ 0";
    sectionMap.classList.add("empty");
    return;
  }

  sectionMarker.style.opacity = "1";
  sectionMap.classList.remove("empty");

  const tickCount = Math.min(total, 18);
  for (let i = 0; i < tickCount; i += 1) {
    const t = tickCount === 1 ? 0 : i / (tickCount - 1);
    const point = getSectionPoint(t);
    const tick = document.createElementNS(svgNamespace, "path");
    tick.setAttribute("class", "section-tick");
    tick.setAttribute("d", `M 90 ${point.y} L ${point.x} ${point.y}`);
    sectionTicks.append(tick);
  }

  const activeT = total === 1 ? 0 : activeIndex / (total - 1);
  const activePoint = getSectionPoint(activeT);
  sectionMarker.setAttribute("cx", activePoint.x);
  sectionMarker.setAttribute("cy", activePoint.y);
  sectionMapCount.textContent = `${activeIndex + 1}/${total}`;
  sectionMap.style.setProperty("--map-progress", String(activeT));
  sectionTotalLabel.textContent = `↓ ${total}`;
}

function getEntryTitle(entry, index) {
  if (entry.title) {
    return entry.title;
  }

  const firstLine = entry.text.split(/\n+/).find(Boolean) || "";
  return firstLine.length <= 90 ? firstLine : `Marche ${index + 1}`;
}

function updateTextDialog() {
  const entry = entries[activeIndex];
  if (!entry) {
    return;
  }

  dialogMeta.textContent = `Marche ${activeIndex + 1} sur ${entries.length} · ${formatDate(entry.createdAt)}`;
  dialogTitle.textContent = getEntryTitle(entry, activeIndex);
  dialogText.textContent = entry.text;
  dialogNewerBtn.disabled = activeIndex === 0;
  dialogOlderBtn.disabled = activeIndex === entries.length - 1;
}

function openTextDialog(index = activeIndex) {
  activeIndex = index;
  render();
  updateTextDialog();
  textDialog.classList.remove("reading-mode");
  dialogReaderBtn.setAttribute("aria-pressed", "false");
  dialogReaderBtn.textContent = "Mode lecture";
  textDialog.showModal();
  dialogText.scrollTop = 0;
}

function moveFromDialog(delta) {
  const next = activeIndex + delta;
  if (next < 0 || next >= entries.length) {
    return;
  }

  const isRushing = updateMoveStreak(delta);
  lastJumpDistance = Math.abs(next - activeIndex);
  updateMotionDuration(lastJumpDistance, isRushing);
  pulseMotion(isRushing);
  playStepSound(delta, isRushing, next);
  activeIndex = next;
  render();
  updateTextDialog();
}

function render() {
  clampActiveIndex();
  const currentFrame = (renderFrame += 1);
  const movingOlder = activeIndex > lastActiveIndex;
  const departingEntry = entries[lastActiveIndex];
  const visibleIds = new Set();
  const progress = getArchiveProgress();

  if (!entries.length) {
    staircase.replaceChildren();
    emptyState.hidden = false;
    app.dataset.era = "recent";
    app.style.setProperty("--archive-progress", "0");
    app.style.setProperty("--depth-wash", "0");
    app.style.setProperty("--depth-light", "0.22");
    app.style.setProperty("--depth-top-light", "0.24");
    app.style.setProperty("--depth-upper-light", "0.17");
    app.style.setProperty("--depth-dark", "0");
    app.style.setProperty("--depth-overlay", "0.14");
    app.style.setProperty("--abyss-core", "0");
    app.style.setProperty("--abyss-bottom", "0");
    app.style.setProperty("--read-ink-rgb", "20, 20, 20");
    app.style.setProperty("--muted-ink-rgb", "90, 94, 94");
    app.style.setProperty("--active-paper-rgb", "255, 257, 256");
    app.style.setProperty("--active-paper-bottom-rgb", "248, 252, 251");
    app.style.setProperty("--active-paper-alpha", "0.98");
    app.style.setProperty("--active-edge-rgb", "255, 255, 255");
    app.style.setProperty("--active-edge-alpha", "0.72");
    app.style.setProperty("--active-glow-rgb", "255, 255, 255");
    app.style.setProperty("--active-glow-alpha", "0.18");
    app.style.setProperty("--active-sheen", "0.16");
    app.style.setProperty("--dialog-paper-rgb", "255, 257, 256");
    app.style.setProperty("--dialog-paper-bottom-rgb", "248, 252, 251");
    app.style.setProperty("--dialog-paper-alpha", "0.97");
    app.style.setProperty("--read-shadow-rgb", "255, 255, 255");
    app.style.setProperty("--read-shadow-alpha", "0.38");
    app.style.setProperty("--read-glow-rgb", "255, 255, 255");
    app.style.setProperty("--read-glow-alpha", "0.08");
    app.style.setProperty("--ghost-paper-rgb", "255, 257, 256");
    app.style.setProperty("--ghost-paper-bottom-rgb", "244, 248, 247");
    app.style.setProperty("--ghost-paper-alpha", "0.78");
    app.style.setProperty("--ghost-paper-bottom-alpha", "0.58");
    app.style.setProperty("--ghost-ink-rgb", "30, 30, 30");
    app.style.setProperty("--ghost-ink-alpha", "0.68");
    app.style.setProperty("--ghost-edge-rgb", "255, 255, 255");
    app.style.setProperty("--ghost-edge-alpha", "0.32");
    app.style.setProperty("--ghost-glow-rgb", "255, 255, 255");
    app.style.setProperty("--ghost-glow-alpha", "0.04");
    reader.dataset.era = "escalier vide";
    activeText.textContent = "La première marche attend son texte.";
    positionLabel.textContent = "Aucune marche";
    dateLabel.textContent = "";
    floor.classList.remove("visible");
    newerBtn.disabled = true;
    olderBtn.disabled = true;
    searchBtn.disabled = true;
    updateSectionMap();
    lastActiveIndex = 0;
    return;
  }

  emptyState.hidden = true;
  searchBtn.disabled = false;

  entries.forEach((entry, index) => {
    const distance = index - activeIndex;
    const isDeparted = movingOlder && entry === departingEntry && lastActiveIndex !== activeIndex;
    if (Math.abs(distance) > 9 && !isDeparted) {
      return;
    }

    let step = staircase.querySelector(`[data-id="${CSS.escape(entry.id)}"]`);
    if (!step) {
      step = createStep(entry, index);
      const startDistance = index - lastActiveIndex;
      applyStepPosition(step, startDistance, false);
      staircase.append(step);
      requestAnimationFrame(() => {
        if (currentFrame === renderFrame) {
          applyStepPosition(step, distance, isDeparted);
        }
      });
    } else {
      applyStepPosition(step, distance, isDeparted);
    }

    updateStepContent(step, entry, index);
    visibleIds.add(entry.id);
  });

  Array.from(staircase.children).forEach((step) => {
    if (!visibleIds.has(step.dataset.id)) {
      step.remove();
    }
  });

  const activeEntry = entries[activeIndex];
  app.dataset.era = getEra(progress);
  app.style.setProperty("--archive-progress", String(progress));
  const abyss = progress ** 1.35;
  app.style.setProperty("--depth-wash", (abyss * 0.42).toFixed(3));
  app.style.setProperty("--depth-light", Math.max(0.025, 0.22 - abyss * 0.18).toFixed(3));
  app.style.setProperty("--depth-top-light", Math.max(0.015, 0.24 - abyss * 0.22).toFixed(3));
  app.style.setProperty("--depth-upper-light", Math.max(0.015, 0.17 - abyss * 0.15).toFixed(3));
  app.style.setProperty("--depth-dark", (abyss * 0.62).toFixed(3));
  app.style.setProperty("--depth-overlay", (0.14 + abyss * 0.86).toFixed(3));
  app.style.setProperty("--abyss-core", (abyss * 0.34).toFixed(3));
  app.style.setProperty("--abyss-bottom", (abyss * 0.5).toFixed(3));
  const darkMix = smoothStep((progress - 0.34) / 0.38);
  const inkMix = progress < 0.62 ? 0 : smoothStep((progress - 0.62) / 0.055);
  const inkValue = Math.round(20 + inkMix * 224);
  const mutedValue = Math.round(90 + inkMix * 130);
  const paperValue = Math.round(255 - darkMix * 226);
  const paperBottomValue = Math.round(248 - darkMix * 228);
  const dialogPaperValue = Math.round(255 - darkMix * 218);
  const dialogBottomValue = Math.round(248 - darkMix * 220);
  app.style.setProperty("--read-ink-rgb", `${inkValue}, ${inkValue}, ${inkValue}`);
  app.style.setProperty("--muted-ink-rgb", `${mutedValue}, ${mutedValue + 4}, ${mutedValue + 4}`);
  app.style.setProperty("--active-paper-rgb", `${paperValue}, ${paperValue + 2}, ${paperValue + 1}`);
  app.style.setProperty("--active-paper-bottom-rgb", `${paperBottomValue}, ${paperBottomValue + 4}, ${paperBottomValue + 3}`);
  app.style.setProperty("--active-paper-alpha", (0.98 - darkMix * 0.05).toFixed(3));
  app.style.setProperty("--active-edge-rgb", inkMix > 0.5 ? "230, 242, 238" : "255, 255, 255");
  app.style.setProperty("--active-edge-alpha", (0.72 - darkMix * 0.36).toFixed(3));
  app.style.setProperty("--active-glow-rgb", inkMix > 0.5 ? "214, 232, 226" : "255, 255, 255");
  app.style.setProperty("--active-glow-alpha", (0.18 - darkMix * 0.06).toFixed(3));
  app.style.setProperty("--active-sheen", (0.16 - darkMix * 0.08).toFixed(3));
  app.style.setProperty("--dialog-paper-rgb", `${dialogPaperValue}, ${dialogPaperValue + 2}, ${dialogPaperValue + 1}`);
  app.style.setProperty("--dialog-paper-bottom-rgb", `${dialogBottomValue}, ${dialogBottomValue + 4}, ${dialogBottomValue + 3}`);
  app.style.setProperty("--dialog-paper-alpha", (0.97 - darkMix * 0.03).toFixed(3));
  app.style.setProperty("--read-shadow-rgb", inkMix > 0.5 ? "0, 0, 0" : "255, 255, 255");
  app.style.setProperty("--read-shadow-alpha", (0.38 - Math.abs(inkMix - 0.5) * 0.24).toFixed(3));
  app.style.setProperty("--read-glow-rgb", inkMix > 0.5 ? "255, 255, 255" : "255, 255, 255");
  app.style.setProperty("--read-glow-alpha", (0.08 + inkMix * 0.12).toFixed(3));
  const ghostDarkMix = smoothStep((progress - 0.22) / 0.5);
  const ghostInkMix = progress < 0.56 ? 0 : smoothStep((progress - 0.56) / 0.14);
  const ghostPaperValue = Math.round(255 - ghostDarkMix * 220);
  const ghostPaperBottomValue = Math.round(244 - ghostDarkMix * 218);
  const ghostInkValue = Math.round(30 + ghostInkMix * 210);
  const ghostMutedAlpha = 0.68 - ghostDarkMix * 0.08;
  app.style.setProperty("--ghost-paper-rgb", `${ghostPaperValue}, ${ghostPaperValue + 2}, ${ghostPaperValue + 1}`);
  app.style.setProperty("--ghost-paper-bottom-rgb", `${ghostPaperBottomValue}, ${ghostPaperBottomValue + 4}, ${ghostPaperBottomValue + 3}`);
  app.style.setProperty("--ghost-paper-alpha", (0.78 - ghostDarkMix * 0.2).toFixed(3));
  app.style.setProperty("--ghost-paper-bottom-alpha", (0.58 - ghostDarkMix * 0.16).toFixed(3));
  app.style.setProperty("--ghost-ink-rgb", `${ghostInkValue}, ${ghostInkValue}, ${ghostInkValue}`);
  app.style.setProperty("--ghost-ink-alpha", ghostMutedAlpha.toFixed(3));
  app.style.setProperty("--ghost-edge-rgb", ghostInkMix > 0.5 ? "225, 236, 232" : "255, 255, 255");
  app.style.setProperty("--ghost-edge-alpha", (0.32 - ghostDarkMix * 0.12).toFixed(3));
  app.style.setProperty("--ghost-glow-rgb", ghostInkMix > 0.5 ? "255, 255, 255" : "255, 255, 255");
  app.style.setProperty("--ghost-glow-alpha", (0.04 + ghostInkMix * 0.08).toFixed(3));
  reader.dataset.era = `${Math.round(progress * 100)}% de descente`;
  activeText.textContent = activeEntry.text;
  positionLabel.textContent = `Marche ${activeIndex + 1} sur ${entries.length}`;
  dateLabel.textContent = formatDate(activeEntry.createdAt);
  floor.classList.toggle("visible", activeIndex === entries.length - 1);
  newerBtn.disabled = activeIndex === 0;
  olderBtn.disabled = activeIndex === entries.length - 1;
  updateSectionMap();
  if (textDialog.open) {
    updateTextDialog();
  }
  lastActiveIndex = activeIndex;
}

function pulseMotion(isRushing) {
  staircaseShell.classList.add("is-moving");
  staircaseShell.classList.toggle("is-rushing", isRushing);
  staircaseShell.classList.toggle("is-long-jump", lastJumpDistance > 6);
  window.clearTimeout(motionTimer);
  window.clearTimeout(rushTimer);
  motionTimer = window.setTimeout(() => {
    staircaseShell.classList.remove("is-moving");
    staircaseShell.classList.remove("is-long-jump");
  }, 980);
  rushTimer = window.setTimeout(() => {
    staircaseShell.classList.remove("is-rushing");
  }, 980);
}

function primeAudio() {
  if (!soundEnabled) {
    return;
  }

  getSoundPlayers().forEach((player) => player.load());
}

function updateSoundButton() {
  soundBtn.setAttribute("aria-pressed", String(soundEnabled));
  soundBtn.setAttribute("aria-label", soundEnabled ? "Désactiver le son" : "Activer le son");
  soundBtn.title = soundEnabled ? "Son actif" : "Son coupé";
}

function setSoundEnabled(enabled) {
  soundEnabled = enabled;
  localStorage.setItem(SOUND_STORAGE_KEY, enabled ? "on" : "off");
  updateSoundButton();

  if (enabled) {
    primeAudio();
  }
}

function getSoundPlayers() {
  if (!soundPlayers.length) {
    soundPlayers = Array.from({ length: 5 }, () => {
      const player = new Audio(SOUND_FILE);
      player.preload = "auto";
      player.volume = 0.48;
      player.dataset.stopTimer = "";
      player.addEventListener(
        "loadedmetadata",
        () => {
          player.currentTime = SOUND_START;
        },
        { once: true }
      );
      return player;
    });
  }

  return soundPlayers;
}

function playStepSound(delta, isRushing, targetIndex = activeIndex) {
  if (!soundEnabled) {
    return;
  }

  const players = getSoundPlayers();
  const player = players[soundPlayerIndex % players.length];
  soundPlayerIndex += 1;
  window.clearTimeout(Number(player.dataset.stopTimer));
  player.pause();
  player.currentTime = SOUND_START;
  const progress = getArchiveProgress(targetIndex);
  const depthVolume = 0.44 + progress * 0.16;
  player.volume = Math.min(0.64, isRushing ? depthVolume + 0.08 : depthVolume);
  player.playbackRate = delta > 0 ? Math.max(0.86, 0.99 - progress * 0.08) : Math.min(1.08, 0.96 + progress * 0.06);
  player.play().catch(() => {
    // The browser can block audio until the first explicit user gesture.
  });
  player.dataset.stopTimer = String(
    window.setTimeout(() => {
      player.pause();
      player.currentTime = SOUND_START;
    }, isRushing ? SOUND_RUSH_DURATION : SOUND_DURATION)
  );
}

function updateMoveStreak(delta) {
  const now = Date.now();
  const repeated = now - lastMoveAt < 620 && delta === lastMoveDirection;
  moveStreak = repeated ? moveStreak + 1 : 0;
  lastMoveAt = now;
  lastMoveDirection = delta;
  return moveStreak >= 2;
}

function move(delta) {
  const next = activeIndex + delta;
  if (next < 0 || next >= entries.length) {
    return;
  }

  const isRushing = updateMoveStreak(delta);
  lastJumpDistance = Math.abs(next - activeIndex);
  updateMotionDuration(lastJumpDistance, isRushing);
  pulseMotion(isRushing);
  playStepSound(delta, isRushing, next);
  activeIndex = next;
  render();
}

async function toggleImmersive() {
  const shouldEnter = !app.classList.contains("immersive");
  app.classList.toggle("immersive", shouldEnter);
  immersiveBtn.setAttribute("aria-label", shouldEnter ? "Quitter le mode immersif" : "Activer le mode immersif");
  immersiveBtn.title = shouldEnter ? "Quitter le mode immersif" : "Mode immersif";

  if (shouldEnter && document.fullscreenEnabled && !document.fullscreenElement) {
    try {
      await document.documentElement.requestFullscreen();
    } catch (error) {
      console.warn("Le plein écran navigateur n'a pas pu être activé.", error);
    }
  }

  if (!shouldEnter && document.fullscreenElement) {
    await document.exitFullscreen();
  }
}

function updateCounter() {
  if (!counter || !textInput) {
    return;
  }

  counter.textContent = `${textInput.value.length}/${textLimit}`;
}

function closeSearch() {
  searchPanel.hidden = true;
  searchInput.value = "";
  searchResults.replaceChildren();
}

function openSearch() {
  searchPanel.hidden = false;
  renderSearchResults();
  searchInput.focus();
}

function getSearchExcerpt(text, query) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!query) {
    return normalized.slice(0, 170);
  }

  const lower = normalized.toLowerCase();
  const hit = lower.indexOf(query.toLowerCase());
  const start = Math.max(0, hit - 58);
  const excerpt = normalized.slice(start, start + 190);
  return `${start > 0 ? "..." : ""}${excerpt}${start + 190 < normalized.length ? "..." : ""}`;
}

function renderSearchResults() {
  const query = searchInput.value.trim();
  if (!entries.length) {
    searchResults.replaceChildren();
    const empty = document.createElement("p");
    empty.className = "search-empty";
    empty.textContent = "L'escalier est vide.";
    searchResults.append(empty);
    return;
  }

  const matches = entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => {
      if (!query) {
        return true;
      }

      return `${entry.title} ${entry.text}`.toLowerCase().includes(query.toLowerCase());
    })
    .slice(0, 12);

  searchResults.replaceChildren();

  if (!matches.length) {
    const empty = document.createElement("p");
    empty.className = "search-empty";
    empty.textContent = "Aucune marche trouvée.";
    searchResults.append(empty);
    return;
  }

  matches.forEach(({ entry, index }) => {
    const button = document.createElement("button");
    const meta = document.createElement("span");
    const title = document.createElement("strong");
    const excerpt = document.createElement("span");

    button.type = "button";
    button.className = "search-result";
    button.setAttribute("role", "listitem");
    meta.textContent = `Marche ${index + 1} · ${formatDate(entry.createdAt)}`;
    title.textContent = getEntryTitle(entry, index);
    excerpt.textContent = getSearchExcerpt(entry.text, query);
    button.append(meta, title, excerpt);
    button.addEventListener("click", () => {
      jumpToIndex(index, { fromSearch: true });
      closeSearch();
    });
    searchResults.append(button);
  });
}

function jumpToIndex(next, options = {}) {
  if (!entries.length) {
    return;
  }

  const clamped = Math.max(0, Math.min(entries.length - 1, next));
  if (clamped === activeIndex) {
    return;
  }

  const delta = clamped > activeIndex ? 1 : -1;
  const jumpDistance = Math.abs(clamped - activeIndex);
  lastActiveIndex = activeIndex;
  activeIndex = clamped;
  lastJumpDistance = jumpDistance;
  updateMotionDuration(jumpDistance, false);
  pulseMotion(jumpDistance > 4 || Boolean(options.fromSearch));
  playStepSound(delta, jumpDistance > 4, clamped);
  render();
}

if (textInput) {
  textInput.addEventListener("input", updateCounter);
}

olderBtn.addEventListener("click", () => move(1));
newerBtn.addEventListener("click", () => move(-1));
searchBtn.addEventListener("click", () => {
  if (searchPanel.hidden) {
    openSearch();
  } else {
    closeSearch();
  }
});
searchCloseBtn.addEventListener("click", closeSearch);
searchInput.addEventListener("input", renderSearchResults);
soundBtn.addEventListener("click", () => setSoundEnabled(!soundEnabled));
immersiveBtn.addEventListener("click", toggleImmersive);
dialogCloseBtn.addEventListener("click", () => textDialog.close());
dialogReaderBtn.addEventListener("click", () => {
  const shouldRead = !textDialog.classList.contains("reading-mode");
  textDialog.classList.toggle("reading-mode", shouldRead);
  dialogReaderBtn.setAttribute("aria-pressed", String(shouldRead));
  dialogReaderBtn.textContent = shouldRead ? "Quitter lecture" : "Mode lecture";
  dialogText.scrollTop = 0;
});
dialogNewerBtn.addEventListener("click", () => moveFromDialog(-1));
dialogOlderBtn.addEventListener("click", () => moveFromDialog(1));
textDialog.addEventListener("click", (event) => {
  if (event.target === textDialog) {
    textDialog.close();
  }
});

sectionMap.addEventListener("click", (event) => {
  const rect = sectionMap.getBoundingClientRect();
  const progress = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
  const next = Math.round(progress * (entries.length - 1));
  jumpToIndex(next);
});

sectionMap.addEventListener("mousemove", (event) => {
  const rect = sectionMap.getBoundingClientRect();
  const progress = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
  const index = Math.round(progress * (entries.length - 1));
  sectionMapTip.hidden = false;
  sectionMapTip.textContent = `Marche ${index + 1}`;
  sectionMapTip.style.top = `${event.clientY - rect.top}px`;
});

sectionMap.addEventListener("mouseleave", () => {
  sectionMapTip.hidden = true;
});

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && app.classList.contains("immersive")) {
    app.classList.remove("immersive");
    immersiveBtn.setAttribute("aria-label", "Activer le mode immersif");
    immersiveBtn.title = "Mode immersif";
  }
});

window.addEventListener("keydown", (event) => {
  primeAudio();

  if (textDialog.open) {
    return;
  }

  if (!searchPanel.hidden && event.key === "Escape") {
    closeSearch();
    return;
  }

  if (event.target === textInput || event.target === searchInput) {
    return;
  }

  if (event.key === "ArrowDown" || event.key === "ArrowRight") {
    event.preventDefault();
    move(1);
  }

  if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
    event.preventDefault();
    move(-1);
  }
});

window.addEventListener("pointerdown", primeAudio, { once: true, passive: true });

window.addEventListener(
  "wheel",
  (event) => {
    if (textDialog.open) {
      return;
    }

    if (Math.abs(event.deltaY) < 18) {
      return;
    }

    move(event.deltaY > 0 ? 1 : -1);
  },
  { passive: true }
);

window.addEventListener("resize", render);

async function init() {
  updateSoundButton();
  updateCounter();
  render();
}

init();
