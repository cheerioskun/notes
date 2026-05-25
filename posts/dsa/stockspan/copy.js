document.querySelectorAll('.block').forEach(block => {
  const btn = document.createElement('button');
  btn.className = 'copy';
  btn.textContent = 'copy';
  btn.addEventListener('click', async () => {
    const text = block.querySelector('pre')?.textContent ?? '';
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = 'copied';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'copy';
        btn.classList.remove('copied');
      }, 1200);
    } catch {
      btn.textContent = 'err';
    }
  });
  block.appendChild(btn);
});
