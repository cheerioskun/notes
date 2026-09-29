(() => {
  'use strict';
  const body = document.body;
  const slides = [...document.querySelectorAll('.slide')];
  const byId = id => document.getElementById(id);
  const dialogs = [...document.querySelectorAll('dialog')];
  const maxBuild = slide => Math.max(0, ...[...slide.querySelectorAll('[data-build]')].map(el => Number(el.dataset.build)));
  let index = 0;
  let build = 0;
  let reading = true;
  let touchStart = null;
  let observer = null;
  const pad = n => String(n).padStart(2, '0');

  function parseHash() {
    const match = location.hash.match(/^#slide-(\d+)(?:-(\d+))?$/);
    if (match) {
      index = Math.min(slides.length - 1, Math.max(0, Number(match[1]) - 1));
      build = Math.min(maxBuild(slides[index]), Math.max(0, Number(match[2] || 0)));
    }
  }
  function setHash() {
    history.replaceState(null, '', `#slide-${index + 1}${build ? `-${build}` : ''}`);
  }
  function updateControls() {
    byId('slide-number').textContent = pad(index + 1);
    const total = maxBuild(slides[index]);
    byId('build-status').textContent = !reading && total ? `${slides[index].dataset.title} · ${build}/${total}` : slides[index].dataset.title;
    byId('previous').disabled = index === 0 && (reading || build === 0);
    byId('next').disabled = index === slides.length - 1 && (reading || build === total);
    byId('mode-button').textContent = reading ? 'Present' : 'Read';
    byId('status').textContent = `Slide ${index + 1} of ${slides.length}: ${slides[index].dataset.title}${!reading && total ? `, reveal ${build} of ${total}` : ''}`;
    [...byId('overview-list').querySelectorAll('button')].forEach((button, n) => {
      if (n === index) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
  }
  function render() {
    slides.forEach((slide, n) => {
      slide.hidden = !reading && n !== index;
      slide.querySelectorAll('[data-build]').forEach(el => {
        const visible = reading || Number(el.dataset.build) <= (n === index ? build : 0);
        el.classList.toggle('revealed', visible);
        if (visible) el.removeAttribute('aria-hidden');
        else el.setAttribute('aria-hidden', 'true');
      });
    });
    updateControls();
    setHash();
  }
  function goTo(n, reveal = 0) {
    index = Math.min(slides.length - 1, Math.max(0, n));
    build = Math.min(maxBuild(slides[index]), Math.max(0, reveal));
    render();
    if (reading) slides[index].scrollIntoView({block:'start'});
  }
  function next(skip = false) {
    if (!reading && !skip && build < maxBuild(slides[index])) goTo(index, build + 1);
    else if (index < slides.length - 1) goTo(index + 1);
  }
  function previous(skip = false) {
    if (!reading && !skip && build > 0) goTo(index, build - 1);
    else if (index > 0) goTo(index - 1, reading || skip ? 0 : maxBuild(slides[index - 1]));
  }
  function setMode(value) {
    reading = value;
    body.dataset.mode = reading ? 'read' : 'deck';
    if (observer) observer.disconnect();
    render();
    if (reading) {
      slides[index].scrollIntoView({block:'start',behavior:'instant'});
      observer = new IntersectionObserver(entries => {
        const candidates = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio);
        if (candidates.length) {
          index = slides.indexOf(candidates[0].target);
          build = 0;
          updateControls();
        }
      }, {rootMargin:'-58px 0px -25% 0px',threshold:[.1,.3,.5,.7]});
      slides.forEach(slide => observer.observe(slide));
    }
  }
  function openDialog(id) {
    dialogs.forEach(dialog => { if (dialog.open) dialog.close(); });
    byId(id).showModal();
  }
  function showNotes() {
    const content = byId('notes-content');
    content.replaceChildren();
    const heading = document.createElement('p');
    heading.className = 'note-slide';
    heading.textContent = `${pad(index + 1)} · ${slides[index].dataset.title}`;
    content.append(heading, slides[index].querySelector('template.presenter-note').content.cloneNode(true));
    openDialog('notes');
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else {
        if (reading) setMode(false);
        await document.documentElement.requestFullscreen();
      }
    } catch {
      byId('status').textContent = 'Fullscreen is unavailable here. The presentation still works in this window.';
    }
  }
  slides.forEach((slide,n) => {
    slide.dataset.number = pad(n + 1);
    const li = document.createElement('li');
    const button = document.createElement('button');
    const number = document.createElement('span');
    number.textContent = pad(n + 1);
    button.append(number, document.createTextNode(slide.dataset.title));
    button.addEventListener('click', () => { byId('overview').close(); goTo(n); });
    li.append(button);
    byId('overview-list').append(li);
  });
  byId('previous').addEventListener('click', () => previous());
  byId('next').addEventListener('click', () => next());
  byId('overview-button').addEventListener('click', () => openDialog('overview'));
  byId('counter').addEventListener('click', () => openDialog('overview'));
  byId('notes-button').addEventListener('click', showNotes);
  byId('mode-button').addEventListener('click', () => setMode(!reading));
  byId('fullscreen-button').addEventListener('click', fullscreen);
  byId('help-button').addEventListener('click', () => openDialog('help'));
  byId('print-button').addEventListener('click', () => { byId('help').close(); window.print(); });
  byId('blackout').addEventListener('click', () => { byId('blackout').hidden = true; });
  dialogs.forEach(dialog => {
    dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  });
  document.addEventListener('keydown', event => {
    if (!byId('blackout').hidden) { if (event.key === 'b' || event.key === 'B' || event.key === 'Escape') byId('blackout').hidden = true; return; }
    if (dialogs.some(dialog => dialog.open)) return;
    if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input,textarea,select,[contenteditable]')) return;
    const key = event.key.toLowerCase();
    if (key === ' ' && event.target.closest('button,a')) return;
    if (key === 'arrowright' || key === 'pagedown' || (key === ' ' && !reading)) { event.preventDefault(); next(event.shiftKey); }
    else if (key === 'arrowleft' || key === 'pageup') { event.preventDefault(); previous(event.shiftKey); }
    else if (key === 'home') { event.preventDefault(); goTo(0); }
    else if (key === 'end') { event.preventDefault(); goTo(slides.length - 1); }
    else if (key === 'o') openDialog('overview');
    else if (key === 'n') showNotes();
    else if (key === 'r') setMode(!reading);
    else if (key === 'f') fullscreen();
    else if (key === 'b') byId('blackout').hidden = false;
    else if (key === '?') openDialog('help');
  });
  byId('stage').addEventListener('touchstart', event => { if (!reading && event.touches.length === 1) touchStart = {x:event.touches[0].clientX,y:event.touches[0].clientY}; }, {passive:true});
  byId('stage').addEventListener('touchend', event => {
    if (!touchStart || reading) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) dx < 0 ? next() : previous();
  }, {passive:true});
  window.addEventListener('hashchange', () => { parseHash(); render(); if (reading) slides[index].scrollIntoView({block:'start'}); });
  parseHash();
  const mode = new URLSearchParams(location.search).get('mode');
  setMode(mode === 'read' || (mode !== 'deck' && matchMedia('(max-width:760px) and (orientation:portrait)').matches));
})();
