(() => {
  'use strict';
  const slides = Array.from(document.querySelectorAll('.slide'));
  const stage = document.getElementById('stage');
  const overview = document.getElementById('overview');
  const help = document.getElementById('help');
  const modeButton = document.getElementById('mode-button');
  const previous = document.getElementById('previous');
  const next = document.getElementById('next');
  const counter = document.getElementById('current-number');
  const progress = document.getElementById('progress');
  const overviewList = document.getElementById('overview-list');
  const blackout = document.getElementById('blackout');
  const status = document.getElementById('status');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 760px) and (orientation: portrait)');
  let index = 0;
  let reading = new URLSearchParams(location.search).get('view') === 'read' || mobile.matches;
  let observer;
  let scrollFrame = 0;
  const pad = n => String(n).padStart(2, '0');
  const parseHash = () => {
    const match = location.hash.match(/^#(?:slide-)?(\d+)$/);
    return match ? Math.max(0, Math.min(slides.length - 1, Number(match[1]) - 1)) : 0;
  };
  function writeHash() {
    history.replaceState(null, '', `${location.pathname}${location.search}#slide-${index + 1}`);
  }
  function updateControls() {
    counter.textContent = pad(index + 1);
    previous.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    document.querySelectorAll('[data-go]').forEach(button => {
      const target = Number(button.dataset.go);
      button.toggleAttribute('aria-current', target === index);
      if (target === index) button.setAttribute('aria-current', 'step');
      button.classList.toggle('visited', target < index);
    });
    status.textContent = `Slide ${index + 1} of ${slides.length}: ${slides[index].dataset.title}`;
  }
  function go(target, options = {}) {
    const old = slides[index];
    index = Math.max(0, Math.min(slides.length - 1, target));
    const current = slides[index];
    if (reading) {
      if (options.scroll !== false) current.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'start' });
    } else {
      const samePair = old !== current && old.dataset.pair && old.dataset.pair === current.dataset.pair;
      slides.forEach(slide => {
        slide.hidden = slide !== current;
        slide.classList.toggle('active', slide === current);
        slide.setAttribute('aria-roledescription', 'slide');
      });
      current.querySelectorAll('.reveal').forEach(element => {
        element.classList.toggle('still', Boolean(samePair && element.dataset.persist));
      });
    }
    if (options.hash !== false) writeHash();
    updateControls();
  }
  function watchReading() {
    if (observer) observer.disconnect();
    if (!reading) return;
    observer = new IntersectionObserver(() => {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => {
        if (!reading) return;
        const anchor = window.innerHeight * .36;
        let closest = 0, distance = Infinity;
        slides.forEach((slide, n) => {
          const box = slide.getBoundingClientRect();
          const d = box.top <= anchor && box.bottom > anchor ? 0 : Math.min(Math.abs(box.top - anchor), Math.abs(box.bottom - anchor));
          if (d < distance) { distance = d; closest = n; }
        });
        if (index !== closest) { index = closest; writeHash(); updateControls(); }
      });
    }, { threshold: [0, .2, .5, .8, 1] });
    slides.forEach(slide => observer.observe(slide));
  }
  function setMode(value, shouldScroll = true) {
    reading = value;
    document.body.dataset.mode = reading ? 'read' : 'deck';
    modeButton.textContent = reading ? 'Present' : 'Read';
    modeButton.setAttribute('aria-label', reading ? 'Switch to presentation view' : 'Switch to reading view');
    slides.forEach(slide => { slide.hidden = !reading && slide !== slides[index]; });
    go(index, { scroll: false });
    watchReading();
    if (reading && shouldScroll) requestAnimationFrame(() => slides[index].scrollIntoView({ block: 'start' }));
    if (!reading) window.scrollTo(0, 0);
  }
  function showDialog(dialog) {
    if (dialog.open) return;
    dialog.showModal();
    if (dialog === overview) overviewList.querySelector(`[data-go="${index}"]`).focus();
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    } catch { status.textContent = 'Fullscreen is unavailable in this browser. Presentation controls remain available.'; }
  }
  slides.forEach((slide, n) => {
    slide.dataset.slideNumber = `${pad(n + 1)} / ${slides.length}`;
    const dot = document.createElement('button');
    dot.dataset.go = n;
    dot.setAttribute('aria-label', `Slide ${n + 1}: ${slide.dataset.title}`);
    dot.title = `${n + 1}. ${slide.dataset.title}`;
    progress.append(dot);
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.dataset.go = n;
    const number = document.createElement('span');
    number.className = 'overview-number';
    number.textContent = pad(n + 1);
    const label = document.createElement('span');
    label.textContent = slide.dataset.title;
    const excerpt = document.createElement('span');
    excerpt.className = 'overview-excerpt';
    const text = slide.querySelector('.slide-content').textContent.replace(/\s+/g, ' ').trim();
    excerpt.textContent = text.length > 80 ? `${text.slice(0, 80)}…` : text;
    label.append(excerpt);
    button.append(number, label);
    item.append(button);
    overviewList.append(item);
  });
  document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => {
    if (overview.open) overview.close();
    go(Number(button.dataset.go));
  }));
  previous.addEventListener('click', () => go(index - 1));
  next.addEventListener('click', () => go(index + 1));
  modeButton.addEventListener('click', () => setMode(!reading));
  document.getElementById('fullscreen-button').addEventListener('click', fullscreen);
  document.addEventListener('fullscreenchange', () => {
    document.getElementById('fullscreen-button').textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen';
  });
  document.getElementById('overview-button').addEventListener('click', () => showDialog(overview));
  document.getElementById('slide-counter').addEventListener('click', () => showDialog(overview));
  document.getElementById('help-button').addEventListener('click', () => showDialog(help));
  document.querySelectorAll('.close-dialog').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  [overview, help].forEach(dialog => dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  }));
  blackout.addEventListener('click', () => { blackout.hidden = true; });
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) || event.target.isContentEditable) return;
    if (!blackout.hidden) { event.preventDefault(); blackout.hidden = true; return; }
    if (overview.open || help.open) return;
    const key = event.key.toLowerCase();
    if (key === '?' || key === 'h') { event.preventDefault(); showDialog(help); return; }
    if (key === 'o') { event.preventDefault(); showDialog(overview); return; }
    if (key === 'r') { event.preventDefault(); setMode(!reading); return; }
    if (key === 'f') { event.preventDefault(); fullscreen(); return; }
    if (key === 'b' && !reading) { event.preventDefault(); blackout.hidden = false; blackout.focus(); return; }
    if (reading) return;
    if ((key === ' ' || key === 'enter') && /^(BUTTON|A)$/.test(event.target.tagName)) return;
    if (['arrowright','arrowdown','pagedown',' '].includes(key)) { event.preventDefault(); go(index + (event.shiftKey && key === ' ' ? -1 : 1)); }
    if (['arrowleft','arrowup','pageup'].includes(key)) { event.preventDefault(); go(index - 1); }
    if (key === 'home') { event.preventDefault(); go(0); }
    if (key === 'end') { event.preventDefault(); go(slides.length - 1); }
  });
  let touch;
  stage.addEventListener('touchstart', event => {
    if (reading || event.touches.length !== 1) return;
    touch = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });
  stage.addEventListener('touchend', event => {
    if (!touch || reading) return;
    const dx = event.changedTouches[0].clientX - touch.x;
    const dy = event.changedTouches[0].clientY - touch.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5 && !window.getSelection().toString()) go(index + (dx < 0 ? 1 : -1));
    touch = null;
  }, { passive: true });
  window.addEventListener('hashchange', () => go(parseHash(), { hash: false }));
  index = parseHash();
  setMode(reading, Boolean(location.hash));
})();
