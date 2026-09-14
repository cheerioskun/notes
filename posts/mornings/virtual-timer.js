(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const root = $("quantum");
  if (!root) return;

  const states = [
    { wall: 0, user: 0, left: 100, layer: "kernel", title: "Arm the process timer", body: "setitimer enters the kernel. ITIMER_VIRTUAL records an initial user-CPU deadline 100 ms ahead and a 100 ms reload interval." },
    { wall: 60, user: 60, left: 40, layer: "app", title: "User thread A computes for 60 ms", body: "The CPU executes A in user mode. Wall time and process user CPU time both advance by 60 ms; 40 ms remains in the virtual quantum." },
    { wall: 360, user: 60, left: 40, layer: "off", title: "A blocks and the process sleeps for 300 ms", body: "Wall time advances to 360 ms. The process consumes no CPU, so its virtual clock and remaining timer value stay at 60 ms and 40 ms." },
    { wall: 400, user: 100, left: 0, layer: "kernel", title: "A spends the last 40 ms; the kernel notices expiry", body: "Accumulated user CPU reaches the deadline. Kernel accounting detects the expiration, generates SIGVTALRM, and reloads the interval." },
    { wall: 400, user: 100, left: 100, layer: "kernel", title: "The kernel prepares delivery", body: "An eligible kernel thread is selected. The kernel puts its interrupted program counter, registers, and signal mask into a user-stack signal frame, then points the return context at the handler." },
    { wall: 400, user: 100, left: 100, layer: "handler", title: "Execution resumes at the signal handler", body: "Returning to user mode begins at the handler, not at A's interrupted instruction. The saved signal frame still remembers where A was." },
    { wall: 400, user: 100, left: 100, layer: "scheduler", title: "The user-level scheduler chooses B", body: "The runtime preserves A's context and run-queue state, selects B, and restores B. The kernel still sees only the same underlying kernel thread." },
    { wall: 500, user: 200, left: 0, layer: "app", title: "B consumes the reloaded quantum", body: "After another 100 ms of user execution, the interval expires again. Periodicity comes from reloading it_interval after each expiration." }
  ];

  let step = 0;
  const layerIds = ["app", "off", "kernel", "handler", "scheduler"];

  function render() {
    const s = states[step];
    $("wall-time").textContent = s.wall + " ms";
    $("user-time").textContent = s.user + " ms";
    $("timer-left").textContent = s.left === 0 ? "expired" : s.left + " ms";
    $("wall-bar").style.width = Math.min(s.wall / 500 * 100, 100) + "%";
    $("user-bar").style.width = Math.min(s.user / 200 * 100, 100) + "%";
    $("timer-bar").style.width = s.left + "%";
    $("step-title").textContent = s.title;
    $("step-body").textContent = s.body;
    $("step-label").textContent = "step " + step + " of " + (states.length - 1);
    layerIds.forEach(id => $("layer-" + id).classList.toggle("active", id === s.layer));
    $("back").disabled = step === 0;
    $("next").disabled = step === states.length - 1;
  }

  $("reset").addEventListener("click", () => { step = 0; render(); });
  $("back").addEventListener("click", () => { step = Math.max(0, step - 1); render(); });
  $("next").addEventListener("click", () => { step = Math.min(states.length - 1, step + 1); render(); });
  root.hidden = false;
  render();

  const theme = $("theme");
  const themes = ["auto", "light", "dark"];
  theme.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme || "auto";
    const next = themes[(themes.indexOf(current) + 1) % themes.length];
    document.documentElement.dataset.theme = next;
    theme.textContent = "theme: " + next;
  });

  const progress = $("progress");
  function updateProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? Math.min(window.scrollY / max * 100, 100) : 100) + "%";
  }
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();
})();
