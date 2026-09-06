// Fallback tiles used only the first time (before you customize via the "+" tile).
const DEFAULT_LINKS = [
  { label: "github", glyph: "gh", url: "https://github.com" },
  { label: "gmail", glyph: "@", url: "https://mail.google.com" },
  { label: "drive", glyph: "dv", url: "https://drive.google.com" },
  { label: "trading", glyph: "tv", url: "https://www.tradingview.com" },
  { label: "console", glyph: "pc", url: "https://play.google.com/console" },
];

const SEARCH_URL = "https://search.brave.com/search?q=";

function pad(n) { return String(n).padStart(2, "0"); }

function tickClock() {
  const now = new Date();
  document.getElementById("clock").textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  document.getElementById("date").textContent = now
    .toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
    .toLowerCase();
}
tickClock();
setInterval(tickClock, 1000 * 10);

// ---- quick links (editable on the page, persisted in localStorage) ----

function getLinks() {
  try {
    const raw = localStorage.getItem("links");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_LINKS.slice();
}

function saveLinks(links) {
  localStorage.setItem("links", JSON.stringify(links));
}

function renderLinks() {
  const el = document.getElementById("links");
  el.innerHTML = "";
  const links = getLinks();

  links.forEach((link, i) => {
    const a = document.createElement("a");
    a.className = "link-tile";
    a.href = link.url;
    a.innerHTML = `
      <span class="glyph">${link.glyph}</span>
      <span>${link.label}</span>
      <span class="remove" title="remove">&times;</span>
    `;
    a.querySelector(".remove").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const links = getLinks();
      links.splice(i, 1);
      saveLinks(links);
      renderLinks();
    });
    el.appendChild(a);
  });

  const add = document.createElement("button");
  add.className = "link-tile add-tile";
  add.innerHTML = `<span class="glyph">+</span><span>add</span>`;
  add.addEventListener("click", () => {
    const label = prompt("label (e.g. \"motospeedo\")");
    if (!label) return;
    let url = prompt("url (e.g. \"https://example.com\")");
    if (!url) return;
    if (!/^https?:\/\//.test(url)) url = "https://" + url;
    const glyph = label.slice(0, 2).toLowerCase();
    const links = getLinks();
    links.push({ label, glyph, url });
    saveLinks(links);
    renderLinks();
  });
  el.appendChild(add);
}
renderLinks();

document.getElementById("searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const q = document.getElementById("searchInput").value.trim();
  if (!q) return;
  window.location.href = SEARCH_URL + encodeURIComponent(q);
});

// ---- notes panel (persisted in localStorage) ----

(function notes() {
  const toggle = document.getElementById("notesToggle");
  const panel = document.getElementById("notesPanel");
  const textarea = document.getElementById("notesText");

  textarea.value = localStorage.getItem("notes") || "";
  textarea.addEventListener("input", () => {
    localStorage.setItem("notes", textarea.value);
  });

  toggle.addEventListener("click", () => {
    panel.classList.toggle("open");
    if (panel.classList.contains("open")) textarea.focus();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") panel.classList.remove("open");
  });
})();

// Particle-constellation background: bright twinkling stars, paused off-screen.
(function constellation() {
  const canvas = document.getElementById("net");
  const ctx = canvas.getContext("2d");
  let w, h, dpr, particles, raf, t = 0;
  const COUNT = 70;
  const LINK_DIST = 130;
  const ACCENT = "23, 147, 209";
  const STAR = "236, 238, 241";

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = window.innerWidth * dpr;
    h = canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
  }

  function init() {
    resize();
    particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.15 * dpr,
      vy: (Math.random() - 0.5) * 0.15 * dpr,
      r: (1.1 + Math.random() * 1.6) * dpr,
      phase: Math.random() * Math.PI * 2,
      speed: 0.015 + Math.random() * 0.025,
    }));
  }

  function step() {
    t += 1;
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      const twinkle = 0.5 + 0.5 * Math.sin(t * p.speed + p.phase);
      const alpha = 0.35 + 0.65 * twinkle;
      const glow = p.r * (1.2 + twinkle * 0.8);

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glow);
      grad.addColorStop(0, `rgba(${STAR}, ${alpha * 0.9})`);
      grad.addColorStop(1, `rgba(${STAR}, 0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, glow, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${STAR}, ${alpha})`;
      ctx.fill();
    }
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y) / dpr;
        if (dist < LINK_DIST) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${ACCENT}, ${0.45 * (1 - dist / LINK_DIST)})`;
          ctx.lineWidth = 1.3 * dpr;
          ctx.stroke();
        }
      }
    }
    raf = requestAnimationFrame(step);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(step);
    }
  });
  window.addEventListener("resize", resize);

  init();
  step();
})();
