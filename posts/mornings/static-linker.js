(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const root = $("resolver");
  if (!root) return;

  const traces = {
    good: [
      { unresolved: [], extracted: [], text: "The linker starts with no unresolved application symbols." },
      { unresolved: ["double_it", "printf"], extracted: [], text: "Read main.o: it defines main, but creates unresolved references to double_it and printf." },
      { unresolved: ["printf"], extracted: ["math.o"], text: "Search libtiny.a: its index points from double_it to math.o. Extract math.o and resolve double_it; unused.o stays out." },
      { unresolved: [], extracted: ["math.o"], text: "Compiler-supplied system libraries resolve printf. Nothing remains unresolved: the link succeeds." }
    ],
    bad: [
      { unresolved: [], extracted: [], text: "The linker starts with no unresolved application symbols." },
      { unresolved: [], extracted: [], text: "Search libtiny.a first: no current unresolved symbol needs either member, so the linker extracts nothing." },
      { unresolved: ["double_it", "printf"], extracted: [], text: "Read main.o afterward: double_it and printf become unresolved, but the archive has already been searched." },
      { unresolved: ["double_it"], extracted: [], text: "System libraries resolve printf. double_it remains unresolved: the link fails." }
    ]
  };

  let order = "good";
  let step = 0;

  function chips(target, values, bad) {
    target.replaceChildren();
    if (!values.length) {
      const empty = document.createElement("span");
      empty.className = "meta";
      empty.textContent = "none";
      target.appendChild(empty);
      return;
    }
    values.forEach(value => {
      const chip = document.createElement("span");
      chip.className = `chip${bad ? " bad" : ""}`;
      chip.textContent = value;
      target.appendChild(chip);
    });
  }

  function render() {
    const current = traces[order][step];
    $("step-label").textContent = `step ${step} of 3`;
    chips($("unresolved"), current.unresolved, true);
    chips($("extracted"), current.extracted, false);
    $("link-state").textContent = current.text;
    $("next").disabled = step === 3;
    $("good-order").classList.toggle("selected", order === "good");
    $("bad-order").classList.toggle("selected", order === "bad");
  }

  function choose(nextOrder) {
    order = nextOrder;
    step = 0;
    render();
  }

  $("good-order").addEventListener("click", () => choose("good"));
  $("bad-order").addEventListener("click", () => choose("bad"));
  $("reset").addEventListener("click", () => { step = 0; render(); });
  $("next").addEventListener("click", () => { step = Math.min(step + 1, 3); render(); });
  root.hidden = false;
  render();

  const theme = $("theme");
  const orderings = ["auto", "light", "dark"];
  theme.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme || "auto";
    const next = orderings[(orderings.indexOf(current) + 1) % orderings.length];
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
