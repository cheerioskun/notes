(() => {
  "use strict";

  const root = document.getElementById("credit-explorer");
  if (!root) return;

  const activeInput = document.getElementById("active");
  const demandInput = document.getElementById("demand");
  const extraInput = document.getElementById("extra");
  const activeValue = document.getElementById("active-value");
  const demandValue = document.getElementById("demand-value");
  const extraValue = document.getElementById("extra-value");
  const clients = document.getElementById("clients");
  const lanes = document.getElementById("lanes");
  const queue = document.getElementById("queue");
  const state = document.getElementById("credit-state");
  const capacity = 4;
  const clientNames = ["A", "B", "C", "D"];

  function model(activeCount, demandPerActive, extraPerClient) {
    const creditsPerClient = 1 + extraPerClient;
    const exercisedPerActive = Math.min(creditsPerClient, demandPerActive);
    const arrivals = activeCount * exercisedPerActive;
    const served = Math.min(arrivals, capacity);
    const queued = Math.max(arrivals - capacity, 0);
    const unused = (4 - activeCount) * creditsPerClient +
      activeCount * Math.max(creditsPerClient - demandPerActive, 0);
    return { creditsPerClient, exercisedPerActive, arrivals, served, queued, unused };
  }

  function render() {
    const activeCount = Number(activeInput.value);
    const demandPerActive = Number(demandInput.value);
    const extraPerClient = Number(extraInput.value);
    const result = model(activeCount, demandPerActive, extraPerClient);

    activeValue.textContent = String(activeCount);
    demandValue.textContent = String(demandPerActive);
    extraValue.textContent = String(extraPerClient);
    clients.replaceChildren();

    clientNames.forEach((name, index) => {
      const isActive = index < activeCount;
      const used = isActive ? result.exercisedPerActive : 0;
      const card = document.createElement("div");
      card.className = "client";
      const heading = document.createElement("strong");
      heading.textContent = `client ${name}: ${isActive ? demandPerActive : 0} waiting`;
      const tokens = document.createElement("div");
      tokens.className = "tokens";
      tokens.setAttribute("aria-label", `${used} exercised and ${result.creditsPerClient - used} unused credits`);
      for (let i = 0; i < result.creditsPerClient; i += 1) {
        const token = document.createElement("i");
        token.className = `token${i < used ? "" : " unused"}`;
        token.setAttribute("aria-hidden", "true");
        tokens.appendChild(token);
      }
      card.append(heading, tokens);
      clients.appendChild(card);
    });

    lanes.replaceChildren();
    for (let i = 0; i < capacity; i += 1) {
      const slot = document.createElement("div");
      slot.className = `slot${i < result.served ? " busy" : ""}`;
      slot.textContent = i < result.served ? `serve ${i + 1}` : "idle";
      lanes.appendChild(slot);
    }

    queue.replaceChildren();
    for (let i = 0; i < result.queued; i += 1) {
      const item = document.createElement("span");
      item.className = "queued";
      item.textContent = `queued ${i + 1}`;
      queue.appendChild(item);
    }
    if (result.queued === 0) {
      const none = document.createElement("span");
      none.className = "meta";
      none.textContent = "no server queue";
      queue.appendChild(none);
    }

    const utilization = Math.round((result.served / capacity) * 100);
    const conclusion = result.queued > 0
      ? `${result.queued} request${result.queued === 1 ? "" : "s"} spill into the server queue: speculation has become incast.`
      : result.served < capacity
        ? `${capacity - result.served} service slot${capacity - result.served === 1 ? " is" : "s are"} idle: safe credits are stranded or insufficient.`
        : "The server is full without a queue in this round—but another demand pattern can change that.";
    state.textContent = `${4 * result.creditsPerClient} credits issued; ${result.arrivals} exercised; ${result.unused} unused. Server utilization is ${utilization}%. ${conclusion}`;
  }

  [activeInput, demandInput, extraInput].forEach(input => input.addEventListener("input", render));
  root.hidden = false;
  render();

  window.breakwaterToyModel = model;
})();
