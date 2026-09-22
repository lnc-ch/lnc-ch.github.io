/* Optional enhancement only. Routes, language switching and reading work without JS. */
(() => {
  const key = 'lnc-reading-mode';
  let textMode = false;
  try { textMode = localStorage.getItem(key) === 'text'; } catch { /* Private browsing may deny storage. */ }
  const buttons = document.querySelectorAll('[data-reading-toggle]');
  const apply = () => {
    document.documentElement.dataset.readingMode = textMode ? 'text' : 'paper';
    for (const button of buttons) {
      button.hidden = !document.querySelector('.newspaper');
      button.setAttribute('aria-pressed', String(textMode));
      button.textContent = textMode ? button.dataset.labelPaper : button.dataset.labelText;
    }
  };
  for (const button of buttons) button.addEventListener('click', () => {
    textMode = !textMode;
    try { localStorage.setItem(key, textMode ? 'text' : 'paper'); } catch { /* Reading mode still works for this page. */ }
    apply();
  });
  apply();
})();
