(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const root = $("explorer");
  if (!root) return;

  function model(load, pathBShare, threshold) {
    const bOffered = load * pathBShare;
    const aOffered = load * (1 - pathBShare);
    const aThroughput = Math.min(aOffered, 1);
    const bThroughput = Math.min(bOffered, 1);
    const throughput = aThroughput + bThroughput;
    const excess = Math.max(aOffered - 1, 0) + Math.max(bOffered - 1, 0);
    const nextEfficiency = (aOffered < 1 - 1e-9 ? 1 - pathBShare : 0) + (bOffered < 1 - 1e-9 ? pathBShare : 0);
    const decision = nextEfficiency > threshold ? "grow" : "shrink";
    return { aOffered, bOffered, aThroughput, bThroughput, throughput, excess, nextEfficiency, decision };
  }

  const load = $("load");
  const share = $("share");
  const threshold = $("threshold");
  const svg = $("curve");
  const NS = "http://www.w3.org/2000/svg";
  const W = 560, H = 330, left = 56, right = 18, top = 20, bottom = 48;
  const xMax = 6, yMax = 2.2;
  const sx = x => left + x / xMax * (W - left - right);
  const sy = y => H - bottom - y / yMax * (H - top - bottom);

  function node(name, attrs = {}, text = "") {
    const el = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (text) el.textContent = text;
    return el;
  }

  function pathFor(fn) {
    let d = "";
    for (let i = 0; i <= 120; i += 1) {
      const x = xMax * i / 120;
      d += `${i ? "L" : "M"}${sx(x).toFixed(2)},${sy(fn(x)).toFixed(2)} `;
    }
    return d;
  }

  function draw(pathBShare, selectedLoad) {
    svg.replaceChildren();
    for (let x = 0; x <= 6; x += 1) {
      svg.appendChild(node("line", { x1: sx(x), y1: sy(0), x2: sx(x), y2: sy(2), class: "grid" }));
      svg.appendChild(node("text", { x: sx(x), y: H - 22, "text-anchor": "middle" }, String(x)));
    }
    for (let y = 0; y <= 2; y += .5) {
      svg.appendChild(node("line", { x1: sx(0), y1: sy(y), x2: sx(6), y2: sy(y), class: "grid" }));
      svg.appendChild(node("text", { x: left - 9, y: sy(y) + 4, "text-anchor": "end" }, y.toFixed(1)));
    }
    svg.appendChild(node("text", { x: (left + W - right) / 2, y: H - 5, "text-anchor": "middle" }, "admitted load (kRPS)"));
    const ylabel = node("text", { x: 15, y: (top + H - bottom) / 2, transform: `rotate(-90 15 ${(top + H - bottom) / 2})`, "text-anchor": "middle" }, "useful throughput (kRPS)");
    svg.appendChild(ylabel);
    svg.appendChild(node("path", { d: pathFor(x => Math.min(x, yMax)), class: "offered" }));
    svg.appendChild(node("path", { d: pathFor(x => Math.min(x * (1 - pathBShare), 1)), class: "path1" }));
    svg.appendChild(node("path", { d: pathFor(x => Math.min(x * pathBShare, 1)), class: "path2" }));
    svg.appendChild(node("path", { d: pathFor(x => model(x, pathBShare, 0).throughput), class: "total" }));
    const chosen = model(selectedLoad, pathBShare, 0);
    svg.appendChild(node("line", { x1: sx(selectedLoad), y1: sy(0), x2: sx(selectedLoad), y2: sy(chosen.throughput), class: "cursor" }));
    svg.appendChild(node("circle", { cx: sx(selectedLoad), cy: sy(chosen.throughput), r: 5, class: "dot" }));
  }

  function render() {
    const admitted = Number(load.value);
    const pathBShare = Number(share.value) / 100;
    const target = Number(threshold.value) / 100;
    const m = model(admitted, pathBShare, target);
    $("load-value").textContent = admitted.toFixed(2);
    $("share-value").textContent = String(Math.round(pathBShare * 100));
    $("threshold-value").textContent = String(Math.round(target * 100));
    $("a-rate").textContent = `${m.aThroughput.toFixed(2)} / 1.00 kRPS`;
    $("b-rate").textContent = `${m.bThroughput.toFixed(2)} / 1.00 kRPS`;
    $("a-fill").style.width = `${m.aThroughput * 100}%`;
    $("b-fill").style.width = `${m.bThroughput * 100}%`;
    $("a-overflow").textContent = m.aOffered > 1 ? `${(m.aOffered - 1).toFixed(2)} kRPS excess` : `${(1 - m.aThroughput).toFixed(2)} kRPS spare`;
    $("b-overflow").textContent = m.bOffered > 1 ? `${(m.bOffered - 1).toFixed(2)} kRPS excess` : `${(1 - m.bThroughput).toFixed(2)} kRPS spare`;
    const dropFraction = admitted > 0 ? m.excess / admitted : 0;
    $("state").textContent = `Useful throughput: ${m.throughput.toFixed(2)} kRPS. Excess directed to saturated paths: ${m.excess.toFixed(2)} kRPS (${Math.round(dropFraction * 100)}% of admitted work). The next small increase would convert about ${Math.round(m.nextEfficiency * 100)}% of extra input into extra throughput; against a ${Math.round(target * 100)}% efficiency target, the simplified decision is: ${m.decision} the credit pool.`;
    draw(pathBShare, admitted);
  }

  [load, share, threshold].forEach(input => input.addEventListener("input", render));
  document.querySelectorAll("[data-load]").forEach(button => button.addEventListener("click", () => {
    load.value = button.dataset.load;
    render();
  }));
  root.hidden = false;
  render();
  window.protegoToyModel = model;

  const theme = $("theme");
  const order = ["auto", "light", "dark"];
  theme.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme || "auto";
    const next = order[(order.indexOf(current) + 1) % order.length];
    document.documentElement.dataset.theme = next;
    theme.textContent = `theme: ${next}`;
  });

  const progress = $("progress");
  function updateProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${max > 0 ? Math.min(window.scrollY / max * 100, 100) : 100}%`;
  }
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();
})();
