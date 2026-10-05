/** Replace only explicitly managed metadata. Bundled CSS and app scripts persist. */
export function syncHead(html, container) {
  const next = new DOMParser().parseFromString(html,'text/html');
  document.head.querySelectorAll('[data-page-head]').forEach(element=>element.remove());
  next.head.querySelectorAll('[data-page-head]').forEach(element=> {
    if (['TITLE','META','LINK'].includes(element.tagName)) document.head.append(document.importNode(element,true));
  });
  document.documentElement.lang = container.dataset.pageLang || 'ja';
  document.title = container.dataset.pageTitle || next.title;
}
export function applyTheme(container) {
  document.documentElement.style.background = container.dataset.pageColor || '#f3f2ed';
  document.documentElement.style.color = container.dataset.pageInk || '#171917';
}
