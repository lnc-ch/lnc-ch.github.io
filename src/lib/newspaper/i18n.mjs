/** Localization helpers shared by Astro and the dependency-free specimen preview. */
export const locales = /** @type {const} */ (['ja', 'fr', 'en']);
export const localeLabels = { ja: '日本語', fr: 'FR', en: 'EN' };

export function localizePath(slug, locale) {
  const path = String(slug || '/');
  const suffixAt = path.search(/[?#]/);
  const pathname = suffixAt < 0 ? path : path.slice(0, suffixAt);
  const suffix = suffixAt < 0 ? '' : path.slice(suffixAt);
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  const prefix = locale === 'ja' ? '' : `/${locale}`;
  return `${prefix}${clean ? `/${clean}` : '/'}${suffix}`;
}

export function localizeHref(href, locale) {
  if (!href.startsWith('/') || href.startsWith('//') || /^\/(?:ja|fr|en)(?:\/|[?#]|$)/.test(href)) return href;
  return localizePath(href, locale);
}

export function getLocalizedCopy(copy, locale) {
  return { ...(copy?.ja ?? {}), ...(copy?.[locale] ?? {}) };
}
