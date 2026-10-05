/** Escaping-by-default templates: only Markup objects bypass text escaping. */
class Markup {
  constructor(value) { this.value = value; }
  toString() { return this.value; }
}
const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const insert = (value) => value == null || value === false ? '' : value instanceof Markup ? value.value : Array.isArray(value) ? value.map(insert).join('') : escape(value);
export function html(strings, ...values) {
  return new Markup(strings.reduce((output, part, index) => output + part + (index < values.length ? insert(values[index]) : ''), ''));
}
export const arrow = html`<svg viewBox="0 0 28 28" fill="none" aria-hidden="true" class="arrow"><path d="M6 22 22 6M6 6h16v16" stroke="currentColor" stroke-width="1.4"/></svg>`;
export const backArrow = html`<svg viewBox="0 0 28 28" fill="none" aria-hidden="true" class="arrow"><path d="M23 14H5m8-8-8 8 8 8" stroke="currentColor" stroke-width="1.4"/></svg>`;
/** Plain text is intentional: CMS authors cannot inject scripts or handlers. */
export function paragraphs(text, lang) {
  return (text ?? '').split(/\n\s*\n/).filter((part) => part.trim()).map((part) => html`<p${lang ? html` lang="${lang}"` : ''}>${part.split('\n').map((line, index) => html`${index ? html`<br>` : ''}${line}`)}</p>`);
}
